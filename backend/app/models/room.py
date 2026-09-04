from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RoomCreate(BaseModel):
    expiry_option: Optional[str] = "24h"  # Options: burn_after_view, 10m, 1h, 24h, 7d
    password: Optional[str] = None
    encryption_salt: Optional[str] = None

class RoomResponse(BaseModel):
    id: str
    short_code: str
    type: str
    created_at: datetime
    expires_at: datetime
    burn_after_view: bool = False
    viewed: bool = False
    encrypted: bool = False
    encryption_salt: Optional[str] = None

    class Config:
        from_attributes = True