from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta, timezone
from nanoid import generate
from app.database import supabase
from app.models.room import RoomCreate, RoomResponse
from app.services.shortcode import generate_short_code
from app.services.expiry import check_and_enforce_expiry

router = APIRouter(prefix="/rooms", tags=["rooms"])

@router.post("", response_model=RoomResponse)
def create_room(room_in: RoomCreate = RoomCreate()):
    room_id = generate(size=12)
    short_code = generate_short_code()
    now = datetime.now(timezone.utc)
    
    expiry_option = room_in.expiry_option or "24h"
    burn_after_view = False

    if expiry_option == "burn_after_view":
        burn_after_view = True
        expires_at = now + timedelta(days=30)  # 30-day safety net
    elif expiry_option == "10m":
        expires_at = now + timedelta(minutes=10)
    elif expiry_option == "1h":
        expires_at = now + timedelta(hours=1)
    elif expiry_option == "7d":
        expires_at = now + timedelta(days=7)
    else:  # default "24h"
        expires_at = now + timedelta(hours=24)

    room_data = {
        "id": room_id,
        "short_code": short_code,
        "type": "quick",
        "created_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "burn_after_view": burn_after_view,
        "viewed": False
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

    room = result.data[0]
    status = check_and_enforce_expiry(room)
    if status == "expired":
        raise HTTPException(status_code=410, detail="This room has expired.")

    return room

@router.get("/by-code/{short_code}", response_model=RoomResponse)
def get_room_by_code(short_code: str):
    result = supabase.table("rooms").select("*").eq("short_code", short_code).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Room not found")

    room = result.data[0]
    status = check_and_enforce_expiry(room)
    if status == "expired":
        raise HTTPException(status_code=410, detail="This room has expired.")

    return room