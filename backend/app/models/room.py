from pydantic import BaseModel
from datetime import datetime

class RoomResponse(BaseModel):
    id: str
    short_code: str
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True