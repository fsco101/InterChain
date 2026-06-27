from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from app.utils.timezone import get_pht_now, PHT
from app.core.config import settings


pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def create_access_token(payload: dict) -> str:
    token_payload = payload.copy()
    expire_at = get_pht_now() + timedelta(minutes=settings.jwt_expires_minutes)
    token_payload.update({"exp": expire_at})
    return jwt.encode(token_payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
