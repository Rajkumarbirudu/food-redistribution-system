from typing import Optional

from bson import ObjectId

from app.database import get_database


# ============================================================
# COLLECTION
# ============================================================

def get_category_collection():
    database = get_database()

    return database.categories


# ============================================================
# CREATE CATEGORY
# ============================================================

async def create_category(
    document: dict,
) -> dict:
    collection = get_category_collection()

    result = await collection.insert_one(
        document
    )

    created_category = (
        await collection.find_one(
            {
                "_id": result.inserted_id,
            }
        )
    )

    return created_category


# ============================================================
# FIND CATEGORY BY ID
#
# IMPORTANT:
# MongoDB stores _id as ObjectId.
# Convert string IDs before querying.
# ============================================================

async def find_category_by_id(
    category_id,
) -> Optional[dict]:
    collection = get_category_collection()

    if category_id is None:
        return None

    if isinstance(category_id, ObjectId):
        object_id = category_id

    else:
        category_id_string = str(
            category_id
        ).strip()

        if not ObjectId.is_valid(
            category_id_string
        ):
            return None

        object_id = ObjectId(
            category_id_string
        )

    category = await collection.find_one(
        {
            "_id": object_id,
        }
    )

    return category


# ============================================================
# FIND CATEGORY BY NAME
# ============================================================

async def find_category_by_name(
    name: str,
) -> Optional[dict]:
    collection = get_category_collection()

    if not name:
        return None

    normalized_name = " ".join(
        str(name).split()
    ).lower()

    category = await collection.find_one(
        {
            "name_normalized":
                normalized_name,
        }
    )

    # Compatibility with categories that were inserted
    # before name_normalized was added.

    if category is None:
        category = await collection.find_one(
            {
                "name": {
                    "$regex":
                        f"^{normalized_name}$",

                    "$options":
                        "i",
                }
            }
        )

    return category


# ============================================================
# LIST ACTIVE CATEGORIES
# ============================================================

async def list_active_categories() -> list[dict]:
    collection = get_category_collection()

    cursor = collection.find(
        {
            "is_active": {
                "$ne": False,
            }
        }
    ).sort(
        "name",
        1,
    )

    categories = []

    async for category in cursor:
        categories.append(category)

    return categories


# ============================================================
# UPDATE CATEGORY
# ============================================================

async def update_category_by_id(
    category_id,
    update_document: dict,
) -> Optional[dict]:
    collection = get_category_collection()

    if isinstance(category_id, ObjectId):
        object_id = category_id

    else:
        category_id_string = str(
            category_id
        ).strip()

        if not ObjectId.is_valid(
            category_id_string
        ):
            return None

        object_id = ObjectId(
            category_id_string
        )

    await collection.update_one(
        {
            "_id": object_id,
        },
        {
            "$set": update_document,
        },
    )

    updated_category = (
        await collection.find_one(
            {
                "_id": object_id,
            }
        )
    )

    return updated_category