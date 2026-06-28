from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.deps import require_roles
from app.db.mongodb import get_database
from app.services.auth_service import get_user_by_id, serialize_user


router = APIRouter(prefix="/instructor", tags=["instructor"])


class StudentAdd(BaseModel):
    role_id: str  # STU-XXXXX


class RequiredHoursBody(BaseModel):
    required_hours: float


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
    from bson import ObjectId

    enriched = []
    for s in students:
        user_doc = await db.users.find_one({"role_id": s["role_id"]})
        if user_doc:
            s["ojt_position"] = user_doc.get("ojt_position")
            s["internship_id"] = user_doc.get("internship_id")
            s["avatar_url"] = user_doc.get("avatar_url")
            s["supervisor_id"] = user_doc.get("supervisor_id")
            s["company"] = None
            s["supervisor_name"] = None
            s["supervisor_avatar"] = None
            
            if s["supervisor_id"]:
                sup_id = s["supervisor_id"]
                if ObjectId.is_valid(sup_id):
                    sup_user = await db.users.find_one({"_id": ObjectId(sup_id)})
                else:
                    sup_user = await db.users.find_one({"_id": sup_id})
                
                if sup_user:
                    s["company"] = sup_user.get("company")
                    s["supervisor_name"] = sup_user.get("full_name")
                    s["supervisor_avatar"] = sup_user.get("avatar_url")
        else:
            s["ojt_position"] = None
            s["internship_id"] = None
            s["avatar_url"] = None
            s["supervisor_id"] = None
            s["company"] = None
            s["supervisor_name"] = None
            s["supervisor_avatar"] = None
            
        # Check document status
        required_docs = ['Resume', 'Endorsement Letter', 'Waiver', 'Medical Certificate']
        completed_docs = await db.student_documents.count_documents({
            "student_id": s["user_id"],
            "document_type": {"$in": required_docs}
        })
        s["document_status"] = "Complete" if completed_docs >= len(required_docs) else "Pending"

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


@router.get("/roster/hours")
async def get_roster_hours(current_user: dict = Depends(require_roles("instructor"))):
    db = get_database()
    doc = await db.instructor_rosters.find_one({"instructor_id": current_user["id"]})
    students = doc.get("students", []) if doc else []
    
    student_ids = [s["user_id"] for s in students]
    
    # fetch all attendance
    cursor = db.student_attendance.find({"user_id": {"$in": student_ids}, "payload.validation_status": "validated"})
    
    hours_map = {sid: 0.0 for sid in student_ids}
    async for att in cursor:
        hours_map[att["user_id"]] += att["payload"].get("hours", 0)
        
    result = []
    for s in students:
        user_doc = await db.users.find_one({"role_id": s["role_id"]})
        required_hours = user_doc.get("required_hours", 0) if user_doc else 0
        consumed_hours = hours_map.get(s["user_id"], 0.0)
        result.append({
            "role_id": s["role_id"],
            "full_name": s["full_name"],
            "avatar_url": user_doc.get("avatar_url") if user_doc else None,
            "required_hours": required_hours,
            "consumed_hours": round(consumed_hours, 2),
            "remaining_hours": max(0, required_hours - consumed_hours),
            "updated_at": user_doc.get("updated_at") if user_doc else None
        })
        
    return {"students": result}


@router.put("/student/{role_id}/required-hours")
async def set_required_hours(role_id: str, body: RequiredHoursBody, current_user: dict = Depends(require_roles("instructor"))):
    db = get_database()
    # verify student is in roster
    roster = await db.instructor_rosters.find_one({"instructor_id": current_user["id"], "students.role_id": role_id})
    if not roster:
        raise HTTPException(status_code=403, detail="Student not in your roster")

    await db.users.update_one({"role_id": role_id}, {"$set": {"required_hours": body.required_hours}})
    return {"ok": True, "required_hours": body.required_hours}



