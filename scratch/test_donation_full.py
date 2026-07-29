import urllib.request
import json
import sys

try:
    # 1. Login
    login_data = json.dumps({"email": "donor@example.com", "password": "Password@123"}).encode()
    req = urllib.request.Request("http://127.0.0.1:8001/auth/login", data=login_data, headers={"Content-Type": "application/json"})
    token = json.loads(urllib.request.urlopen(req).read().decode())["access_token"]
    print("Donor logged in.")

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
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    )
    res = urllib.request.urlopen(req_don)
    donation = json.loads(res.read().decode())
    donation_id = donation["id"]
    print("Donation created successfully. ID:", donation_id)

    # 4. NGO Login
    login_ngo = json.dumps({"email": "ngo@example.com", "password": "Password@123"}).encode()
    req_ngo = urllib.request.Request("http://127.0.0.1:8001/auth/login", data=login_ngo, headers={"Content-Type": "application/json"})
    token_ngo = json.loads(urllib.request.urlopen(req_ngo).read().decode())["access_token"]
    print("NGO logged in.")

    # 5. NGO Claim Donation with Payload
    claim_payload = json.dumps({
        "pickup_date": "2026-07-16T12:00:00Z",
        "pickup_time": "11:30 AM",
        "vehicle_number": "TS-09-EA-4523",
        "driver_name": "Ramesh Kumar",
        "volunteer_name": "Karan Malhotra",
        "special_instructions": "Handle with care."
    }).encode()
    
    req_claim = urllib.request.Request(
        f"http://127.0.0.1:8001/donations/{donation_id}/claim",
        data=claim_payload,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token_ngo}"}
    )
    res_claim = urllib.request.urlopen(req_claim)
    donation_claimed = json.loads(res_claim.read().decode())
    print("Donation claimed successfully!")
    print("Saved Pickup Date:", donation_claimed.get("pickup_date"))
    print("Saved Scheduled Pickup Time:", donation_claimed.get("scheduled_pickup_time"))
    print("Saved Driver Name:", donation_claimed.get("driver_name"))

except urllib.error.HTTPError as e:
    print("HTTP Error Code:", e.code)
    print("Response body:", e.read().decode())
except Exception as e:
    print("Generic Error:", e)
