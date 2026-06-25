from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.deps import get_current_user, require_roles
from app.schemas.auth import AuthResponse, UserCreate, UserLogin, UserRead, UserUpdate
from app.services.auth_service import authenticate_user, create_user, get_user_by_email, get_user_by_id, serialize_user, update_user
from app.utils.security import create_access_token
from app.db.mongodb import get_database


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse)
async def signup(
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    institution: str | None = Form(None),
    avatar_file: UploadFile | None = File(None),
) -> AuthResponse:
    payload = UserCreate(full_name=full_name, email=email, password=password, role=role, institution=institution)
    existing_user = await get_user_by_email(payload.email)
    if existing_user is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    created_user = await create_user(payload, avatar_file=avatar_file)
    user_data = serialize_user(created_user)
    token = create_access_token({"sub": user_data["id"], "role": user_data["role"]})
    return AuthResponse(access_token=token, user=user_data)


@router.post("/login", response_model=AuthResponse)
async def login(payload: UserLogin) -> AuthResponse:
    user = await authenticate_user(payload.email, payload.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    user_data = serialize_user(user)
    token = create_access_token({"sub": user_data["id"], "role": user_data["role"]})
    return AuthResponse(access_token=token, user=user_data)


@router.get("/me", response_model=UserRead)
async def me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserRead)
async def update_me(
    current_user: dict = Depends(get_current_user),
    full_name: str = Form(...),
    email: str = Form(...),
    password: str | None = Form(None),
    avatar_file: UploadFile | None = File(None),
):
    password = password.strip() if isinstance(password, str) and password.strip() else None
    payload = UserUpdate(full_name=full_name, email=email, password=password)
    updated_user = await update_user(current_user["id"], payload, avatar_file=avatar_file)
    if updated_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return serialize_user(updated_user)


@router.get("/profile/{user_id}")
async def get_user_profile(
    user_id: str,
    current_user: dict = Depends(require_roles("student", "instructor", "employer", "admin")),
):
    """Get a user's public profile with attendance summary, rankings, and OJT position.
    All authenticated roles can view any user's profile."""
    from bson import ObjectId

    db = get_database()

    # Try by user_id (ObjectId) first, then by role_id
    user = await get_user_by_id(user_id)
    if not user:
        user = await db.users.find_one({"role_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = serialize_user(user)

    # If student, add attendance summary + rankings
    if profile["role"] == "student":
        sid = profile["id"]

        # Attendance summary
        cursor = db.student_attendance.find({"user_id": sid})
        total_hours = 0.0
        validated_hours = 0.0
        total_days = 0
        async for doc in cursor:
            h = doc["payload"].get("hours", 0)
            total_hours += h
            total_days += 1
            if doc["payload"].get("validation_status") == "validated":
                validated_hours += h

        profile["attendance_summary"] = {
            "total_hours": round(total_hours, 2),
            "validated_hours": round(validated_hours, 2),
            "total_days": total_days,
        }

        # Rankings from employer evaluations
        role_id = profile.get("role_id")
        if role_id:
            cursor = db.employer_evaluations.find({"payload.student_id": role_id})
            scores = [ev["payload"]["score"] async for ev in cursor]
            if scores:
                avg = round(sum(scores) / len(scores), 2)
                profile["evaluation_summary"] = {
                    "avg_score": avg,
                    "eval_count": len(scores),
                }
            else:
                profile["evaluation_summary"] = None
        else:
            profile["evaluation_summary"] = None

        # Tasks assigned to this student
        cursor = db.tasks.find({"student_ids": sid, "status": {"$ne": "cancelled"}}).sort("created_at", -1).limit(10)
        tasks = []
        async for doc in cursor:
            tasks.append({
                "id": str(doc["_id"]),
                "title": doc["title"],
                "position": doc["position"],
                "status": doc.get("status", "pending"),
                "due_date": doc.get("due_date"),
            })
        profile["tasks"] = tasks

    elif profile["role"] == "instructor":
        role_id = profile.get("role_id")
        if role_id:
            roster = await db.instructor_rosters.find_one({"instructor_id": role_id})
            student_count = len(roster.get("student_ids", [])) if roster else 0
            
            cursor = db.employer_rosters.find({"instructor_ids": role_id})
            employer_count = len([doc async for doc in cursor])
            
            profile["instructor_summary"] = {
                "student_count": student_count,
                "employer_count": employer_count
            }

    elif profile["role"] == "employer":
        role_id = profile.get("role_id")
        if role_id:
            roster = await db.employer_rosters.find_one({"employer_id": role_id})
            instructor_count = len(roster.get("instructor_ids", [])) if roster else 0
            
            task_count = await db.tasks.count_documents({"employer_id": role_id})
            pos_count = await db.positions.count_documents({"employer_id": role_id})
            
            profile["employer_summary"] = {
                "instructor_count": instructor_count,
                "task_count": task_count,
                "position_count": pos_count
            }

    return profile
