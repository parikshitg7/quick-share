from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, rooms, items

app = FastAPI(title="Quick Share API", version="1.0")

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