from typing import Any, Optional

try:
    from motor.motor_asyncio import AsyncIOMotorClient as MongoClientType
    from motor.motor_asyncio import AsyncIOMotorDatabase as MongoDatabaseType
except ImportError:
    try:
        from pymongo import AsyncMongoClient as MongoClientType  # type: ignore
        from pymongo.asynchronous.database import AsyncDatabase as MongoDatabaseType  # type: ignore
    except ImportError:
        from pymongo import MongoClient as MongoClientType  # type: ignore
        MongoDatabaseType = Any  # type: ignore

from app.config import settings


class MongoDatabase:
    client: Optional[Any] = None
    database: Optional[Any] = None


mongodb = MongoDatabase()


async def connect_to_mongodb() -> None:
    mongodb.client = MongoClientType(
        settings.MONGODB_URL,
        maxPoolSize=100,
        minPoolSize=10,
        maxIdleTimeMS=45000,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
        retryWrites=True,
    )

    await mongodb.client.admin.command("ping")

    mongodb.database = mongodb.client[
        settings.DATABASE_NAME
    ]

    try:
        await mongodb.database.users.create_index("email", sparse=True)
        await mongodb.database.donations.create_index("status")
        await mongodb.database.inventory.create_index("tenant_id")
    except Exception as idx_err:
        print(f"Notice: Index setup: {idx_err}")

    print(
        f"Connected to High-Performance MongoDB cluster: "
        f"{settings.DATABASE_NAME}"
    )


async def close_mongodb_connection() -> None:
    if mongodb.client is not None:
        await mongodb.client.close()
        print("MongoDB connection closed")


def get_database() -> Any:
    if mongodb.database is None:
        raise RuntimeError(
            "MongoDB connection has not been initialized."
        )

    return mongodb.database