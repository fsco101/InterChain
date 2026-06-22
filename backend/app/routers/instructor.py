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
        ]
    cursor = db.users.find(query).limit(10)
    return {"users": [serialize_user(u) async for u in cursor]}


@router.get("/dashboard")
async def dashboard(current_user: dict = Depends(require_roles("instructor"))):
    return {
        "message": f"Welcome to the instructor dashboard, {current_user['full_name']}",
        "role": current_user["role"],
        "actions": ["Review student progress", "Validate attendance", "Submit evaluation"],
    }


# ── Instructor Roster ──────────────────────────────────────────────────────────

@router.get("/roster")
async def get_roster(current_user: dict = Depends(require_roles("instructor"))):
    db = get_database()
    doc = await db.instructor_rosters.find_one({"instructor_id": current_user["id"]})
    students = doc.get("students", []) if doc else []
    return {"students": students}


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
