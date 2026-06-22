import random
import string
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import UploadFile

from app.db.mongodb import get_database
from app.schemas.auth import AdminUserUpdate, UserCreate, UserUpdate
from app.services.cloudinary_service import delete_avatar, upload_avatar
from app.utils.security import hash_password, verify_password


async def _handle_avatar(avatar_file: UploadFile | None, old_public_id: str | None = None) -> tuple[str | None, str | None]:
    """Read avatar file and upload to Cloudinary. Returns (url, public_id) or (None, None)."""
    if avatar_file is None:
        return None, None
    content = await avatar_file.read()
    if not content:
        return None, None
    result = await upload_avatar(content, public_id=old_public_id)
    return result["url"], result["public_id"]


def _generate_role_id(role: str) -> str:
    prefix = {"student": "STU", "instructor": "INS", "employer": "EMP", "admin": "ADM"}.get(role, "USR")
    suffix = ''.join(random.choices(string.digits, k=5))
    return f"{prefix}-{suffix}"


def _generate_internship_id() -> str:
    suffix = ''.join(random.choices(string.digits, k=5))
    return f"INT-{suffix}"


def serialize_user(document: dict) -> dict:
    return {
        "id": str(document["_id"]),
        "full_name": document["full_name"],
        "email": document["email"],
        "role": document["role"],
        "role_id": document.get("role_id"),
        "internship_id": document.get("internship_id"),
        "institution": document.get("institution"),
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
    user = await database.users.find_one({"_id": object_id})
    if user:
        backfill: dict = {}
        if not user.get("role_id"):
            backfill["role_id"] = _generate_role_id(user["role"])
        if user["role"] == "student" and not user.get("internship_id"):
            backfill["internship_id"] = _generate_internship_id()
        if backfill:
            await database.users.update_one({"_id": object_id}, {"$set": backfill})
            user.update(backfill)
    return user


async def create_user(user_data: UserCreate, avatar_file: UploadFile | None = None) -> dict:
    database = get_database()
    now = datetime.now(timezone.utc)
    avatar_url, avatar_public_id = await _handle_avatar(avatar_file)
    if avatar_url is None:
        avatar_url = user_data.avatar_url.strip() if user_data.avatar_url else None
    role_value = user_data.role.value
    document = {
        "full_name": user_data.full_name.strip(),
        "email": user_data.email.lower().strip(),
        "role": role_value,
        "role_id": _generate_role_id(role_value),
        "internship_id": _generate_internship_id() if role_value == "student" else None,
        "institution": user_data.institution.strip() if user_data.institution else None,
        "avatar_url": avatar_url,
        "avatar_public_id": avatar_public_id,
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

    existing = await database.users.find_one({"_id": object_id})
    if existing is None:
        return None

    update_fields: dict = {"updated_at": datetime.now(timezone.utc)}
    if updates.full_name is not None:
        update_fields["full_name"] = updates.full_name.strip()
    if updates.email is not None:
        update_fields["email"] = updates.email.lower().strip()
    if updates.password is not None:
        update_fields["password_hash"] = hash_password(updates.password)

    avatar_url, avatar_public_id = await _handle_avatar(
        avatar_file, old_public_id=existing.get("avatar_public_id")
    )
    if avatar_url is not None:
        update_fields["avatar_url"] = avatar_url
        update_fields["avatar_public_id"] = avatar_public_id
    elif updates.avatar_url is not None:
        update_fields["avatar_url"] = updates.avatar_url.strip() or None

    role = getattr(updates, "role", None)
    if role is not None:
        update_fields["role"] = role.value

    await database.users.update_one({"_id": object_id}, {"$set": update_fields})
    return await database.users.find_one({"_id": object_id})


async def delete_user(user_id: str) -> bool:
    database = get_database()
    object_id = _object_id(user_id)
    if object_id is None:
        return False

    existing = await database.users.find_one({"_id": object_id})
    if existing and existing.get("avatar_public_id"):
        await delete_avatar(existing["avatar_public_id"])

    result = await database.users.delete_one({"_id": object_id})
    return getattr(result, "deleted_count", 0) > 0


async def authenticate_user(email: str, password: str) -> dict | None:
    user = await get_user_by_email(email)
    if user is None:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return user
