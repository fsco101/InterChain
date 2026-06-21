from datetime import datetime, timezone

from app.db.mongodb import get_database
from app.services.blockchain_service import build_blockchain_metadata


def serialize_record(document: dict) -> dict:
    return {
        "id": str(document["_id"]),
        "record_type": document["record_type"],
        "role": document["role"],
        "user_id": document["user_id"],
        "user_name": document.get("user_name"),
        "created_at": document["created_at"],
        "payload": document["payload"],
        "blockchain": document.get("blockchain"),
    }


async def create_record(collection_name: str, record_type: str, role: str, user: dict, payload: dict) -> dict:
    database = get_database()
    blockchain = build_blockchain_metadata(record_type, user["id"], payload)
    document = {
        "record_type": record_type,
        "role": role,
        "user_id": user["id"],
        "user_name": user["full_name"],
        "payload": payload,
        "blockchain": blockchain,
        "created_at": datetime.now(timezone.utc),
    }
    result = await database[collection_name].insert_one(document)
    created_record = await database[collection_name].find_one({"_id": result.inserted_id})
    if created_record is None:
        raise RuntimeError("Failed to create record")
    return serialize_record(created_record)


async def list_records(collection_name: str, user_id: str | None = None, limit: int = 10) -> list[dict]:
    database = get_database()
    query = {"user_id": user_id} if user_id else {}
    cursor = database[collection_name].find(query).sort("created_at", -1).limit(limit)
    return [serialize_record(document) async for document in cursor]
