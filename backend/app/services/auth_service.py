from datetime import datetime, timezone
from pathlib import Path
import base64

from bson import ObjectId
from fastapi import UploadFile

from app.db.mongodb import get_database
from app.schemas.auth import AdminUserUpdate, UserCreate, UserUpdate
from app.utils.security import hash_password, verify_password


async def _avatar_file_to_data_url(avatar_file: UploadFile | None) -> str | None:
    if avatar_file is None:
        return None

    content = await avatar_file.read()
    if not content:
        return None

    media_type = avatar_file.content_type or "application/octet-stream"
    encoded = base64.b64encode(content).decode("ascii")
    return f"data:{media_type};base64,{encoded}"


def serialize_user(document: dict) -> dict:
    return {
        "id": str(document["_id"]),
        "full_name": document["full_name"],
        "email": document["email"],
        "role": document["role"],
        "avatar_url": document.get("avatar_url"),
        "created_at": document.get("created_at"),
        "updated_at": document.get("updated_at"),
    }


def _object_id(user_id: str) -> ObjectId | None:
    try:
        return ObjectId(user_id)
    except (TypeError, ValueError):
        return None


async def get_user_by_email(email: str) -> dict | None:
    database = get_database()
    return await database.users.find_one({"email": email.lower()})


async def get_user_by_id(user_id: str) -> dict | None:
    database = get_database()
    object_id = _object_id(user_id)
    if object_id is None:
        return None
    return await database.users.find_one({"_id": object_id})


async def create_user(user_data: UserCreate, avatar_file: UploadFile | None = None) -> dict:
    database = get_database()
    now = datetime.now(timezone.utc)
    avatar_url = await _avatar_file_to_data_url(avatar_file)
    if avatar_url is None:
        avatar_url = user_data.avatar_url.strip() if user_data.avatar_url else None
    document = {
        "full_name": user_data.full_name.strip(),
        "email": user_data.email.lower().strip(),
        "role": user_data.role.value,
        "avatar_url": avatar_url,
        "password_hash": hash_password(user_data.password),
        "created_at": now,
        "updated_at": now,
    }
    result = await database.users.insert_one(document)
    created_user = await database.users.find_one({"_id": result.inserted_id})
    if created_user is None:
        raise RuntimeError("User creation failed")
    return created_user

async def list_users() -> list[dict]:
    database = get_database()
    cursor = database.users.find({}).sort("created_at", -1)
    return [document async for document in cursor]


async def update_user(user_id: str, updates: UserUpdate | AdminUserUpdate, avatar_file: UploadFile | None = None) -> dict | None:
    database = get_database()
    object_id = _object_id(user_id)
    if object_id is None:
        return None

    update_fields: dict = {"updated_at": datetime.now(timezone.utc)}
    if updates.full_name is not None:
        update_fields["full_name"] = updates.full_name.strip()
    if updates.email is not None:
        update_fields["email"] = updates.email.lower().strip()
    if updates.password is not None:
        update_fields["password_hash"] = hash_password(updates.password)
    avatar_url = await _avatar_file_to_data_url(avatar_file)
    if avatar_url is not None:
        update_fields["avatar_url"] = avatar_url
    elif updates.avatar_url is not None:
        update_fields["avatar_url"] = updates.avatar_url.strip() or None
    role = getattr(updates, "role", None)
    if role is not None:
        update_fields["role"] = role.value

    result = await database.users.update_one({"_id": object_id}, {"$set": update_fields})
    if getattr(result, "matched_count", 0) == 0:
        return None
    return await database.users.find_one({"_id": object_id})


async def delete_user(user_id: str) -> bool:
    database = get_database()
    object_id = _object_id(user_id)
    if object_id is None:
        return False

    result = await database.users.delete_one({"_id": object_id})
    return getattr(result, "deleted_count", 0) > 0


async def authenticate_user(email: str, password: str) -> dict | None:
    user = await get_user_by_email(email)
    if user is None:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return user
