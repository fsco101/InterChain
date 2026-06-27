from typing import Callable

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.core.config import settings
from app.schemas.auth import UserRole
from app.services.auth_service import get_user_by_id, serialize_user


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if not user_id:
            raise credentials_error
        ObjectId(user_id)
    except (JWTError, InvalidId, TypeError):
        raise credentials_error from None

    user = await get_user_by_id(user_id)
    if user is None:
        raise credentials_error
    return serialize_user(user)


def require_roles(*allowed_roles: str) -> Callable:
    # Expand allowed roles: if "supervisor" is allowed, also accept legacy "employer"
    expanded = set(allowed_roles)
    if "supervisor" in expanded:
        expanded.add("employer")

    async def role_dependency(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user["role"] not in expanded:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource",
            )
        return current_user

    return role_dependency
