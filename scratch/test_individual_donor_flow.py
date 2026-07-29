import requests
import json
import random

BASE_URL = "http://127.0.0.1:8002"

def test_flow():
    print("Testing Individual Donor Registration & Dashboard Operations Flow...")
    rand_id = random.randint(1000, 9999)
    email = f"home_donor_{rand_id}@aurafood.org"
    password = "Password@123"

    # 1. Register Individual Donor with Aadhar, PAN, OTP
    reg_payload = {
        "role": "INDIVIDUAL_DONOR",
        "full_name": f"Anand Kumar (Household {rand_id})",
        "email": email,
        "phone_number": f"98765{rand_id}",
        "address": "Flat 302, Green Acres Apartments, Hitech City, Hyderabad",
        "password": password,
        "confirm_password": password,
        "aadhar_number": f"4920 1829 {rand_id}",
        "pan_number": f"ABCDE{rand_id}F",
        "is_otp_verified": True,
        "is_aadhar_verified": True,
        "is_pan_verified": True,
        "agree_terms": True
    }

    res = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
    print(f"Register Status Code: {res.status_code}")
    if res.status_code not in (200, 201):
        print("Register failed:", res.text)
        return False

    reg_data = res.json()
    user_id = reg_data["user"]["id"]
    print(f"Registered Individual Donor ID: {user_id}")

    # 2. Login as Admin to approve the account
    admin_login = requests.post(f"{BASE_URL}/auth/login", data={"username": "systemadmin@aurafood.org", "password": "AdminPassword@123"})
    if admin_login.status_code != 200:
        print("Admin login failed:", admin_login.text)
        return False
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Approve individual donor
    app_res = requests.patch(f"{BASE_URL}/admin/users/{user_id}/approve", headers=admin_headers)
    print(f"Approve Status: {app_res.status_code}")

    # 3. Login as Individual Donor
    login_res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
    print(f"Individual Donor Login Status: {login_res.status_code}")
    if login_res.status_code != 200:
        print("Individual Donor login failed:", login_res.text)
        return False

    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Fetch Categories
    cat_res = requests.get(f"{BASE_URL}/categories", headers=headers)
    categories = cat_res.json()
    cat_id = categories[0]["id"] if categories else ""

    # 5. Create Household Inventory Item
    inv_payload = {
        "name": "Home-Cooked Vegetable Pulao (6 Servings)",
        "category_id": cat_id,
        "quantity": 6.0,
        "unit": "SERVING",
        "expiry_date": "2027-09-30T18:00:00Z",
        "notes": "Freshly cooked at home."
    }
    inv_res = requests.post(f"{BASE_URL}/inventory", json=inv_payload, headers=headers)
    print(f"Create Household Inventory Status: {inv_res.status_code}")
    if inv_res.status_code != 201:
        print("Create inventory failed:", inv_res.text)
        return False
    inv_id = inv_res.json()["id"]

    # 6. Publish Surplus Donation from Individual Household
    don_payload = {
        "inventory_id": inv_id,
        "quantity": 6.0,
        "pickup_deadline": "2027-09-30T18:00:00Z",
        "notes": "Home pickup near Hitech City."
    }
    don_res = requests.post(f"{BASE_URL}/donations", json=don_payload, headers=headers)
    print(f"Post Home Donation Status: {don_res.status_code}")
    if don_res.status_code != 201:
        print("Post donation failed:", don_res.text)
        return False
    don_id = don_res.json()["id"]
    print(f"Published Home Food Donation ID: {don_id}")

    # 7. List Household Inventory & Active Donations
    list_inv = requests.get(f"{BASE_URL}/inventory", headers=headers)
    print(f"List Household Inventory Items: {len(list_inv.json())}")

    list_don = requests.get(f"{BASE_URL}/donations", headers=headers)
    print(f"List Individual Donations Items: {len(list_don.json())}")

    print("Individual Donor Integration Test SUCCESSFUL! All operations verified.")
    return True

if __name__ == "__main__":
    test_flow()
