from datetime import datetime
from zoneinfo import ZoneInfo

PHT = ZoneInfo("Asia/Manila")

def get_pht_now() -> datetime:
    """Returns the current timezone-aware datetime in Asia/Manila (PHT)."""
    return datetime.now(PHT)
