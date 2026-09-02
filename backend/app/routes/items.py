import io
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from nanoid import generate

from app.database import supabase
from app.models.item import ItemResponse
from app.services.storage import upload_file_bytes, get_file_stream, delete_file_object

router = APIRouter(tags=["items"])

@router.post("/rooms/{room_id}/items", response_model=ItemResponse)
async def create_item(
    room_id: str,
    type: str = Form(...),
    content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    burn_after_read: bool = Form(False)
):
    # 1. Verify the room exists
    room_check = supabase.table("rooms").select("*").eq("id", room_id).execute()
    if not room_check.data:
        raise HTTPException(status_code=404, detail="Room not found")

    room = room_check.data[0]

    # 2. Reject uploads if a burn-after-view room is already sealed
    if room.get("burn_after_view") and room.get("sealed"):
        raise HTTPException(
            status_code=403, 
            detail="This room is sealed and no longer accepts uploads."
        )

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
        
        upload_file_bytes(
            file_bytes=file_bytes,
            object_key=storage_ref,
            content_type=file.content_type or "application/octet-stream"
        )
        
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
        "uploaded_at": now.isoformat(),
        "burn_after_read": burn_after_read,
        "viewed": False
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
    result = supabase.table("items").select("*").eq("id", item_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Item not found")

    item = result.data[0]
    if not item.get("storage_ref"):
        raise HTTPException(status_code=400, detail="Item has no storage reference")

    try:
        body_stream, content_type = get_file_stream(item["storage_ref"])
        file_bytes = body_stream.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch file from storage: {str(e)}")

    # Delete if burn_after_read is true
    if item.get("burn_after_read"):
        storage_ref = item.get("storage_ref")
        if storage_ref:
            try:
                delete_file_object(storage_ref)
            except Exception as e:
                print(f"Error removing R2 file {storage_ref}: {e}")
        supabase.table("items").delete().eq("id", item_id).execute()

    filename = item.get("content") or "download"

    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.post("/items/{item_id}/mark-viewed")
def mark_item_viewed(item_id: str):
    result = supabase.table("items").select("*").eq("id", item_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Item not found")

    item = result.data[0]

    if item.get("burn_after_read"):
        storage_ref = item.get("storage_ref")
        if storage_ref:
            try:
                delete_file_object(storage_ref)
            except Exception as e:
                print(f"Error removing R2 file {storage_ref}: {e}")

        supabase.table("items").delete().eq("id", item_id).execute()
        return {"status": "deleted", "item_id": item_id}
    else:
        supabase.table("items").update({"viewed": True}).eq("id", item_id).execute()
        return {"status": "marked_viewed", "item_id": item_id}


@router.delete("/items/{item_id}")
def delete_item(item_id: str):
    result = supabase.table("items").select("*").eq("id", item_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Item not found")

    item = result.data[0]
    storage_ref = item.get("storage_ref")

    if storage_ref:
        try:
            delete_file_object(storage_ref)
        except Exception as e:
            print(f"Error removing R2 file {storage_ref}: {e}")

    supabase.table("items").delete().eq("id", item_id).execute()
    return {"status": "deleted", "item_id": item_id}