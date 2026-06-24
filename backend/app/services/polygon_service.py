import json
import os
from pathlib import Path


AMOY_RPC = os.getenv("AMOY_RPC_URL", "https://rpc-amoy.polygon.technology")
WALLET_ADDRESS = os.getenv("POLYGON_WALLET_ADDRESS", "")
WALLET_PRIVATE_KEY = os.getenv("POLYGON_PRIVATE_KEY", "")
CONTRACT_ADDRESS = os.getenv("POLYGON_CONTRACT_ADDRESS", "")
EXPLORER_BASE = "https://amoy.polygonscan.com/tx"

_ABI_PATH = Path(__file__).resolve().parents[2] / "contracts" / "InterChainRecords.abi.json"


def _get_contract():
    try:
        from web3 import Web3
        if not all([WALLET_ADDRESS, WALLET_PRIVATE_KEY, CONTRACT_ADDRESS]):
            return None, None
        w3 = Web3(Web3.HTTPProvider(AMOY_RPC))
        if not w3.is_connected():
            return None, None
        abi = json.loads(_ABI_PATH.read_text())
        contract = w3.eth.contract(
            address=Web3.to_checksum_address(CONTRACT_ADDRESS),
            abi=abi,
        )
        return w3, contract
    except Exception:
        return None, None


async def store_on_polygon(record_type: str, cid: str, tx_hash: str) -> dict | None:
    """
    Submit a CID to the InterChainRecords contract on Polygon Amoy.
    Returns polygon tx info or None if not configured / failed.
    """
    if not all([WALLET_ADDRESS, WALLET_PRIVATE_KEY, CONTRACT_ADDRESS]):
        return None
    try:
        from web3 import Web3
        import asyncio

        def _send():
            w3, contract = _get_contract()
            if not w3 or not contract:
                return None
            nonce = w3.eth.get_transaction_count(
                Web3.to_checksum_address(WALLET_ADDRESS)
            )
            txn = contract.functions.storeRecord(
                record_type, cid, tx_hash
            ).build_transaction({
                "from":     Web3.to_checksum_address(WALLET_ADDRESS),
                "nonce":    nonce,
                "gas":      200_000,
                "gasPrice": w3.eth.gas_price,
                "chainId":  80002,  # Polygon Amoy
            })
            signed = w3.eth.account.sign_transaction(txn, WALLET_PRIVATE_KEY)
            sent = w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = w3.eth.wait_for_transaction_receipt(sent, timeout=60)
            polygon_hash = receipt.transactionHash.hex()
            return {
                "polygon_tx_hash": f"0x{polygon_hash}" if not polygon_hash.startswith("0x") else polygon_hash,
                "explorer_url":    f"{EXPLORER_BASE}/{polygon_hash}",
                "network":         "polygon-amoy",
                "status":          "confirmed" if receipt.status == 1 else "failed",
                "block_number":    receipt.blockNumber,
            }

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _send)
    except Exception:
        return None
