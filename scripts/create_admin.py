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

    demo_accounts = [
        # Aura.com accounts (used across frontend login portals)
        {
            "role": "ADMIN",
            "organization_name": "Aura System Administration",
            "organization_type": "OTHER",
            "full_name": "System Administrator",
            "email": "admin@aura.com",
            "phone_number": "9876543210",
            "address": "Aura Central HQ, Suite 100",
            "password": "password123",
        },
        {
            "role": "DONOR",
            "organization_name": "Aura Fresh Supermarket & Eatery",
            "organization_type": "RESTAURANT",
            "full_name": "Aura Commercial Donor",
            "email": "donor@aura.com",
            "phone_number": "9876543211",
            "address": "100 Market Way, Downtown",
            "password": "password123",
        },
        {
            "role": "INDIVIDUAL_DONOR",
            "organization_name": "Individual Household - Sarah Jenkins",
            "organization_type": "INDIVIDUAL",
            "full_name": "Sarah Jenkins",
            "email": "individual@aura.com",
            "phone_number": "9876543214",
            "address": "42 Pine Street, Apt 3B",
            "password": "password123",
        },
        {
            "role": "NGO",
            "organization_name": "Aura Community Food Relief Bank",
            "organization_type": "NGO",
            "full_name": "Aura Food Bank Coordinator",
            "email": "ngo@aura.com",
            "phone_number": "9876543212",
            "address": "500 Community Drive, City",
            "password": "password123",
        },
        {
            "role": "DELIVERY_PARTNER",
            "organization_name": "Aura Swift Express Logistics",
            "organization_type": "DELIVERY_PARTNER",
            "full_name": "Swift Logistics Partner",
            "email": "delivery@aura.com",
            "phone_number": "9876543213",
            "address": "789 Logistics Blvd, City",
            "password": "password123",
            "license_number": "DL-9988776655",
            "vehicle_number": "MH-12-AB-1234",
        },
        # Example.com accounts (backup/testing credentials)
        {
            "role": "ADMIN",
            "organization_name": "System Administration",
            "organization_type": "OTHER",
            "full_name": "System Administrator",
            "email": "admin@example.com",
            "phone_number": "9876543220",
            "address": "System HQ",
            "password": "AdminPassword@123",
        },
        {
            "role": "DONOR",
            "organization_name": "Green Harvest Supermarket",
            "organization_type": "RESTAURANT",
            "full_name": "Green Harvest Donor",
            "email": "donor@example.com",
            "phone_number": "9876543221",
            "address": "123 Market Street, City",
            "password": "DonorPassword@123",
        },
        {
            "role": "NGO",
            "organization_name": "Hope Food Bank",
            "organization_type": "NGO",
            "full_name": "Hope Relief Foundation",
            "email": "ngo@example.com",
            "phone_number": "9876543222",
            "address": "456 Community Lane, City",
            "password": "NgoPassword@123",
        },
        {
            "role": "DELIVERY_PARTNER",
            "organization_name": "Swift Express Logistics",
            "organization_type": "DELIVERY_PARTNER",
            "full_name": "Swift Logistics Partner",
            "email": "delivery@example.com",
            "phone_number": "9876543223",
            "address": "789 Logistics Blvd, City",
            "password": "DeliveryPassword@123",
            "license_number": "DL-9988776655",
            "vehicle_number": "MH-12-AB-1234",
        },
    ]

    for acc in demo_accounts:
        clean_email = acc["email"].strip().lower()
        existing = await database.users.find_one(
            {"email": {"$regex": f"^{re.escape(clean_email)}$", "$options": "i"}}
        )
        if not existing:
            # Create organization first if needed
            org_id = None
            if acc["organization_name"]:
                org_doc = {
                    "name": acc["organization_name"],
                    "type": acc.get("organization_type", "OTHER"),
                    "address": acc["address"],
                    "phone_number": acc["phone_number"],
                    "created_at": now,
                    "updated_at": now,
                }
                org_res = await database.organizations.insert_one(org_doc)
                org_id = str(org_res.inserted_id)

            user_doc = {
                "tenant_id": org_id,
                "organization_id": org_id,
                "role": acc["role"],
                "organization_name": acc["organization_name"],
                "full_name": acc["full_name"],
                "email": clean_email,
                "phone_number": acc["phone_number"],
                "address": acc["address"],
                "password_hash": hash_password(acc["password"]),
                "is_active": True,
                "approval_status": "APPROVED",
                "license_number": acc.get("license_number"),
                "vehicle_number": acc.get("vehicle_number"),
                "warnings_count": 0,
                "wallet_balance": 1000.0,
                "is_suspended": False,
                "created_at": now,
                "updated_at": now,
            }
            await database.users.insert_one(user_doc)
            print(f"[DEMO SEED] Created user: {clean_email} ({acc['role']})")
        else:
            # Update password hash, is_active, and approval_status to ensure demo user can sign in
            await database.users.update_one(
                {"_id": existing["_id"]},
                {
                    "$set": {
                        "password_hash": hash_password(acc["password"]),
                        "is_active": True,
                        "approval_status": "APPROVED",
                        "is_suspended": False,
                        "updated_at": now,
                    }
                },
            )
            print(f"[DEMO SEED] Updated/verified user: {clean_email}")


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