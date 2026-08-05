import argparse
import asyncio
import os
import re
import sys
from datetime import datetime, timezone

# Ensure project root directory is in sys.path when script is executed directly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.security import hash_password
from app.database import (
    close_mongodb_connection,
    connect_to_mongodb,
    get_database,
)


async def create_admin_account(
    email: str,
    password: str,
    full_name: str = "System Administrator",
    phone_number: str = "9876543212",
    address: str = "System HQ",
    database=None,
) -> dict | None:
    """
    Dedicated method to create a unique Admin account with strict credential uniqueness validation.
    """
    if database is None:
        database = get_database()

    clean_email = email.strip().lower()
    clean_phone = phone_number.strip() if phone_number else ""

    # Check Email Uniqueness
    existing_user_email = await database.users.find_one(
        {"email": {"$regex": f"^{re.escape(clean_email)}$", "$options": "i"}}
    )
    if existing_user_email:
        print(f"[ERROR] Cannot create admin account: User with email '{clean_email}' already exists! Admin credentials must be unique.")
        return None

    # Check Phone Uniqueness if phone is provided
    if clean_phone:
        existing_user_phone = await database.users.find_one({"phone_number": clean_phone})
        if existing_user_phone:
            print(f"[ERROR] Cannot create admin account: User with phone number '{clean_phone}' already exists! Admin credentials must be unique.")
            return None

    now = datetime.now(timezone.utc)
    admin_doc = {
        "tenant_id": None,
        "organization_id": None,
        "role": "ADMIN",
        "organization_name": "System Administration",
        "organization_type": "OTHER",
        "full_name": full_name.strip(),
        "email": clean_email,
        "phone_number": clean_phone,
        "address": address.strip(),
        "password_hash": hash_password(password),
        "is_active": True,
        "approval_status": "APPROVED",
        "warnings_count": 0,
        "wallet_balance": 1000.0,
        "is_suspended": False,
        "created_at": now,
        "updated_at": now,
    }

    res = await database.users.insert_one(admin_doc)
    admin_doc["_id"] = res.inserted_id
    print(f"[SUCCESS] Created unique Admin account: {clean_email} (ID: {res.inserted_id})")
    return admin_doc


async def seed_demo_users_internal(database=None) -> None:
    if database is None:
        database = get_database()

    now = datetime.now(timezone.utc)

    # 1. ADMIN
    admin_email = "admin@example.com"
    existing_admin = await database.users.find_one({"email": admin_email})
    if not existing_admin:
        await create_admin_account(
            email=admin_email,
            password="AdminPassword@123",
            full_name="System Administrator",
            phone_number="9876543212",
            address="System HQ",
            database=database,
        )

    # 2. DONOR
    donor_email = "donor@example.com"
    existing_donor = await database.users.find_one({"email": donor_email})
    if not existing_donor:
        donor_doc = {
            "tenant_id": None,
            "organization_id": None,
            "role": "DONOR",
            "organization_name": "Green Harvest Supermarket",
            "organization_type": "RESTAURANT",
            "full_name": "Green Harvest Donor",
            "email": donor_email,
            "phone_number": "9876543210",
            "address": "123 Market Street, City",
            "password_hash": hash_password("DonorPassword@123"),
            "is_active": True,
            "approval_status": "APPROVED",
            "warnings_count": 0,
            "wallet_balance": 1000.0,
            "is_suspended": False,
            "created_at": now,
            "updated_at": now,
        }
        await database.users.insert_one(donor_doc)
        print("Created default demo donor user")

    # 3. NGO
    ngo_email = "ngo@example.com"
    existing_ngo = await database.users.find_one({"email": ngo_email})
    if not existing_ngo:
        ngo_doc = {
            "tenant_id": None,
            "organization_id": None,
            "role": "NGO",
            "organization_name": "Hope Food Bank",
            "organization_type": "NGO",
            "full_name": "Hope Relief Foundation",
            "email": ngo_email,
            "phone_number": "9876543211",
            "address": "456 Community Lane, City",
            "password_hash": hash_password("NgoPassword@123"),
            "is_active": True,
            "approval_status": "APPROVED",
            "warnings_count": 0,
            "wallet_balance": 1000.0,
            "is_suspended": False,
            "created_at": now,
            "updated_at": now,
        }
        await database.users.insert_one(ngo_doc)
        print("Created default demo NGO user")

    # 4. DELIVERY PARTNER
    delivery_email = "delivery@example.com"
    existing_delivery = await database.users.find_one({"email": delivery_email})
    if not existing_delivery:
        delivery_doc = {
            "tenant_id": None,
            "organization_id": None,
            "role": "DELIVERY_PARTNER",
            "organization_name": "Swift Express Logistics",
            "organization_type": "DELIVERY_PARTNER",
            "full_name": "Swift Logistics Partner",
            "email": delivery_email,
            "phone_number": "9876543213",
            "address": "789 Logistics Blvd, City",
            "password_hash": hash_password("DeliveryPassword@123"),
            "is_active": True,
            "approval_status": "APPROVED",
            "license_number": "DL-9988776655",
            "vehicle_number": "MH-12-AB-1234",
            "warnings_count": 0,
            "wallet_balance": 1000.0,
            "is_suspended": False,
            "created_at": now,
            "updated_at": now,
        }
        await database.users.insert_one(delivery_doc)
        print("Created default demo delivery partner user")


async def main_cli():
    parser = argparse.ArgumentParser(description="Dedicated CLI tool for creating unique Administrator accounts.")
    parser.add_argument("--email", type=str, help="Admin user email (must be unique)")
    parser.add_argument("--password", type=str, help="Admin user password")
    parser.add_argument("--name", type=str, default="System Administrator", help="Full Name")
    parser.add_argument("--phone", type=str, default="9876543212", help="Phone Number (must be unique)")
    parser.add_argument("--address", type=str, default="System HQ", help="Address")
    parser.add_argument("--seed", action="store_true", help="Run full demo users seed")

    args = parser.parse_args()

    await connect_to_mongodb()
    try:
        if args.seed or (not args.email and not args.password):
            print("Running default seed / demo user creation...")
            await seed_demo_users_internal()
        else:
            if not args.email or not args.password:
                print("[ERROR] Both --email and --password are required when creating a custom admin account!")
                sys.exit(1)

            await create_admin_account(
                email=args.email,
                password=args.password,
                full_name=args.name,
                phone_number=args.phone,
                address=args.address,
            )
    finally:
        await close_mongodb_connection()


if __name__ == "__main__":
    asyncio.run(main_cli())