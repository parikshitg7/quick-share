from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TextItemCreate(BaseModel):
    type: str = "text"
    content: str
    burn_after_read: Optional[bool] = False

class ItemResponse(BaseModel):
    id: str
    room_id: str
    type: str
    content: Optional[str] = None
    storage_ref: Optional[str] = None
    size_bytes: Optional[int] = None
    uploaded_at: datetime
    burn_after_read: bool = False
    viewed: bool = False

    class Config:
        from_attributes = True