@router.get("/supervisors")
async def get_linked_supervisors(current_user: dict = Depends(require_roles("instructor"))):
    db = get_database()
    from bson import ObjectId
    supervisors = []
    cursor = db.employer_rosters.find({"instructors.user_id": current_user["id"]})
    async for doc in cursor:
        try:
            supervisor = await db.users.find_one({"_id": ObjectId(doc["employer_id"])})
        except Exception:
            supervisor = await db.users.find_one({"_id": doc["employer_id"]})
        if supervisor:
            supervisors.append(serialize_user(supervisor))
    return {"supervisors": supervisors}


@router.delete("/supervisor/{employer_id}")
async def unlink_supervisor(employer_id: str, current_user: dict = Depends(require_roles("instructor"))):
    db = get_database()
    result = await db.employer_rosters.update_one(
        {"employer_id": employer_id},
        {"$pull": {"instructors": {"user_id": current_user["id"]}}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Not linked to this supervisor")
    return {"ok": True}


# Keep legacy endpoint for backward compatibility
@router.get("/employers")
async def get_linked_employers(current_user: dict = Depends(require_roles("instructor"))):
    return await get_linked_supervisors(current_user)


# ── Student Companies (instructor views which company students are at) ─────────

@router.get("/student-companies")
async def get_student_companies(current_user: dict = Depends(require_roles("instructor"))):
    """Instructor views which company each student is assigned to for OJT."""
    db = get_database()
    from bson import ObjectId

    # Get instructor's students
    roster_doc = await db.instructor_rosters.find_one({"instructor_id": current_user["id"]})
    students = roster_doc.get("students", []) if roster_doc else []

    # Find all supervisors who have this instructor in their roster
    sup_cursor = db.employer_rosters.find({"instructors.user_id": current_user["id"]})
    companies = {}
    async for sup_doc in sup_cursor:
        sup_id = sup_doc["employer_id"]
        try:
            sup_user = await db.users.find_one({"_id": ObjectId(sup_id)})
        except Exception:
            sup_user = await db.users.find_one({"_id": sup_id})
        if sup_user:
            companies[sup_id] = {
                "supervisor_id": sup_id,
                "supervisor_name": sup_user.get("full_name"),
                "company": sup_user.get("company"),
                "supervisor_role_id": sup_user.get("role_id"),
            }

    # Build student → company mapping
    result = []
    for s in students:
        student_entry = {
            "user_id": s.get("user_id"),
            "role_id": s.get("role_id"),
            "full_name": s.get("full_name"),
        }
        # Enrich with user data
        user_doc = await db.users.find_one({"role_id": s["role_id"]})
        if user_doc:
            student_entry["ojt_position"] = user_doc.get("ojt_position")
            student_entry["avatar_url"] = user_doc.get("avatar_url")
        else:
            student_entry["ojt_position"] = None
            student_entry["avatar_url"] = None

        # Assign company from supervisor (all students under this instructor share the same supervisor(s))
        student_entry["companies"] = list(companies.values())
        result.append(student_entry)

    return {"students": result, "companies": list(companies.values())}


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



# ── Student Documents ──────────────────────────────────────────────────────────

@router.get("/students/{student_id}/documents")
async def get_student_documents(student_id: str, current_user: dict = Depends(require_roles("instructor"))):
    """Instructor views a specific student's documents."""
    db = get_database()
    from bson import ObjectId
    
    def _oid(val: str):
        try:
            return ObjectId(val)
        except Exception:
            return None
            
    oid = _oid(student_id)
    if not oid:
        raise HTTPException(status_code=400, detail="Invalid student ID")
    
    cursor = db.student_documents.find({"student_id": str(oid)}).sort("created_at", -1)
    documents = []
    async for doc in cursor:
        documents.append({
            "id": str(doc["_id"]),
            "document_type": doc.get("document_type"),
            "file_url": doc.get("file_url"),
            "status": doc.get("status"),
            "created_at": doc.get("created_at")
        })
    return {"documents": documents}
