from fastapi import APIRouter, Depends

from app.deps import require_roles


router = APIRouter(prefix="/student", tags=["student"])


@router.get("/dashboard")
async def dashboard(current_user: dict = Depends(require_roles("student"))):
    return {
        "message": f"Welcome to the student dashboard, {current_user['full_name']}",
        "role": current_user["role"],
        "actions": ["Log daily activity", "Submit report", "View progress"],
    }
