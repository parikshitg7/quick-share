import io
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from nanoid import generate

from app.database import supabase
from app.models.item import TextItemCreate, ItemResponse
from app.services.storage import upload_file_bytes, get_file_stream

router = APIRouter(tags=["items"])

@router.post("/rooms/{room_id}/items", response_model=ItemResponse)
async def create_item(
    room_id: str,
    type: str = Form(...),
    content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    # Verify the room exists
    room_check = supabase.table("rooms").select("id").eq("id", room_id).execute()
    if not room_check.data:
        raise HTTPException(status_code=404, detail="Room not found")

    item_id = generate(size=12)
    now = datetime.now(timezone.utc)
    storage_ref = None
    size_bytes = None

    if type in ["image", "file", "video"]:
        if not file:
            raise HTTPException(status_code=400, detail="File payload required for non-text item")
        
        file_bytes = await file.read()
        size_bytes = len(file_bytes)
        storage_ref = f"{room_id}/{item_id}_{file.filename}"
        
        # Stream bytes up to Cloudflare R2
        upload_file_bytes(
            file_bytes=file_bytes,
            object_key=storage_ref,
            content_type=file.content_type or "application/octet-stream"
        )
        
        # Use filename as content label
        content = file.filename
    elif type == "text":
        if not content:
            raise HTTPException(status_code=400, detail="Content required for text item")
    else:
        raise HTTPException(status_code=400, detail="Invalid item type")

    item_data = {
        "id": item_id,
        "room_id": room_id,
        "type": type,
        "content": content,
        "storage_ref": storage_ref,
        "size_bytes": size_bytes,
        "uploaded_at": now.isoformat()
    }

    result = supabase.table("items").insert(item_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create item")

    return result.data[0]

@router.get("/rooms/{room_id}/items", response_model=List[ItemResponse])
def list_items(room_id: str):
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

@router.get("/items/{item_id}/download")
def download_item(item_id: str):
    # Fetch item metadata
    result = supabase.table("items").select("*").eq("id", item_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Item not found")

    item = result.data[0]
    if not item.get("storage_ref"):
        raise HTTPException(status_code=400, detail="Item has no storage reference")

    try:
        body_stream, content_type = get_file_stream(item["storage_ref"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch file from storage: {str(e)}")

    filename = item.get("content") or "download"

    return StreamingResponse(
        body_stream,
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )