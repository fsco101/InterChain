from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.deps import get_current_user
from app.schemas.auth import AuthResponse, UserCreate, UserLogin, UserRead, UserUpdate
from app.services.auth_service import authenticate_user, create_user, get_user_by_email, serialize_user, update_user
from app.utils.security import create_access_token


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
