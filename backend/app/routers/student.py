from fastapi import APIRouter, Depends

from app.deps import require_roles
from app.db.mongodb import get_database
from app.services.auth_service import serialize_user


router = APIRouter(prefix="/student", tags=["student"])


@router.get("/search")
async def search_students(
    q: str = "",
    current_user: dict = Depends(require_roles("student", "instructor", "supervisor", "admin")),
):
    db = get_database()
    query: dict = {"role": "student"}
    if q.strip():
        query["$or"] = [
            {"full_name": {"$regex": q.strip(), "$options": "i"}},
            {"role_id": {"$regex": q.strip(), "$options": "i"}},
            {"internship_id": {"$regex": q.strip(), "$options": "i"}},
            {"ojt_position": {"$regex": q.strip(), "$options": "i"}},
        ]
    cursor = db.users.find(query).limit(10)
    return {"users": [serialize_user(u) async for u in cursor]}


@router.get("/dashboard")
async def dashboard(current_user: dict = Depends(require_roles("student"))):
    return {
        "message": f"Welcome to the student dashboard, {current_user['full_name']}",
        "role": current_user["role"],
        "actions": ["Log daily activity", "Submit report", "View progress"],
    }


@router.get("/tasks")
async def get_student_tasks(current_user: dict = Depends(require_roles("student"))):
    db = get_database()
    cursor = db.tasks.find({"student_id": current_user["id"]}).sort("created_at", -1)
    tasks = []
    async for doc in cursor:
        employer_id = doc.get("employer_id")
        employer_avatar_url = None
        if employer_id:
            try:
                from app.routers.supervisor import _oid
                emp_user = await db.users.find_one({"_id": _oid(employer_id)})
                if emp_user:
                    employer_avatar_url = emp_user.get("avatar_url")
            except Exception:
                pass
                
        tasks.append({
            "id": str(doc["_id"]),
            "title": doc.get("title"),
            "description": doc.get("description"),
            "position": doc.get("position"),
            "due_date": doc.get("due_date"),
            "status": doc.get("status"),
            "employer_id": employer_id,
            "employer_name": doc.get("employer_name"),
            "employer_avatar_url": employer_avatar_url,
            "created_at": doc.get("created_at"),
            "completed_at": doc.get("completed_at"),
            "accumulated_seconds": doc.get("accumulated_seconds", 0),
            "last_active_start": doc.get("last_active_start"),
            "attachment_url": doc.get("attachment_url")
        })
    return {"tasks": tasks}
