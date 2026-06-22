from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.deps import require_roles
from app.db.mongodb import get_database
from app.schemas.auth import AdminUserUpdate, UserCreate, UserRead, UserRole
from app.services.auth_service import create_user, delete_user, list_users, serialize_user, update_user
from app.services.records_service import list_records


router = APIRouter(prefix="/admin", tags=["admin"])


class RolePatch(BaseModel):
    role: UserRole


@router.get("/dashboard")
async def dashboard(current_user: dict = Depends(require_roles("admin"))):
    database = get_database()
    return {
        "message": f"Welcome to the admin dashboard, {current_user['full_name']}",
        "role": current_user["role"],
        "actions": ["Review internship records", "Register users", "Monitor blockchain events"],
        "counts": {
            "users": await database.users.count_documents({}),
            "activity_logs": await database.activity_logs.count_documents({}),
            "student_reports": await database.student_reports.count_documents({}),
            "attendance_records": await database.attendance_records.count_documents({}),
            "performance_evaluations": await database.performance_evaluations.count_documents({}),
            "completion_approvals": await database.completion_approvals.count_documents({}),
        },
    }


@router.get("/review")
async def review_records(current_user: dict = Depends(require_roles("admin"))):
    records = []
    for collection_name, record_type in [
        ("activity_logs", "student_activity"),
        ("student_reports", "student_report"),
        ("attendance_records", "attendance_validation"),
        ("performance_evaluations", "performance_evaluation"),
        ("completion_approvals", "completion_approval"),
    ]:
        for record in await list_records(collection_name, limit=25):
            record["collection"] = collection_name
            record["record_type"] = record_type
            records.append(record)

    records.sort(key=lambda record: record["created_at"], reverse=True)
    return {"records": records[:50]}


@router.get("/users")
async def users(current_user: dict = Depends(require_roles("admin"))):
    return {"users": [serialize_user(user) for user in await list_users()]}


@router.post("/users/backfill-role-ids")
async def backfill_role_ids(current_user: dict = Depends(require_roles("admin"))):
    """One-time migration: assign role_id to all users that are missing it."""
    from app.services.auth_service import _generate_role_id
    database = get_database()
    cursor = database.users.find({"role_id": {"$exists": False}})
    updated = 0
    async for user in cursor:
        role_id = _generate_role_id(user["role"])
        await database.users.update_one({"_id": user["_id"]}, {"$set": {"role_id": role_id}})
        updated += 1
    return {"message": f"Backfilled role_id for {updated} user(s)"}


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user_admin(
    current_user: dict = Depends(require_roles("admin")),
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    avatar_file: UploadFile | None = File(None),
):
    payload = UserCreate(full_name=full_name, email=email, password=password, role=role)
    created_user = await create_user(payload, avatar_file=avatar_file)
    return serialize_user(created_user)


@router.put("/users/{user_id}", response_model=UserRead)
async def update_user_admin(
    user_id: str,
    current_user: dict = Depends(require_roles("admin")),
    full_name: str = Form(...),
    email: str = Form(...),
    password: str | None = Form(None),
    role: str = Form(...),
    avatar_file: UploadFile | None = File(None),
):
    password = password.strip() if isinstance(password, str) and password.strip() else None
    payload = AdminUserUpdate(full_name=full_name, email=email, password=password, role=role)
    updated_user = await update_user(user_id, payload, avatar_file=avatar_file)
    if updated_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return serialize_user(updated_user)


@router.patch("/users/{user_id}/role", response_model=UserRead)
async def patch_user_role(
    user_id: str,
    body: RolePatch,
    current_user: dict = Depends(require_roles("admin")),
):
    if current_user["id"] == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot change your own role")
    payload = AdminUserUpdate(role=body.role)
    updated_user = await update_user(user_id, payload)
    if updated_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return serialize_user(updated_user)


@router.delete("/users/{user_id}")
async def remove_user(user_id: str, current_user: dict = Depends(require_roles("admin"))):
    if current_user["id"] == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete your own account")

    removed = await delete_user(user_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"message": "User deleted"}
