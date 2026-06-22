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


async def upload_avatar(avatar_file: UploadFile, public_id: str | None = None) -> dict:
    """Upload avatar to Cloudinary. Returns dict with url and public_id."""
    content = await avatar_file.read()
    if not content:
        raise ValueError("Empty file")

    upload_kwargs = {
        "folder": "interchain/avatars",
        "resource_type": "image",
        "overwrite": True,
        "transformation": [{"width": 256, "height": 256, "crop": "fill", "gravity": "face"}],
    }
    if public_id:
        upload_kwargs["public_id"] = public_id

    result = cloudinary.uploader.upload(io.BytesIO(content), **upload_kwargs)
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
    }


def delete_avatar(public_id: str) -> None:
    """Delete an avatar from Cloudinary by public_id."""
    try:
        cloudinary.uploader.destroy(public_id, resource_type="image")
    except Exception:
        pass
