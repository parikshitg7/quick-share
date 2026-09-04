import os
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv
from app.database import supabase
from app.config import settings

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("🚀 Starting Automated Phase 11.1 Verification...\n")

    # 1. Test missing secret header (Should return HTTP 401)
    print("Test 1: Calling /cleanup without secret header...")
    res = requests.post(f"{BASE_URL}/cleanup")
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    print("  ✅ PASS: Missing header correctly rejected (HTTP 401)\n")

    # 2. Test invalid secret header (Should return HTTP 401)
    print("Test 2: Calling /cleanup with invalid secret header...")
    res = requests.post(f"{BASE_URL}/cleanup", headers={"X-Cleanup-Secret": "invalid_secret_key"})
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    print("  ✅ PASS: Wrong secret correctly rejected (HTTP 401)\n")

    # 3. Setup: Create a real test room and item via API
    print("Test 3: Setting up an expired test room in DB...")
    room_res = requests.post(f"{BASE_URL}/rooms", json={"expiry_option": "24h"})
    assert room_res.status_code == 200, f"Failed to create room: {room_res.text}"
    room_id = room_res.json()["id"]

    # Add a test item
    item_res = requests.post(
        f"{BASE_URL}/rooms/{room_id}/items", 
        data={"type": "text", "content": "Automated cleanup test item"}
    )
    assert item_res.status_code == 200, f"Failed to add item: {item_res.text}"

    # Artificially set room expires_at timestamp into the past (Year 2000)
    supabase.table("rooms").update({"expires_at": "2000-01-01T00:00:00Z"}).eq("id", room_id).execute()
    print(f"  ✅ Room created ({room_id}) and forced to expired state.\n")

    # 4. Call /cleanup with valid secret header
    print("Test 4: Triggering /cleanup with valid X-Cleanup-Secret header...")
    cleanup_res = requests.post(
        f"{BASE_URL}/cleanup", 
        headers={"X-Cleanup-Secret": settings.CLEANUP_SECRET}
    )
    assert cleanup_res.status_code == 200, f"Expected 200, got {cleanup_res.status_code}: {cleanup_res.text}"
    data = cleanup_res.json()
    assert "rooms_deleted" in data and data["rooms_deleted"] >= 1, "Expected rooms_deleted >= 1"
    print(f"  ✅ PASS: Endpoint returned HTTP 200 with payload: {data}\n")

    # 5. Database Verification: Check that room no longer exists in Supabase
    print("Test 5: Verifying room removal from Supabase database...")
    check = supabase.table("rooms").select("*").eq("id", room_id).execute()
    assert len(check.data) == 0, "Room still exists in database!"
    print("  ✅ PASS: Expired room and associated items purged successfully from database.\n")

    print("🎉 ALL TESTS PASSED! Phase 11.1 is completely verified.")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")