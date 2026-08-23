from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta, timezone
from nanoid import generate
from app.database import supabase
from app.models.room import RoomResponse
from app.services.shortcode import generate_short_code

router = APIRouter(prefix="/rooms", tags=["rooms"])

@router.post("", response_model=RoomResponse)
def create_room():
    room_id = generate(size=12)
    short_code = generate_short_code()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=24)

    room_data = {
        "id": room_id,
        "short_code": short_code,
        "type": "quick",
        "created_at": now.isoformat(),
        "expires_at": expires_at.isoformat()
    }

    result = supabase.table("rooms").insert(room_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create room")

    return result.data[0]

@router.get("/{room_id}", response_model=RoomResponse)
def get_room(room_id: str):
    result = supabase.table("rooms").select("*").eq("id", room_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Room not found")
    return result.data[0]