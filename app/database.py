from typing import Optional

from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

from app.config import settings


class MongoDatabase:

    client: Optional[AsyncMongoClient] = None

    database: Optional[AsyncDatabase] = None


mongodb = MongoDatabase()


async def connect_to_mongodb() -> None:

    mongodb.client = AsyncMongoClient(
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


def get_database() -> AsyncDatabase:

    if mongodb.database is None:

        raise RuntimeError(
            "MongoDB connection has not been initialized."
        )

    return mongodb.database