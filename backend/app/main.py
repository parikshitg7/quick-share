from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health

app = FastAPI(title="Quick Share API", version="1.0")

# Enable CORS for local development (allow all origins per blueprint defaults)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)

@app.get("/")
def root():
    return {"message": "Welcome to Quick Share API"}