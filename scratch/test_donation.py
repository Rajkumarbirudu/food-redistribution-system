import urllib.request
import json
import sys

try:
    # 1. Login
    login_data = json.dumps({"email": "donor@example.com", "password": "Password@123"}).encode()
    req = urllib.request.Request("http://127.0.0.1:8001/auth/login", data=login_data, headers={"Content-Type": "application/json"})
    token = json.loads(urllib.request.urlopen(req).read().decode())["access_token"]
    print("Logged in. Token retrieved.")

    # 2. Get inventory
    req_inv = urllib.request.Request("http://127.0.0.1:8001/inventory", headers={"Authorization": f"Bearer {token}"})
    items = json.loads(urllib.request.urlopen(req_inv).read().decode())
    
    if not items:
        print("No items in inventory to test with.")
        sys.exit(0)
    
    item = items[0]
    print(f"Testing with inventory item: {item['id']} ({item['food_name']})")

    # 3. Post donation
    donate_data = json.dumps({
        "inventory_id": item["id"],
        "quantity": 1.0,
        "pickup_deadline": "2026-07-25T12:00:00Z",
        "notes": "Test notes"
    }).encode()
    
    req_don = urllib.request.Request(
        "http://127.0.0.1:8001/donations",
        data=donate_data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
    )
    
    res = urllib.request.urlopen(req_don)
    print("Success! Status:", res.status)
    print("Response body:", res.read().decode())

except urllib.error.HTTPError as e:
    print("HTTP Error Code:", e.code)
    print("Response body:", e.read().decode())
except Exception as e:
    print("Generic Error:", e)
