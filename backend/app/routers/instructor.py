from fastapi import APIRouter, Depends

from app.deps import require_roles


router = APIRouter(prefix="/instructor", tags=["instructor"])


@router.get("/dashboard")
async def dashboard(current_user: dict = Depends(require_roles("instructor"))):
    return {
        "message": f"Welcome to the instructor dashboard, {current_user['full_name']}",
        "role": current_user["role"],
        "actions": ["Review student progress", "Validate attendance", "Submit evaluation"],
    }
