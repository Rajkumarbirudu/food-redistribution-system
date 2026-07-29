import urllib.request
import json

try:
    # 1. Login
    login_data = json.dumps({"email": "donor@example.com", "password": "Password@123"}).encode()
    req = urllib.request.Request("http://127.0.0.1:8000/auth/login", data=login_data, headers={"Content-Type": "application/json"})
    token = json.loads(urllib.request.urlopen(req).read().decode())["access_token"]
    print("Logged in.")

    # 2. POST /inventory
    payload = {
        "food_name": "Test Milk",
        "category_id": "6a50ddc71b50cab716f10c22",
        "quantity": 10.0,
        "unit": "LITER",
        "manufacturing_date": "2026-07-05",
        "expiry_date": "2026-07-25",
        "pickup_address": "890 Pine Road, Lakeshore",
        "pickup_time": "12:00",
        "contact_person": "Michael Scott",
        "phone_number": "9862302717"
    }
    
    req_post = urllib.request.Request(
        "http://127.0.0.1:8000/inventory",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    )
    res = urllib.request.urlopen(req_post)
    print("Success!", res.read().decode())

except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Body:", e.read().decode())
except Exception as e:
    print("Error:", e)
