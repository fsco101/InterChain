import asyncio
import io
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile

from app.core.config import settings

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)


async def upload_avatar(file_bytes: bytes, public_id: str | None = None) -> dict:
    """Upload avatar bytes to Cloudinary in a thread. Returns {url, public_id}."""
    upload_kwargs = {
        "folder": "interchain/avatars",
        "resource_type": "image",
        "overwrite": True,
        "transformation": [{"width": 256, "height": 256, "crop": "fill", "gravity": "face"}],
    }
    if public_id:
        upload_kwargs["public_id"] = public_id

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: cloudinary.uploader.upload(io.BytesIO(file_bytes), **upload_kwargs),
    )
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
    }


async def upload_attendance_photo(file_bytes: bytes) -> dict:
    """Upload an attendance proof photo to Cloudinary. Returns {url, public_id}."""
    upload_kwargs = {
        "folder": "interchain/attendance",
        "resource_type": "image",
        "overwrite": False,
        "transformation": [{"width": 1024, "height": 1024, "crop": "limit"}],
    }

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: cloudinary.uploader.upload(io.BytesIO(file_bytes), **upload_kwargs),
    )
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
    }


async def upload_task_photo(file_bytes: bytes) -> dict:
    """Upload a task completion photo to Cloudinary. Returns {url, public_id}."""
    upload_kwargs = {
        "folder": "interchain/tasks",
        "resource_type": "image",
        "overwrite": False,
        "transformation": [{"width": 1024, "height": 1024, "crop": "limit"}],
    }

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: cloudinary.uploader.upload(io.BytesIO(file_bytes), **upload_kwargs),
    )
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
    }


async def delete_avatar(public_id: str) -> None:
    """Delete an avatar from Cloudinary in a thread."""
    loop = asyncio.get_event_loop()
    try:
        await loop.run_in_executor(
            None,
            lambda: cloudinary.uploader.destroy(public_id, resource_type="image"),
        )
    except Exception:
        pass
