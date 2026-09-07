def test_create_and_get_room(client):
    # 1. Create normal room
    res = client.post("/rooms", json={"expiry_option": "24h"})
    assert res.status_code == 200
    room = res.json()
    assert "id" in room
    assert "short_code" in room
    
    room_id = room["id"]
    short_code = room["short_code"]

    # 2. Get by ID
    get_res = client.get(f"/rooms/{room_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == room_id
    
    # 3. Get by Short Code
    code_res = client.get(f"/rooms/by-code/{short_code}")
    assert code_res.status_code == 200
    assert code_res.json()["short_code"] == short_code

def test_password_protected_room(client):
    # 1. Create protected room
    res = client.post("/rooms", json={"expiry_option": "1h", "password": "supersecret"})
    assert res.status_code == 200
    room_id = res.json()["id"]

    # 2. Access without password should fail
    fail_res = client.get(f"/rooms/{room_id}")
    assert fail_res.status_code == 401
    assert "Password required" in fail_res.json()["detail"]

    # 3. Access with wrong password should fail
    wrong_pass_res = client.get(f"/rooms/{room_id}", headers={"X-Room-Password": "wrong"})
    assert wrong_pass_res.status_code == 401

    # 4. Access with correct password
    success_res = client.get(f"/rooms/{room_id}", headers={"X-Room-Password": "supersecret"})
    assert success_res.status_code == 200
    assert success_res.json()["encrypted"] is True