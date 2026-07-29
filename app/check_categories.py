import asyncio

from app.database import (
    close_mongodb_connection,
    connect_to_mongodb,
    get_database,
)


async def main():
    try:
        print("=" * 60)
        print("AURA FOOD CATEGORY CHECK")
        print("=" * 60)

        await connect_to_mongodb()

        database = get_database()

        print("DATABASE NAME:", database.name)

        total_count = (
            await database.categories.count_documents({})
        )

        active_count = (
            await database.categories.count_documents(
                {
                    "is_active": {
                        "$ne": False,
                    }
                }
            )
        )

        print("TOTAL CATEGORIES:", total_count)
        print("ACTIVE CATEGORIES:", active_count)

        cursor = database.categories.find({}).sort(
            "name",
            1,
        )

        print("-" * 60)

        async for category in cursor:
            print(
                "NAME:",
                category.get("name"),
                "| ACTIVE:",
                category.get("is_active"),
                "| ID:",
                category.get("_id"),
            )

        print("-" * 60)
        print("CATEGORY CHECK COMPLETED")

    finally:
        await close_mongodb_connection()


if __name__ == "__main__":
    asyncio.run(main())