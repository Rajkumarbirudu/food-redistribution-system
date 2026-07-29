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
        error_content = err.read().decode("utf-8")
        try:
            parsed_err = json.loads(error_content)
        except Exception:
            parsed_err = error_content
        return err.code, parsed_err

def test_flow():
    base_url = "http://127.0.0.1:8002"
    print("Engaging Unified Courier Layer Integration Verification...")

    # 1. Login as Admin to approve new partners
    admin_login = {
        "email": "admin@example.com",
        "password": "AdminPassword@123"
    }
    status, res = send_request(f"{base_url}/auth/login", "POST", admin_login)
    if status != 200:
        print("Failed to log in as Admin. Seed accounts missing.")
        sys.exit(1)
    admin_token = res["access_token"]
    print("Logged in as Admin.")

    # 2. Register Delivery Partner (Courier) with License, Bike, and Terms checkbox
    ts = int(time.time())
    partner_email = f"courier_{ts}@example.com"
    partner_phone = f"98765432{ts % 100:02d}"

    partner_payload = {
        "role": "DELIVERY_PARTNER",
        "organization_name": "Express Couriers",
        "full_name": "Dave Transporter",
        "email": partner_email,
        "phone_number": partner_phone,
        "address": "456 Express Highway, NY",
        "password": "Password@123",
        "confirm_password": "Password@123",
        "license_number": "DL-COURIER-12345",
        "vehicle_number": "NY-BIKE-9988",
        "agree_terms": True
    }
    status, res = send_request(f"{base_url}/auth/register", "POST", partner_payload)
    if status != 201:
        print("Failed to register Delivery Partner:", res)
        sys.exit(1)
    partner_user_id = res["id"]
    print("Registered Courier (Pending Approval).")

    # 3. Admin approves Courier account
    status, res = send_request(f"{base_url}/admin/users/{partner_user_id}/approve", "PATCH", token=admin_token)
    if status != 200:
        print("Admin failed to approve Courier:", res)
        sys.exit(1)
    print("Approved Courier account.")

    # 4. Log in as Courier
    status, res = send_request(f"{base_url}/auth/login", "POST", {
        "email": partner_email,
        "password": "Password@123"
    })
    if status != 200:
        print("Courier login failed:", res)
        sys.exit(1)
    partner_token = res["access_token"]
    partner_profile_id = res["user"]["id"]
    print("Courier login successful.")

    # 5. Log in as Donor to seed inventory and donate
    status, res = send_request(f"{base_url}/auth/login", "POST", {
        "email": "donor@example.com",
        "password": "Password@123"
    })
    donor_token = res["access_token"]
    print("Logged in as Donor.")

    # Get active category
    status, categories = send_request(f"{base_url}/categories", token=donor_token)
    category_id = categories[0]["id"] if categories else "64acf01d4a66ccad69e00001"

    # Add inventory item
    inv_payload = {
        "food_name": "Premium Apple Bags",
        "category_id": category_id,
        "quantity": 10.0,
        "unit": "KG",
        "expiry_date": "2027-09-30",
        "pickup_address": "742 Evergreen Terrace, Springfield",
        "pickup_time": "14:00",
        "contact_person": "Sarah Jenkins",
        "phone_number": "9876543210"
    }
    status, inv_item = send_request(f"{base_url}/inventory", "POST", inv_payload, token=donor_token)
    if "id" not in inv_item:
        print("Failed to create inventory item. Error:", inv_item)
        sys.exit(1)
    inventory_id = inv_item["id"]
    print("Created surplus inventory item.")

    # Publish donation
    don_payload = {
        "inventory_id": inventory_id,
        "quantity": 10.0,
        "pickup_deadline": "2027-09-30T18:00:00",
        "notes": "Store in dry place"
    }
    status, donation = send_request(f"{base_url}/donations", "POST", don_payload, token=donor_token)
    if "id" not in donation:
        print("Failed to publish donation. Error:", donation)
        sys.exit(1)
    donation_id = donation["id"]
    print("Published surplus food donation.")

    # 6. Log in as NGO & claim donation
    status, res = send_request(f"{base_url}/auth/login", "POST", {
        "email": "ngo@example.com",
        "password": "Password@123"
    })
    ngo_token = res["access_token"]
    print("Logged in as NGO.")

    claim_payload = {
        "pickup_date": "2027-09-25T12:00:00",
        "pickup_time": "15:00",
        "vehicle_number": "NY 99B AA 1234",
        "driver_name": "Alex Carter",
        "volunteer_name": "Taylor Green",
        "special_instructions": "Bring large cooling bags"
    }
    status, claim_res = send_request(f"{base_url}/donations/{donation_id}/claim", "POST", claim_payload, token=ngo_token)
    if status != 200:
        print("Failed to claim donation. Status:", status, "Error:", claim_res)
        sys.exit(1)
    print("NGO claimed donation.")

    # 7. Courier fetches pending deliveries
    status, pending = send_request(f"{base_url}/donations/pending-delivery", token=partner_token)
    if status != 200:
        print("Failed to get pending deliveries. Exiting.")
        sys.exit(1)
    if not any(d["id"] == donation_id for d in pending):
        print("Donation missing from pending deliveries list.")
        sys.exit(1)
    print("Verified donation is in Pending Deliveries Queue.")

    # 8. Courier self-assigns shipment
    assign_payload = {
        "delivery_boy_id": partner_profile_id,
        "vehicle_number": "NY-BIKE-9988"
    }
    status, assign_res = send_request(f"{base_url}/donations/{donation_id}/assign-delivery", "POST", assign_payload, token=partner_token)
    if status != 200:
        print("Failed to assign driver:", assign_res)
        sys.exit(1)
    print("Courier self-assigned shipment.")

    # 9. Courier marks shipment as Picked Up (IN_TRANSIT)
    status, pickup_res = send_request(f"{base_url}/donations/{donation_id}/pickup", "POST", token=partner_token)
    if status != 200:
        print("Failed to mark pickup:", pickup_res)
        sys.exit(1)
    print("Courier marked shipment as Picked Up (IN_TRANSIT).")

    # 10. Update location coordinate
    loc_payload = {"lat": 40.7150, "lng": -74.0080}
    status, loc_res = send_request(f"{base_url}/donations/{donation_id}/location", "POST", loc_payload, token=partner_token)
    if status != 200:
        print("Failed to update GPS location:", loc_res)
        sys.exit(1)
    print("Courier posted simulated GPS location coordinates.")

    # 11. NGO raises complaint against courier
    complaint_payload = {
        "donation_id": donation_id,
        "delivery_boy_id": partner_profile_id,
        "title": "Coming Late",
        "description": "Courier is still 2 hours away from scheduled window."
    }
    status, complaint = send_request(f"{base_url}/complaints", "POST", complaint_payload, token=ngo_token)
    if status != 201:
        print("Failed to submit complaint:", complaint)
        sys.exit(1)
    complaint_id = complaint["id"]
    print("NGO raised 'Coming Late' complaint.")

    # 12. Admin lists and resolves complaint
    status, list_comps = send_request(f"{base_url}/complaints", token=admin_token)
    if not any(c["id"] == complaint_id for c in list_comps):
        print("Complaint not found in admin list.")
        sys.exit(1)
    print("Admin verified complaint is visible in Complaints Desk.")

    status, resolve_res = send_request(f"{base_url}/complaints/{complaint_id}/resolve", "POST", token=admin_token)
    if status != 200 or resolve_res["status"] != "RESOLVED":
        print("Failed to resolve complaint:", resolve_res)
        sys.exit(1)
    print("Admin resolved the complaint.")

    # 12b. Admin issues 1st warning to the driver (Wallet fine Rs. 100)
    status, warn_res = send_request(f"{base_url}/admin/users/{partner_user_id}/warn", "PATCH", token=admin_token)
    if status != 200 or warn_res.get("warnings_count") != 1 or warn_res.get("wallet_balance") != 900.0:
        print("Failed on 1st warning:", warn_res)
        sys.exit(1)
    print("Warning #1 issued. Wallet fine Rs. 100 applied. Balance:", warn_res.get("wallet_balance"))

    # 12c. Admin issues 2nd warning (Wallet fine Rs. 100)
    status, warn_res2 = send_request(f"{base_url}/admin/users/{partner_user_id}/warn", "PATCH", token=admin_token)
    if status != 200 or warn_res2.get("warnings_count") != 2 or warn_res2.get("wallet_balance") != 800.0:
        print("Failed on 2nd warning:", warn_res2)
        sys.exit(1)
    print("Warning #2 issued. Wallet fine Rs. 100 applied. Balance:", warn_res2.get("wallet_balance"))

    # 12d. Admin issues 3rd warning (Triggers 1-Month Auto-Suspension & Rs. 100 Fine)
    status, warn_res3 = send_request(f"{base_url}/admin/users/{partner_user_id}/warn", "PATCH", token=admin_token)
    if status != 200 or warn_res3.get("warnings_count") != 3 or warn_res3.get("is_suspended") is not True:
        print("Failed on 3rd warning suspension trigger:", warn_res3)
        sys.exit(1)
    print("Warning #3 issued. 3-Warnings limit reached! 1-Month Auto-Suspension Triggered. is_suspended:", warn_res3.get("is_suspended"))

    # 12e. Verify suspended courier login is rejected with 403 Forbidden
    status, suspended_login = send_request(f"{base_url}/auth/login", "POST", {
        "email": partner_email,
        "password": "Password@123"
    })
    if status != 403:
        print("Expected status 403 for suspended user login, got:", status)
        sys.exit(1)
    print("Suspended courier login correctly blocked by server (403 Forbidden).")

    # 12f. Admin unsuspends the driver to allow completing run
    status, unsuspend_res = send_request(f"{base_url}/admin/users/{partner_user_id}/suspend", "PATCH", token=admin_token)
    if status != 200 or unsuspend_res.get("is_suspended") is not False:
        print("Failed to unsuspend delivery partner:", unsuspend_res)
        sys.exit(1)
    print("Admin unsuspended delivery partner account. is_suspended:", unsuspend_res.get("is_suspended"))

    # 13. Courier delivers shipment (COMPLETED)
    status, deliver_res = send_request(f"{base_url}/donations/{donation_id}/deliver", "POST", token=partner_token)
    if status != 200:
        print("Failed to finalize delivery:", deliver_res)
        sys.exit(1)
    print("Courier marked shipment as Delivered (COMPLETED).")

    # 14. Verify final tracking status
    status, track_res = send_request(f"{base_url}/donations/{donation_id}/track", token=ngo_token)
    if track_res["donation"]["status"] != "COMPLETED":
        print("Expected status COMPLETED, got:", track_res["donation"]["status"])
        sys.exit(1)
    print("End-to-End Unified Courier Integration Test SUCCESSFUL!")

if __name__ == "__main__":
    test_flow()
