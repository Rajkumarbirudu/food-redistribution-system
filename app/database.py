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
        serverSelectionTimeoutMS=5000,
    )

    await mongodb.client.admin.command("ping")

    mongodb.database = mongodb.client[
        settings.DATABASE_NAME
    ]

    print(
        f"Connected to MongoDB database: "
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