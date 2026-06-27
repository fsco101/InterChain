from datetime import datetime, timezone

from app.db.mongodb import get_database
from app.utils.timezone import get_pht_now, PHT
from app.services.blockchain_service import build_blockchain_metadata_async


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
    blockchain = await build_blockchain_metadata_async(record_type, user["id"], payload)
    document = {
        "record_type": record_type,
        "role": role,
        "user_id": user["id"],
        "user_name": user["full_name"],
        "payload": payload,
        "blockchain": blockchain,
        "created_at": get_pht_now(),
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


async def list_all_records(collection_name: str, user_id: str) -> list[dict]:
    database = get_database()
    cursor = database[collection_name].find({"user_id": user_id}).sort("created_at", -1)
    return [serialize_record(document) async for document in cursor]


async def delete_record(collection_name: str, record_id: str, user_id: str) -> bool:
    from bson import ObjectId
    database = get_database()
    try:
        oid = ObjectId(record_id)
    except Exception:
        return False
    result = await database[collection_name].delete_one({"_id": oid, "user_id": user_id})
    return result.deleted_count > 0


async def delete_records_bulk(collection_name: str, record_ids: list[str], user_id: str) -> int:
    from bson import ObjectId
    database = get_database()
    oids = []
    for rid in record_ids:
        try:
            oids.append(ObjectId(rid))
        except Exception:
            pass
    if not oids:
        return 0
    result = await database[collection_name].delete_many({"_id": {"$in": oids}, "user_id": user_id})
    return result.deleted_count
