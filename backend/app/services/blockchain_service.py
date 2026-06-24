import hashlib
import json
import os
from datetime import datetime, timezone

from app.services.pinata_service import pin_to_ipfs
from app.services.polygon_service import store_on_polygon


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
        "ipfs": None,  # populated asynchronously by build_blockchain_metadata_async
    }


async def build_blockchain_metadata_async(record_type: str, user_id: str, payload: dict) -> dict:
    """Same as build_blockchain_metadata but also pins to IPFS via Pinata."""
    meta = build_blockchain_metadata(record_type, user_id, payload)
    pin_payload = {
        "record_type": record_type,
        "user_id": user_id,
        "tx_hash": meta["tx_hash"],
        "payload": payload,
        "recorded_at": meta["recorded_at"].isoformat(),
    }
    ipfs_info = await pin_to_ipfs(f"interchain-{record_type}-{meta['tx_hash'][:12]}", pin_payload)
    meta["ipfs"] = ipfs_info

    # Submit CID to Polygon Amoy if IPFS pin succeeded
    if ipfs_info and ipfs_info.get("cid"):
        polygon_info = await store_on_polygon(record_type, ipfs_info["cid"], meta["tx_hash"])
        meta["polygon"] = polygon_info
        if polygon_info:
            meta["tx_hash"] = polygon_info["polygon_tx_hash"]
            meta["explorer_url"] = polygon_info["explorer_url"]
            meta["network"] = polygon_info["network"]
            meta["status"] = polygon_info["status"]
    else:
        meta["polygon"] = None

    return meta
