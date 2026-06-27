from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.deps import require_roles
from app.utils.timezone import get_pht_now, PHT
from app.db.mongodb import get_database

router = APIRouter(prefix="/notifications", tags=["notifications"])


class BulkBody(BaseModel):
    ids: list[str]


def _serialize(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "user_id": doc["user_id"],
        "title": doc["title"],
        "message": doc.get("message", ""),
        "type": doc.get("type", "info"),
        "read": doc.get("read", False),
        "created_at": doc["created_at"],
    }


def _oid(val: str):
    try:
        return ObjectId(val)
    except Exception:
        return None


@router.get("")
async def list_notifications(current_user: dict = Depends(require_roles("student", "instructor", "supervisor", "admin"))):
    db = get_database()
    cursor = db.notifications.find({"user_id": current_user["id"]}).sort("created_at", -1).limit(100)
    items = [_serialize(d) async for d in cursor]
    unread = sum(1 for n in items if not n["read"])
    return {"notifications": items, "unread": unread}


@router.patch("/{notif_id}/read")
async def mark_read(notif_id: str, current_user: dict = Depends(require_roles("student", "instructor", "supervisor", "admin"))):
    db = get_database()
    oid = _oid(notif_id)
    if oid:
        await db.notifications.update_one({"_id": oid, "user_id": current_user["id"]}, {"$set": {"read": True}})
    return {"ok": True}


@router.patch("/read-all")
async def mark_all_read(current_user: dict = Depends(require_roles("student", "instructor", "supervisor", "admin"))):
    db = get_database()
    await db.notifications.update_many({"user_id": current_user["id"], "read": False}, {"$set": {"read": True}})
    return {"ok": True}


@router.delete("/{notif_id}")
async def delete_notification(notif_id: str, current_user: dict = Depends(require_roles("student", "instructor", "supervisor", "admin"))):
    db = get_database()
    oid = _oid(notif_id)
    if oid:
        await db.notifications.delete_one({"_id": oid, "user_id": current_user["id"]})
    return {"ok": True}


@router.post("/bulk-delete")
async def bulk_delete(body: BulkBody, current_user: dict = Depends(require_roles("student", "instructor", "supervisor", "admin"))):
    db = get_database()
    oids = [o for o in (_oid(i) for i in body.ids) if o]
    if oids:
        await db.notifications.delete_many({"_id": {"$in": oids}, "user_id": current_user["id"]})
    return {"ok": True}


# Internal helper used by other routers to push a notification
async def push_notification(db, user_id: str, title: str, message: str, notif_type: str = "info"):
    await db.notifications.insert_one({
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": notif_type,
        "read": False,
        "created_at": get_pht_now(),
    })
