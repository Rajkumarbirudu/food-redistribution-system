from typing import Optional

from bson import ObjectId

from app.database import get_database


def get_users_collection():
    database = get_database()

    return database["users"]


async def find_user_by_email(
    email: str,
) -> Optional[dict]:

    collection = get_users_collection()

    return await collection.find_one(
        {
            "email": email.lower()
        }
    )


async def find_user_by_id(
    user_id: str,
) -> Optional[dict]:

    if not ObjectId.is_valid(user_id):
        return None

    collection = get_users_collection()

    return await collection.find_one(
        {
            "_id": ObjectId(user_id)
        }
    )


async def create_user(
    user_document: dict,
) -> dict:

    collection = get_users_collection()

    result = await collection.insert_one(
        user_document
    )

    user_document["_id"] = result.inserted_id

    return user_document