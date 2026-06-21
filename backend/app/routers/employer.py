from fastapi import APIRouter, Depends

from app.deps import require_roles


router = APIRouter(prefix="/employer", tags=["employer"])


@router.get("/dashboard")
async def dashboard(current_user: dict = Depends(require_roles("employer"))):
    return {
        "message": f"Welcome to the employer dashboard, {current_user['full_name']}",
        "role": current_user["role"],
        "actions": ["Validate attendance", "Approve completion", "Review performance"],
    }
