import json
import os

import httpx


PINATA_JWT = os.getenv("PINATA_JWT", "")
PINATA_GATEWAY = os.getenv("PINATA_GATEWAY", "https://gateway.pinata.cloud/ipfs")
PINATA_PIN_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS"


async def pin_to_ipfs(name: str, payload: dict) -> dict | None:
    """Pin a JSON payload to IPFS via Pinata. Returns CID info or None on failure."""
    if not PINATA_JWT:
        return None
    body = {
        "pinataMetadata": {"name": name},
        "pinataContent": payload,
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                PINATA_PIN_URL,
                json=body,
                headers={
                    "Authorization": f"Bearer {PINATA_JWT}",
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            cid = data["IpfsHash"]
            return {
                "cid": cid,
                "ipfs_url": f"ipfs://{cid}",
                "gateway_url": f"{PINATA_GATEWAY}/{cid}",
                "pin_size": data.get("PinSize"),
            }
    except Exception:
        return None
