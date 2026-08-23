from fastapi import FastAPI
from app.routes import health

app = FastAPI(title="Quick Share API", version="1.0")

app.include_router(health.router)

@app.get("/")
def root():
    return {"message": "Welcome to Quick Share API"}