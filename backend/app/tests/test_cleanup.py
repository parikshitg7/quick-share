from app.config import settings

def test_cleanup_authorization(client):
    # 1. Missing header entirely
    res_missing = client.post("/cleanup")
    assert res_missing.status_code == 401

    # 2. Incorrect header
    res_wrong = client.post("/cleanup", headers={"X-Cleanup-Secret": "invalid_guess"})
    assert res_wrong.status_code == 401

    # 3. Correct header (Should return 200 OK, even if 0 rooms are deleted)
    res_correct = client.post("/cleanup", headers={"X-Cleanup-Secret": settings.CLEANUP_SECRET})
    assert res_correct.status_code == 200
    assert "rooms_deleted" in res_correct.json()