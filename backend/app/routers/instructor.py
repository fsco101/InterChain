from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.deps import require_roles
from app.db.mongodb import get_database
from app.services.auth_service import get_user_by_id, serialize_user


router = APIRouter(prefix="/instructor", tags=["instructor"])


class StudentAdd(BaseModel):
    role_id: str  # STU-XXXXX


@router.get("/search")
async def search_users(
    q: str = "",
    role: str = "student",
    current_user: dict = Depends(require_roles("instructor")),
):
    db = get_database()
    query: dict = {"role": role}
    if q.strip():
        query["$or"] = [
            {"full_name": {"$regex": q.strip(), "$options": "i"}},
            {"role_id": {"$regex": q.strip(), "$options": "i"}},
            {"email": {"$regex": q.strip(), "$options": "i"}},
            {"internship_id": {"$regex": q.strip(), "$options": "i"}},
            {"ojt_position": {"$regex": q.strip(), "$options": "i"}},
        ]
    cursor = db.users.find(query).limit(10)
    return {"users": [serialize_user(u) async for u in cursor]}


@router.get("/dashboard")
async def dashboard(current_user: dict = Depends(require_roles("instructor"))):
    return {
        "message": f"Welcome to the instructor dashboard, {current_user['full_name']}",
        "role": current_user["role"],
        "actions": ["Review student progress", "View attendance", "View rankings"],
    }


# ── Instructor Roster ──────────────────────────────────────────────────────────

@router.get("/roster")
async def get_roster(current_user: dict = Depends(require_roles("instructor"))):
    db = get_database()
    doc = await db.instructor_rosters.find_one({"instructor_id": current_user["id"]})
    students = doc.get("students", []) if doc else []
    # Enrich with ojt_position
    enriched = []
    for s in students:
        user_doc = await db.users.find_one({"role_id": s["role_id"]})
        s["ojt_position"] = user_doc.get("ojt_position") if user_doc else None
        enriched.append(s)
    return {"students": enriched}


@router.post("/roster/add", status_code=status.HTTP_201_CREATED)
async def add_student(body: StudentAdd, current_user: dict = Depends(require_roles("instructor"))):
    db = get_database()
    # search by role_id OR by the role_id prefix pattern if not found
    student = await db.users.find_one({"role_id": body.role_id, "role": "student"})
    if not student:
        # fallback: case-insensitive match
        student = await db.users.find_one({"role_id": {"$regex": f"^{body.role_id}$", "$options": "i"}, "role": "student"})
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found. Make sure the Student ID is correct (e.g. STU-12345).")

    s = serialize_user(student)
    entry = {
        "user_id": s["id"],
        "role_id": s["role_id"],
        "full_name": s["full_name"],
        "email": s["email"],
        "institution": s.get("institution"),
    }

    # check not already in roster
    existing_doc = await db.instructor_rosters.find_one(
        {"instructor_id": current_user["id"], "students.user_id": s["id"]}
    )
    if existing_doc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Student already in your roster")

    await db.instructor_rosters.update_one(
        {"instructor_id": current_user["id"]},
        {"$push": {"students": entry}},
        upsert=True,
    )
    return {"message": f"Student {body.role_id} added to roster", "student": entry}


