from datetime import datetime, timezone
from app.database import supabase
from app.services.storage import delete_file_object

def check_and_enforce_expiry(room: dict) -> str:
    """
    Checks whether a room has expired by time or by burn-after-view rules.
    If expired, permanently purges associated R2 files and DB rows.
    Returns: 'ok' or 'expired'.
    """
    now = datetime.now(timezone.utc)
    
    # Parse ISO 8601 string to timezone-aware datetime
    expires_at_str = room.get("expires_at")
    if expires_at_str:
        expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
    else:
        expires_at = now

    is_time_expired = expires_at < now
    is_burn_expired = room.get("burn_after_view") and room.get("viewed")

    if is_time_expired or is_burn_expired:
        # 1. Fetch and delete all R2 objects attached to items in this room
        items_result = supabase.table("items").select("storage_ref").eq("room_id", room["id"]).execute()
        if items_result.data:
            for item in items_result.data:
                storage_ref = item.get("storage_ref")
                if storage_ref:
                    try:
                        delete_file_object(storage_ref)
                    except Exception as e:
                        print(f"Error cleaning up R2 object {storage_ref}: {e}")

        # 2. Delete room from Supabase (cascade deletes items via foreign key)
        supabase.table("rooms").delete().eq("id", room["id"]).execute()
        return "expired"

    # Handle first view for burn-after-view room
    if room.get("burn_after_view") and not room.get("viewed"):
        supabase.table("rooms").update({"viewed": True}).eq("id", room["id"]).execute()
        return "ok"

    return "ok"