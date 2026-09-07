def test_text_item_burn_after_read(client):
    # Setup room
    room_res = client.post("/rooms", json={"expiry_option": "1h"})
    room_id = room_res.json()["id"]

    # Create burn-after-read text item using Form data
    item_res = client.post(
        f"/rooms/{room_id}/items",
        data={"type": "text", "content": "secret message", "burn_after_read": True}
    )
    assert item_res.status_code == 200
    item_id = item_res.json()["id"]

    # List items to ensure it appears
    list_res = client.get(f"/rooms/{room_id}/items")
    items = list_res.json()
    assert len(items) == 1
    assert items[0]["id"] == item_id

    # Mark viewed (which should delete a burn-after-read text item)
    burn_res = client.post(f"/items/{item_id}/mark-viewed")
    assert burn_res.status_code == 200

    # Verify permanent deletion
    list_res_after = client.get(f"/rooms/{room_id}/items")
    assert len(list_res_after.json()) == 0

def test_file_upload_download(client):
    # Setup room
    room_res = client.post("/rooms", json={"expiry_option": "1h"})
    room_id = room_res.json()["id"]

    # Upload file
    file_content = b"Automated test file content."
    files = {"file": ("test.txt", file_content, "text/plain")}
    data = {"type": "file", "burn_after_read": False}
    
    item_res = client.post(f"/rooms/{room_id}/items", data=data, files=files)
    assert item_res.status_code == 200
    item_id = item_res.json()["id"]

    # Download file and verify byte integrity
    dl_res = client.get(f"/items/{item_id}/download")
    assert dl_res.status_code == 200
    assert dl_res.content == file_content