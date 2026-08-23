from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from typing import List
from nanoid import generate
from app.database import supabase
from app.models.item import TextItemCreate, ItemResponse

router = APIRouter(prefix="/rooms/{room_id}/items", tags=["items"])

@router.post("", response_model=ItemResponse)
def create_text_item(room_id: str, item_in: TextItemCreate):
    # Verify the room exists
    room_check = supabase.table("rooms").select("id").eq("id", room_id).execute()
    if not room_check.data:
        raise HTTPException(status_code=404, detail="Room not found")

    item_id = generate(size=12)
    now = datetime.now(timezone.utc)

    item_data = {
        "id": item_id,
        "room_id": room_id,
        "type": "text",
        "content": item_in.content,
        "uploaded_at": now.isoformat()
    }

    result = supabase.table("items").insert(item_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create item")

    return result.data[0]

@router.get("", response_model=List[ItemResponse])
def list_items(room_id: str):
    # Verify the room exists
    room_check = supabase.table("rooms").select("id").eq("id", room_id).execute()
    if not room_check.data:
        raise HTTPException(status_code=404, detail="Room not found")

    result = (
        supabase.table("items")
        .select("*")
        .eq("room_id", room_id)
        .order("uploaded_at", desc=False)
        .execute()
    )
    return result.data