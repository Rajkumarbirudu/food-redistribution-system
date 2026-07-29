import asyncio
from datetime import datetime, timezone

from app.core.security import hash_password
from app.database import (
    close_mongodb_connection,
    connect_to_mongodb,
    get_database,
)


async def create_admin() -> None:

    await connect_to_mongodb()

    database = get_database()

    email = "admin@example.com"

    existing_admin = await database.users.find_one(
        {
            "email": email
        }
    )

    if existing_admin:
        print("Admin already exists")

        await close_mongodb_connection()

        return

    now = datetime.now(timezone.utc)

    admin_document = {
        "tenant_id": str | None,
        "role": "ADMIN",
        "organization_name": "System Administration",
        "organization_type": "OTHER",
        "full_name": "System Administrator",
        "email": email,
        "phone_number": "9876543212",
        "address": "System",
        "password_hash": hash_password(
            "AdminPassword@123"
        ),
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }

    result = await database.users.insert_one(
        admin_document
    )

    print(
        f"Admin created successfully: "
        f"{result.inserted_id}"
    )

    await close_mongodb_connection()


if __name__ == "__main__":
    asyncio.run(create_admin())