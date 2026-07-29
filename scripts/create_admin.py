import asyncio
from datetime import datetime, timezone

from app.core.security import hash_password
from app.database import (
    close_mongodb_connection,
    connect_to_mongodb,
    get_database,
)


async def seed_demo_users_internal(database=None) -> None:
    if database is None:
        database = get_database()

    now = datetime.now(timezone.utc)

    # 1. ADMIN
    admin_email = "admin@example.com"
    existing_admin = await database.users.find_one({"email": admin_email})
    if not existing_admin:
        admin_doc = {
            "tenant_id": None,
            "organization_id": None,
            "role": "ADMIN",
            "organization_name": "System Administration",
            "organization_type": "OTHER",
            "full_name": "System Administrator",
            "email": admin_email,
            "phone_number": "9876543212",
            "address": "System HQ",
            "password_hash": hash_password("AdminPassword@123"),
            "is_active": True,
            "approval_status": "APPROVED",
            "warnings_count": 0,
            "wallet_balance": 1000.0,
            "is_suspended": False,
            "created_at": now,
            "updated_at": now,
        }
        res = await database.users.insert_one(admin_doc)
        print(f"Created default admin user: {res.inserted_id}")

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


async def create_admin() -> None:
    await connect_to_mongodb()
    await seed_demo_users_internal()
    await close_mongodb_connection()


if __name__ == "__main__":
    asyncio.run(create_admin())