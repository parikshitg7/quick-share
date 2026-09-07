import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    # TestClient bypasses the actual network layer but executes the full FastAPI stack
    return TestClient(app)