@router.delete("/roster/{role_id}")
async def remove_student(role_id: str, current_user: dict = Depends(require_roles("instructor"))):
    db = get_database()
    result = await db.instructor_rosters.update_one(
        {"instructor_id": current_user["id"]},
        {"$pull": {"students": {"role_id": role_id}}},
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not in roster")
    return {"message": f"Student {role_id} removed"}


@router.get("/employers")
async def get_linked_employers(current_user: dict = Depends(require_roles("instructor"))):
    db = get_database()
    from bson import ObjectId
    employers = []
    cursor = db.employer_rosters.find({"instructors.user_id": current_user["id"]})
    async for doc in cursor:
        try:
            employer = await db.users.find_one({"_id": ObjectId(doc["employer_id"])})
        except Exception:
            employer = await db.users.find_one({"_id": doc["employer_id"]})
        if employer:
            employers.append(serialize_user(employer))
    return {"employers": employers}


# ── Student Attendance (read-only for instructor) ──────────────────────────────

@router.get("/student-attendance")
async def get_student_attendance(current_user: dict = Depends(require_roles("instructor"))):
    """Instructor views attendance records for students in their roster (read-only)."""
    db = get_database()
    doc = await db.instructor_rosters.find_one({"instructor_id": current_user["id"]})
    students = doc.get("students", []) if doc else []
    student_ids = [s["user_id"] for s in students]

    if not student_ids:
        return {"attendance": []}

    from app.services.records_service import serialize_record
    cursor = db.student_attendance.find({"user_id": {"$in": student_ids}}).sort("created_at", -1).limit(100)
    return {"attendance": [serialize_record(doc) async for doc in cursor]}


# ── Rankings (read-only for instructor) ────────────────────────────────────────

@router.get("/rankings")
async def get_rankings(current_user: dict = Depends(require_roles("instructor"))):
    """Instructor views rankings for students in their roster (read-only).
    Rankings are based on employer evaluations."""
    db = get_database()
    doc = await db.instructor_rosters.find_one({"instructor_id": current_user["id"]})
    students = doc.get("students", []) if doc else []
    student_role_ids = [s["role_id"] for s in students]

    if not student_role_ids:
        return {"overall": [], "by_school": {}, "by_position": {}}

    # Find evaluations for these students
    cursor = db.employer_evaluations.find({"payload.student_id": {"$in": student_role_ids}}).sort("created_at", -1)
    evaluations = [ev async for ev in cursor]

    if not evaluations:
        return {"overall": [], "by_school": {}, "by_position": {}}

    student_scores = {}
    for ev in evaluations:
        sid = ev["payload"]["student_id"]
        if sid not in student_scores:
            student_scores[sid] = {"scores": [], "student_id": sid}
        student_scores[sid]["scores"].append(ev["payload"]["score"])

    for sid, data in student_scores.items():
        user = await db.users.find_one({"role_id": sid})
        if user:
            data["full_name"] = user.get("full_name", "Unknown")
            data["institution"] = user.get("institution")
            data["ojt_position"] = user.get("ojt_position")
            data["avatar_url"] = user.get("avatar_url")
            data["user_id"] = str(user["_id"])
        else:
            data["full_name"] = sid
            data["institution"] = None
            data["ojt_position"] = None
            data["avatar_url"] = None
            data["user_id"] = None
        data["avg_score"] = round(sum(data["scores"]) / len(data["scores"]), 2)
        data["eval_count"] = len(data["scores"])

    ranked = sorted(student_scores.values(), key=lambda x: x["avg_score"], reverse=True)
    overall = [{"rank": i + 1, **{k: v for k, v in r.items() if k != "scores"}} for i, r in enumerate(ranked)]

    by_school = {}
    for r in ranked:
        school = r.get("institution") or "Unknown"
        if school not in by_school:
            by_school[school] = []
        by_school[school].append(r)
    for school in by_school:
        by_school[school] = sorted(by_school[school], key=lambda x: x["avg_score"], reverse=True)
        by_school[school] = [{"rank": i + 1, **{k: v for k, v in r.items() if k != "scores"}} for i, r in enumerate(by_school[school])]

    by_position = {}
    for r in ranked:
        pos = r.get("ojt_position") or "Unassigned"
        if pos not in by_position:
            by_position[pos] = []
        by_position[pos].append(r)
    for pos in by_position:
        by_position[pos] = sorted(by_position[pos], key=lambda x: x["avg_score"], reverse=True)
        by_position[pos] = [{"rank": i + 1, **{k: v for k, v in r.items() if k != "scores"}} for i, r in enumerate(by_position[pos])]

    return {"overall": overall, "by_school": by_school, "by_position": by_position}
