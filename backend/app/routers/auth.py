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
    company: str | None = Form(None),
    avatar_file: UploadFile | None = File(None),
) -> AuthResponse:
    payload = UserCreate(full_name=full_name, email=email, password=password, role=role, institution=institution, company=company)
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
    contact_number: str | None = Form(None),
    password: str | None = Form(None),
    avatar_file: UploadFile | None = File(None),
):
    password = password.strip() if isinstance(password, str) and password.strip() else None
    payload = UserUpdate(full_name=full_name, email=email, contact_number=contact_number, password=password)
    updated_user = await update_user(current_user["id"], payload, avatar_file=avatar_file)
    if updated_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return serialize_user(updated_user)


@router.get("/profile/{user_id}")
async def get_user_profile(
    user_id: str,
    current_user: dict = Depends(require_roles("student", "instructor", "supervisor", "admin")),
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

        # Activity summary
        cursor = db.activity_logs.find({"user_id": sid})
        activity_hours = 0.0
        activity_days = 0
        async for doc in cursor:
            activity_hours += doc["payload"].get("hours_spent", 0)
            activity_days += 1
        
        profile["activity_summary"] = {
            "total_hours": round(activity_hours, 2),
            "total_days": activity_days,
        }

        # Rankings from supervisor evaluations
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

        # Determine Instructor and Supervisor
        instructor_doc = await db.instructor_rosters.find_one({"students.role_id": role_id}) if role_id else None
        instructor_info = None
        supervisor_info = None

        if instructor_doc:
            from bson import ObjectId
            ins_id = instructor_doc["instructor_id"]
            if ObjectId.is_valid(ins_id):
                instructor_user = await db.users.find_one({"_id": ObjectId(ins_id)})
            else:
                instructor_user = await db.users.find_one({"_id": ins_id})

            if instructor_user:
                instructor_info = {
                    "id": str(instructor_user["_id"]),
                    "full_name": instructor_user.get("full_name"),
                    "role_id": instructor_user.get("role_id"),
                    "avatar_url": instructor_user.get("avatar_url")
                }

        # Check explicit supervisor link first
        explicit_sup_id = profile.get("supervisor_id")
        if explicit_sup_id:
            from bson import ObjectId
            if ObjectId.is_valid(explicit_sup_id):
                supervisor_user = await db.users.find_one({"_id": ObjectId(explicit_sup_id)})
            else:
                supervisor_user = await db.users.find_one({"_id": explicit_sup_id})
        else:
            # Fallback to instructor's supervisor roster
            supervisor_user = None
            if instructor_info:
                supervisor_doc = await db.employer_rosters.find_one({"instructors.user_id": instructor_info["id"]})
                if supervisor_doc:
                    sup_id = supervisor_doc["employer_id"]
                    if ObjectId.is_valid(sup_id):
                        supervisor_user = await db.users.find_one({"_id": ObjectId(sup_id)})
                    else:
                        supervisor_user = await db.users.find_one({"_id": sup_id})
        
        if supervisor_user:
            supervisor_info = {
                "id": str(supervisor_user["_id"]),
                "full_name": supervisor_user.get("full_name"),
                "role_id": supervisor_user.get("role_id"),
                "avatar_url": supervisor_user.get("avatar_url"),
                "company": supervisor_user.get("company"),
            }

        profile["supervisors"] = {
            "instructor": instructor_info,
            "supervisor": supervisor_info
        }

        # Tasks assigned to this student
        cursor = db.tasks.find({"student_id": sid, "status": {"$ne": "cancelled"}}).sort("created_at", -1).limit(10)
        tasks = []
        async for doc in cursor:
            tasks.append({
                "id": str(doc["_id"]),
                "title": doc["title"],
                "position": doc["position"],
                "status": doc.get("status", "pending"),
                "due_date": doc.get("due_date"),
                "accumulated_seconds": doc.get("accumulated_seconds", 0),
                "last_active_start": doc.get("last_active_start")
            })
        profile["tasks"] = tasks

    elif profile["role"] == "instructor":
        user_id = profile.get("id")
        if user_id:
            roster = await db.instructor_rosters.find_one({"instructor_id": user_id})
            students = roster.get("students", []) if roster else []
            
            enriched_students = []
            for s in students:
                s_user = await db.users.find_one({"role_id": s["role_id"]})
                if s_user:
                    enriched_students.append({
                        "user_id": str(s_user["_id"]),
                        "role_id": s["role_id"],
                        "full_name": s_user.get("full_name", s.get("full_name")),
                        "avatar_url": s_user.get("avatar_url")
                    })
                else:
                    enriched_students.append(s)

            cursor = db.employer_rosters.find({"instructors.user_id": user_id})
            supervisors = []
            async for doc in cursor:
                sup_user = await db.users.find_one({"_id": ObjectId(doc["employer_id"]) if ObjectId.is_valid(doc["employer_id"]) else doc["employer_id"]})
                if sup_user:
                    supervisors.append({
                        "user_id": str(sup_user["_id"]),
                        "full_name": sup_user.get("full_name", "Unknown"),
                        "company": sup_user.get("company", "Unknown"),
                        "avatar_url": sup_user.get("avatar_url")
                    })
            
            profile["instructor_summary"] = {
                "student_count": len(enriched_students),
                "supervisor_count": len(supervisors),
                "students": enriched_students,
                "supervisors": supervisors
            }

    elif profile["role"] == "supervisor":
        user_id = profile.get("id")
        if user_id:
            roster = await db.employer_rosters.find_one({"employer_id": user_id})
            instructors = roster.get("instructors", []) if roster else []
            
            enriched_instructors = []
            for ins in instructors:
                ins_user = await db.users.find_one({"role_id": ins.get("role_id")})
                if ins_user:
                    enriched_instructors.append({
                        "user_id": str(ins_user["_id"]),
                        "role_id": ins.get("role_id"),
                        "full_name": ins_user.get("full_name", ins.get("full_name")),
                        "avatar_url": ins_user.get("avatar_url")
                    })
                else:
                    enriched_instructors.append(ins)
            
            task_count = await db.tasks.count_documents({"employer_id": user_id})
            pos_count = await db.positions.count_documents({"employer_id": user_id})
            
            # Linked Students
            cursor = db.users.find({"supervisor_id": user_id, "role": "student"})
            linked_students = []
            async for doc in cursor:
                linked_students.append({
                    "user_id": str(doc["_id"]),
                    "full_name": doc.get("full_name", "Unknown"),
                    "role_id": doc.get("role_id"),
                    "avatar_url": doc.get("avatar_url")
                })
            
            profile["supervisor_summary"] = {
                "instructor_count": len(enriched_instructors),
                "task_count": task_count,
                "position_count": pos_count,
                "student_count": len(linked_students),
                "instructors": enriched_instructors,
                "students": linked_students
            }

    return profile
