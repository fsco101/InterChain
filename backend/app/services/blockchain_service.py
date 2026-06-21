import hashlib
import json
import os
from datetime import datetime, timezone


def _canonicalize_payload(payload: dict) -> str:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)


def build_blockchain_metadata(record_type: str, user_id: str, payload: dict) -> dict:
    tx_seed = {
        "record_type": record_type,
        "user_id": user_id,
        "payload": payload,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    tx_hash = hashlib.sha256(_canonicalize_payload(tx_seed).encode("utf-8")).hexdigest()
    explorer_base = os.getenv("BLOCKCHAIN_EXPLORER_BASE", "https://explorer.local/tx")

    return {
        "enabled": os.getenv("BLOCKCHAIN_ENABLED", "true").lower() == "true",
        "tx_hash": f"0x{tx_hash}",
        "explorer_url": f"{explorer_base}/0x{tx_hash}",
        "network": os.getenv("BLOCKCHAIN_NETWORK", "private-simulated"),
        "recorded_at": datetime.now(timezone.utc),
        "status": "confirmed",
    }
