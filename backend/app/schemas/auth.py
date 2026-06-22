from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class UserRole(str, Enum):
    student = "student"
    instructor = "instructor"
    employer = "employer"
    admin = "admin"


class UserBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    role: UserRole
    avatar_url: str | None = None
    institution: str | None = None


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)

class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    email: str | None = Field(default=None, min_length=5, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    avatar_url: str | None = None

class AdminUserUpdate(UserUpdate):
    role: UserRole | None = None


class UserLogin(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class UserRead(UserBase):
    id: str
    role_id: str | None = None
    internship_id: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
