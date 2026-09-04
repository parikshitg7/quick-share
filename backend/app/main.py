from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.routes import health, rooms, items

# Initialize rate limiter using client IP
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Quick Share API", version="1.0")
app.state.limiter = limiter

# Custom exception handler to return required HTTP 429 payload
@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Try again later."}
    )

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(rooms.router)
app.include_router(items.router)

@app.get("/")
def root():
    return {"message": "Welcome to Quick Share API"}