from fastapi import APIRouter, Depends

from app.deps import require_roles
from app.db.mongodb import get_database
from app.services.auth_service import serialize_user


router = APIRouter(prefix="/student", tags=["student"])


@router.get("/search")
async def search_students(
    q: str = "",
    current_user: dict = Depends(require_roles("student", "instructor", "employer", "admin")),
):
    db = get_database()
    query: dict = {"role": "student"}
    if q.strip():
        query["$or"] = [
            {"full_name": {"$regex": q.strip(), "$options": "i"}},
            {"role_id": {"$regex": q.strip(), "$options": "i"}},
            {"internship_id": {"$regex": q.strip(), "$options": "i"}},
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
