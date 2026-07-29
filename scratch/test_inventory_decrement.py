import urllib.request
import json
import sys

try:
    # 1. Login as Donor
    login_data = json.dumps({"email": "donor@example.com", "password": "Password@123"}).encode()
    req = urllib.request.Request("http://127.0.0.1:8001/auth/login", data=login_data, headers={"Content-Type": "application/json"})
    token = json.loads(urllib.request.urlopen(req).read().decode())["access_token"]
    print("Donor logged in.")

    # 2. Get inventory
    req_inv = urllib.request.Request("http://127.0.0.1:8001/inventory", headers={"Authorization": f"Bearer {token}"})
    items = json.loads(urllib.request.urlopen(req_inv).read().decode())
    
    if not items:
        print("No items in inventory to test with. Please ensure a test item is assigned to the donor.")
        sys.exit(0)
    
    item = items[0]
    inventory_id = item["id"]
    initial_qty = item["quantity"]
    print(f"Initial inventory item: {inventory_id} ({item['food_name']}) with quantity {initial_qty}")

    # Set initial quantity to 10 for clean math
    # We can test with whatever quantity is there. Let's say half of it.
    donate_qty = initial_qty / 2.0
    print(f"Testing decrement: donating {donate_qty} units...")

    # 3. Post first donation
    donate_data = json.dumps({
        "inventory_id": inventory_id,
        "quantity": donate_qty,
        "pickup_deadline": "2026-07-25T12:00:00Z",
        "notes": "First half test"
    }).encode()
    req_don1 = urllib.request.Request("http://127.0.0.1:8001/donations", data=donate_data, headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    donation1 = json.loads(urllib.request.urlopen(req_don1).read().decode())
    donation1_id = donation1["id"]
    print(f"First donation created. ID: {donation1_id}")

    # 4. NGO Login
    login_ngo = json.dumps({"email": "ngo@example.com", "password": "Password@123"}).encode()
    req_ngo = urllib.request.Request("http://127.0.0.1:8001/auth/login", data=login_ngo, headers={"Content-Type": "application/json"})
    token_ngo = json.loads(urllib.request.urlopen(req_ngo).read().decode())["access_token"]
    print("NGO logged in.")

    # 5. NGO Claim first donation
    claim_payload = json.dumps({
        "pickup_date": "2026-07-16T12:00:00Z",
        "pickup_time": "11:30 AM",
        "vehicle_number": "TS-09-EA-4523",
        "driver_name": "Ramesh Kumar",
        "volunteer_name": "Karan Malhotra",
        "special_instructions": "Handle with care."
    }).encode()
    req_claim1 = urllib.request.Request(f"http://127.0.0.1:8001/donations/{donation1_id}/claim", data=claim_payload, headers={"Content-Type": "application/json", "Authorization": f"Bearer {token_ngo}"})
    urllib.request.urlopen(req_claim1)
    print("First donation claimed by NGO.")

    # 6. Check inventory item quantity
    req_inv = urllib.request.Request("http://127.0.0.1:8001/inventory", headers={"Authorization": f"Bearer {token}"})
    items = json.loads(urllib.request.urlopen(req_inv).read().decode())
    updated_item = next((i for i in items if i["id"] == inventory_id), None)
    
    if updated_item:
        print(f"Inventory quantity after first claim: {updated_item['quantity']} (Expected: {initial_qty - donate_qty})")
    else:
        print("Inventory item was deleted unexpectedly!")
        sys.exit(1)

    # 7. Post second donation for the remaining quantity
    remaining_qty = updated_item["quantity"]
    print(f"Testing deletion: donating remaining {remaining_qty} units...")
    donate_data2 = json.dumps({
        "inventory_id": inventory_id,
        "quantity": remaining_qty,
        "pickup_deadline": "2026-07-25T12:00:00Z",
        "notes": "Remaining quantity test"
    }).encode()
    req_don2 = urllib.request.Request("http://127.0.0.1:8001/donations", data=donate_data2, headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    donation2 = json.loads(urllib.request.urlopen(req_don2).read().decode())
    donation2_id = donation2["id"]
    print(f"Second donation created. ID: {donation2_id}")

    # 8. NGO Claim second donation
    req_claim2 = urllib.request.Request(f"http://127.0.0.1:8001/donations/{donation2_id}/claim", data=claim_payload, headers={"Content-Type": "application/json", "Authorization": f"Bearer {token_ngo}"})
    urllib.request.urlopen(req_claim2)
    print("Second donation claimed by NGO.")

    # 9. Verify inventory item is now deleted
    req_inv = urllib.request.Request("http://127.0.0.1:8001/inventory", headers={"Authorization": f"Bearer {token}"})
    items = json.loads(urllib.request.urlopen(req_inv).read().decode())
    deleted_item = next((i for i in items if i["id"] == inventory_id), None)
    
    if deleted_item is None:
        print("Success! Inventory item was successfully removed (deleted) from the collection.")
    else:
        print(f"Failed! Inventory item still exists with quantity {deleted_item['quantity']}")

except urllib.error.HTTPError as e:
    print("HTTP Error Code:", e.code)
    print("Response body:", e.read().decode())
except Exception as e:
    print("Generic Error:", e)
