from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.deps import require_roles
from app.db.mongodb import get_database

router = APIRouter(prefix="/ipfs", tags=["ipfs"])

COLLECTIONS = [
    ("activity_logs", "student_activity"),
    ("student_reports", "student_report"),
    ("attendance_records", "attendance_validation"),
    ("performance_evaluations", "performance_evaluation"),
    ("completion_approvals", "completion_approval"),
    ("certificates", "certificate"),
]


def _sort_key(r: dict) -> datetime:
    val = r["created_at"]
    if isinstance(val, datetime):
        return val
    if isinstance(val, str):
        try:
            return datetime.fromisoformat(val)
        except Exception:
            pass
    return datetime.min.replace(tzinfo=timezone.utc)


def _summarize(payload: dict) -> str:
    for key in ("title", "report_title", "internship_title", "recipient_name"):
        if payload.get(key):
            return payload[key]
    for key in ("student_id", "internship_id"):
        if payload.get(key):
            return payload[key]
    return "N/A"


@router.get("/records")
async def list_ipfs_records(
    current_user: dict = Depends(require_roles("student", "instructor", "employer", "admin")),
):
    db = get_database()
    results = []
    for col, _ in COLLECTIONS:
        cursor = db[col].find({}).sort("created_at", -1).limit(200)
        async for doc in cursor:
            blockchain = doc.get("blockchain") or {}
            results.append({
                "id": str(doc["_id"]),
                "record_type": doc.get("record_type", col),
                "user_name": doc.get("user_name"),
                "created_at": doc.get("created_at"),
                "tx_hash": blockchain.get("tx_hash"),
                "ipfs": blockchain.get("ipfs"),
                "polygon": blockchain.get("polygon"),
                "summary": _summarize(doc.get("payload") or {}),
            })
    results.sort(key=_sort_key, reverse=True)
    return {"records": results[:200]}
