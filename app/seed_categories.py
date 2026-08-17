import asyncio

from datetime import datetime, timezone

from app.database import (
    close_mongodb_connection,
    connect_to_mongodb,
    get_database,
)


DEFAULT_CATEGORIES = [
    {
        "name": "Dairy",
        "description": (
            "Milk, curd, cheese and other dairy products."
        ),
        "perishability_risk": "HIGH",
        "storage_requirement": "REFRIGERATED",
        "default_expiry_warning_days": 2,
    },
    {
        "name": "Fruits",
        "description": (
            "Fresh fruits and fruit products."
        ),
        "perishability_risk": "MEDIUM",
        "storage_requirement": "COOL_DRY_PLACE",
        "default_expiry_warning_days": 3,
    },
    {
        "name": "Vegetables",
        "description": (
            "Fresh vegetables and vegetable products."
        ),
        "perishability_risk": "HIGH",
        "storage_requirement": "COOL_DRY_PLACE",
        "default_expiry_warning_days": 3,
    },
    {
        "name": "Grains",
        "description": (
            "Rice, wheat and other grain products."
        ),
        "perishability_risk": "LOW",
        "storage_requirement": "ROOM_TEMPERATURE",
        "default_expiry_warning_days": 15,
    },
    {
        "name": "Bakery",
        "description": (
            "Bread, cakes and bakery products."
        ),
        "perishability_risk": "MEDIUM",
        "storage_requirement": "ROOM_TEMPERATURE",
        "default_expiry_warning_days": 2,
    },
    {
        "name": "Cooked Food",
        "description": (
            "Prepared meals and cooked food."
        ),
        "perishability_risk": "HIGH",
        "storage_requirement": "REFRIGERATED",
        "default_expiry_warning_days": 1,
    },
    {
        "name": "Packaged Food",
        "description": (
            "Sealed and packaged food products."
        ),
        "perishability_risk": "LOW",
        "storage_requirement": "ROOM_TEMPERATURE",
        "default_expiry_warning_days": 15,
    },
]


async def seed_categories_internal(database=None):
    if database is None:
        database = get_database()

    for category in DEFAULT_CATEGORIES:
        category_name = category["name"]
        normalized_name = category_name.strip().lower()
        now = datetime.now(timezone.utc)

        existing = await database.categories.find_one(
            {"name_normalized": normalized_name}
        )

        if existing is not None:
            await database.categories.update_one(
                {"_id": existing["_id"]},
                {
                    "$set": {
                        **category,
                        "name_normalized": normalized_name,
                        "is_active": True,
                        "updated_at": now,
                    }
                },
            )
        else:
            document = {
                **category,
                "name_normalized": normalized_name,
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
            await database.categories.insert_one(document)


async def main():
    try:
        print("=" * 60)
        print("AURA FOOD CATEGORY SEEDER")
        print("=" * 60)

        await connect_to_mongodb()
        database = get_database()
        print("DATABASE NAME:", database.name)

        await seed_categories_internal(database)

        total_count = await database.categories.count_documents({})
        active_count = await database.categories.count_documents({"is_active": {"$ne": False}})

        print("=" * 60)
        print("TOTAL CATEGORIES:", total_count)
        print("ACTIVE CATEGORIES:", active_count)
        print("CATEGORY SEED COMPLETED")
        print("=" * 60)

    finally:
        await close_mongodb_connection()


if __name__ == "__main__":
    asyncio.run(main())