import urllib.request
import json
import sys
import time

def send_request(url, method="GET", body=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode("utf-8")

def diagnose():
    base_url = "http://127.0.0.1:8002"
    
    # 1. Login Admin
    status, res = send_request(f"{base_url}/auth/login", "POST", {
        "email": "admin@example.com",
        "password": "AdminPassword@123"
    })
    admin_token = res["access_token"]
    
    # 2. Register Courier
    ts = int(time.time())
    courier_email = f"c_{ts}@example.com"
    courier_phone = f"99887766{ts % 100:02d}"
    
    status, res = send_request(f"{base_url}/auth/register", "POST", {
        "role": "DELIVERY_PARTNER",
        "organization_name": "Fast Delivery",
        "full_name": "Sai Kumar",
        "email": courier_email,
        "phone_number": courier_phone,
        "address": "Hyderabad, India",
        "password": "Password@123",
        "confirm_password": "Password@123",
        "license_number": "DL-12345",
        "vehicle_number": "TS22B8756",
        "agree_terms": True
    })
    courier_id = res["id"]
    
    # Approve
    send_request(f"{base_url}/admin/users/{courier_id}/approve", "PATCH", token=admin_token)
    
    # Login Courier
    status, res = send_request(f"{base_url}/auth/login", "POST", {
        "email": courier_email,
        "password": "Password@123"
    })
    courier_token = res["access_token"]
    courier_user = res["user"]
    print("Courier ID:", courier_user["id"])
    
    # 3. Create Donation
    status, res = send_request(f"{base_url}/auth/login", "POST", {
        "email": "donor@example.com",
        "password": "Password@123"
    })
    donor_token = res["access_token"]
    
    status, categories = send_request(f"{base_url}/categories", token=donor_token)
    cat_id = categories[0]["id"]
    
    status, inv = send_request(f"{base_url}/inventory", "POST", {
        "food_name": "Diagnostics Fruit",
        "category_id": cat_id,
        "quantity": 5.0,
        "unit": "KG",
        "expiry_date": "2027-09-30",
        "pickup_address": "Surplus Point",
        "pickup_time": "10:00",
        "contact_person": "Operator",
        "phone_number": "9999999999"
    }, token=donor_token)
    
    status, don = send_request(f"{base_url}/donations", "POST", {
        "inventory_id": inv["id"],
        "quantity": 5.0,
        "pickup_deadline": "2027-09-30T18:00:00"
    }, token=donor_token)
    donation_id = don["id"]
    
    # 4. NGO Claims
    status, res = send_request(f"{base_url}/auth/login", "POST", {
        "email": "ngo@example.com",
        "password": "Password@123"
    })
    ngo_token = res["access_token"]
    
    send_request(f"{base_url}/donations/{donation_id}/claim", "POST", {
        "pickup_date": "2027-09-25T12:00:00",
        "pickup_time": "15:00",
        "vehicle_number": "TS-XYZ",
        "driver_name": "Rider",
        "volunteer_name": "Vol",
        "special_instructions": "None"
    }, token=ngo_token)
    
    # 5. Courier claims/assigns
    status, assign_res = send_request(f"{base_url}/donations/{donation_id}/assign-delivery", "POST", {
        "delivery_boy_id": courier_user["id"],
        "vehicle_number": "TS22B8756"
    }, token=courier_token)
    print("Assign response status:", status)
    
    # 6. List donations as Courier
    status, list_res = send_request(f"{base_url}/donations", token=courier_token)
    print("List response status:", status)
    print("List response items count:", len(list_res))
    if len(list_res) > 0:
        item = list_res[0]
        print("First item status:", item["status"])
        print("First item delivery_boy_id:", item["delivery_boy_id"])
        print("First item delivery_partner_id:", item["delivery_partner_id"])

if __name__ == "__main__":
    diagnose()
