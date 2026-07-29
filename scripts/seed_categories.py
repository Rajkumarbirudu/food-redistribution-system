import asyncio
from datetime import datetime, timezone

from app.database import (
    close_mongodb_connection,
    connect_to_mongodb,
    get_database,
)


DEFAULT_CATEGORIES = [
    {
        "name": "Fresh Vegetables",
        "description": "Fresh vegetables with short shelf life",
        "perishability_risk": "HIGH",
        "storage_requirement": "REFRIGERATED",
        "default_expiry_warning_days": 2,
    },
    {
        "name": "Fresh Fruits",
        "description": "Fresh fruits and produce",
        "perishability_risk": "HIGH",
        "storage_requirement": "REFRIGERATED",
        "default_expiry_warning_days": 3,
    },
    {
        "name": "Dairy Products",
        "description": "Milk, curd, cheese and other dairy products",
        "perishability_risk": "HIGH",
        "storage_requirement": "REFRIGERATED",
        "default_expiry_warning_days": 3,
    },
    {
        "name": "Meat and Poultry",
        "description": "Fresh meat and poultry products",
        "perishability_risk": "HIGH",
        "storage_requirement": "REFRIGERATED",
        "default_expiry_warning_days": 2,
    },
    {
        "name": "Seafood",
        "description": "Fresh fish and seafood products",
        "perishability_risk": "HIGH",
        "storage_requirement": "REFRIGERATED",
        "default_expiry_warning_days": 1,
    },
    {
        "name": "Cooked Food",
        "description": "Prepared meals and cooked food",
        "perishability_risk": "HIGH",
        "storage_requirement": "REFRIGERATED",
        "default_expiry_warning_days": 1,
    },
    {
        "name": "Bakery Products",
        "description": "Bread, cakes and baked food products",
        "perishability_risk": "MEDIUM",
        "storage_requirement": "AMBIENT",
        "default_expiry_warning_days": 3,
    },
    {
        "name": "Frozen Food",
        "description": "Food products stored under frozen conditions",
        "perishability_risk": "LOW",
        "storage_requirement": "FROZEN",
        "default_expiry_warning_days": 7,
    },
    {
        "name": "Packaged Food",
        "description": "Packaged and shelf-stable food products",
        "perishability_risk": "LOW",
        "storage_requirement": "AMBIENT",
        "default_expiry_warning_days": 7,
    },
    {
        "name": "Beverages",
        "description": "Non-alcoholic beverages and drinks",
        "perishability_risk": "LOW",
        "storage_requirement": "AMBIENT",
        "default_expiry_warning_days": 7,
    },
]


async def seed_categories() -> None:
    await connect_to_mongodb()

    try:
        database = get_database()

        collection = database["food_categories"]

        created_count = 0
        skipped_count = 0

        for category in DEFAULT_CATEGORIES:
            normalized_name = category["name"].strip().lower()

            existing_category = await collection.find_one(
                {
                    "name_normalized": normalized_name
                }
            )

            if existing_category:
                print(
                    f"SKIPPED: {category['name']} already exists"
                )

                skipped_count += 1

                continue

            now = datetime.now(timezone.utc)

            category_document = {
                **category,
                "name_normalized": normalized_name,
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }

            await collection.insert_one(category_document)

            print(
                f"CREATED: {category['name']}"
            )

            created_count += 1

        print()
        print(f"Created: {created_count}")
        print(f"Skipped: {skipped_count}")

    finally:
        await close_mongodb_connection()


if __name__ == "__main__":
    asyncio.run(seed_categories())