from datetime import datetime, timezone
from typing import Annotated
from fastapi import APIRouter, Header, HTTPException
from app.config import settings
from app.database import supabase
from app.services.storage import delete_file_object

router = APIRouter()

@router.post("/cleanup")
def cleanup_expired_rooms(x_cleanup_secret: Annotated[str | None, Header()] = None):
    # 1. Validate secret header against env configuration
    if not x_cleanup_secret or x_cleanup_secret != settings.CLEANUP_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    now_str = datetime.now(timezone.utc).isoformat()

    # 2. Query all expired rooms
    expired_rooms = supabase.table("rooms").select("id").lt("expires_at", now_str).execute()

    if not expired_rooms.data:
        return {"rooms_deleted": 0}

    rooms_deleted = 0
    for room in expired_rooms.data:
        room_id = room["id"]

        # 3. Fetch items to delete their R2 objects from storage
        items = supabase.table("items").select("storage_ref").eq("room_id", room_id).execute()
        if items.data:
            for item in items.data:
                storage_ref = item.get("storage_ref")
                if storage_ref:
                    try:
                        delete_file_object(storage_ref)
                    except Exception as e:
                        print(f"Error cleaning up R2 object {storage_ref}: {e}")

        # 4. Delete the room (cascade deletes item metadata in database)
        supabase.table("rooms").delete().eq("id", room_id).execute()
        rooms_deleted += 1

    return {"rooms_deleted": rooms_deleted}