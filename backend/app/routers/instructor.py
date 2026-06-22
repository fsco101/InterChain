from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.deps import require_roles
from app.db.mongodb import get_database
from app.services.auth_service import get_user_by_id, serialize_user


router = APIRouter(prefix="/instructor", tags=["instructor"])


class StudentAdd(BaseModel):
    role_id: str  # STU-XXXXX


@router.get("/dashboard")
async def dashboard(current_user: dict = Depends(require_roles("instructor"))):
    return {
        "message": f"Welcome to the instructor dashboard, {current_user['full_name']}",
        "role": current_user["role"],
        "actions": ["Review student progress", "Validate attendance", "Submit evaluation"],
    }


@router.get("/roster")
async def get_roster(current_user: dict = Depends(require_roles("instructor"))):
    db = get_database()
    doc = await db.instructor_rosters.find_one({"instructor_id": current_user["id"]})
    students = doc.get("students", []) if doc else []
    return {"students": students}


@router.post("/roster/add", status_code=status.HTTP_201_CREATED)
async def add_student(body: StudentAdd, current_user: dict = Depends(require_roles("instructor"))):
    db = get_database()
    # find user by role_id
    student = await db.users.find_one({"role_id": body.role_id, "role": "student"})
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    s = serialize_user(student)
    entry = {
        "user_id": s["id"],
        "role_id": s["role_id"],
        "full_name": s["full_name"],
        "email": s["email"],
        "institution": s.get("institution"),
    }

    await db.instructor_rosters.update_one(
        {"instructor_id": current_user["id"]},
        {"$addToSet": {"students": entry}},
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
