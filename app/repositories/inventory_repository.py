from typing import Optional

from bson import ObjectId
from pymongo import DESCENDING

from app.database import get_database


def get_inventory_collection():
    return get_database()["inventory_items"]


async def create_inventory_item(
    document: dict,
) -> dict:

    collection = get_inventory_collection()

    result = await collection.insert_one(document)

    document["_id"] = result.inserted_id

    return document


async def find_inventory_by_id(
    inventory_id: str,
    tenant_id: ObjectId,
) -> Optional[dict]:

    if not ObjectId.is_valid(inventory_id):
        return None

    return await get_inventory_collection().find_one(
        {
            "_id": ObjectId(inventory_id),
            "tenant_id": tenant_id,
        }
    )


async def find_inventory_by_barcode(
    barcode: str,
    tenant_id: ObjectId,
) -> Optional[dict]:

    return await get_inventory_collection().find_one(
        {
            "tenant_id": tenant_id,
            "barcode": barcode,
        }
    )


async def list_inventory_items(
    *,
    tenant_id: ObjectId,
    query: dict,
    skip: int,
    limit: int,
) -> tuple[list[dict], int]:

    collection = get_inventory_collection()

    final_query = {
        "tenant_id": tenant_id,
        **query,
    }

    total = await collection.count_documents(
        final_query
    )

    cursor = (
        collection.find(final_query)
        .sort("created_at", DESCENDING)
        .skip(skip)
        .limit(limit)
    )

    items = await cursor.to_list(
        length=limit
    )

    return items, total


async def update_inventory_item(
    inventory_id: str,
    tenant_id: ObjectId,
    update_document: dict,
) -> Optional[dict]:

    if not ObjectId.is_valid(inventory_id):
        return None

    collection = get_inventory_collection()

    await collection.update_one(
        {
            "_id": ObjectId(inventory_id),
            "tenant_id": tenant_id,
        },
        {
            "$set": update_document
        },
    )

    return await find_inventory_by_id(
        inventory_id,
        tenant_id,
    )


async def delete_inventory_item(
    inventory_id: str,
    tenant_id: ObjectId,
) -> bool:

    if not ObjectId.is_valid(inventory_id):
        return False

    result = await get_inventory_collection().delete_one(
        {
            "_id": ObjectId(inventory_id),
            "tenant_id": tenant_id,
        }
    )

    return result.deleted_count == 1