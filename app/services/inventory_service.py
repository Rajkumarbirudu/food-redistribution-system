from datetime import date, datetime, time, timezone
from typing import Optional

from bson import ObjectId
from fastapi import HTTPException, status

from app.database import get_database
from app.models.enums import ExpiryStatus


# ============================================================
# COLLECTION
# ============================================================

def get_inventory_collection():
    database = get_database()
    return database.inventory


# ============================================================
# BSON NORMALIZATION
#
# MongoDB/PyMongo cannot encode:
#     datetime.date
#     datetime.time
#     Enum objects
#
# Convert them before insert/update.
# ============================================================

def normalize_for_mongodb(value):
    if value is None:
        return None

    # datetime is also a subclass of date,
    # so check datetime first.
    if isinstance(value, datetime):
        return value

    if isinstance(value, date):
        return datetime.combine(
            value,
            time.min,
            tzinfo=timezone.utc,
        )

    if isinstance(value, time):
        return value.strftime("%H:%M:%S")

    if isinstance(value, ObjectId):
        return value

    if hasattr(value, "value"):
        return value.value

    if isinstance(value, dict):
        return {
            key: normalize_for_mongodb(item)
            for key, item in value.items()
        }

    if isinstance(value, list):
        return [
            normalize_for_mongodb(item)
            for item in value
        ]

    if isinstance(value, tuple):
        return [
            normalize_for_mongodb(item)
            for item in value
        ]

    return value


# ============================================================
# EXPIRY CALCULATION
# ============================================================

def calculate_expiry_details(
    expiry_date: date,
    warning_days: int,
) -> tuple[int, ExpiryStatus]:
    today = datetime.now(
        timezone.utc
    ).date()

    if isinstance(expiry_date, datetime):
        expiry_day = expiry_date.date()
    else:
        expiry_day = expiry_date

    days_until_expiry = (
        expiry_day - today
    ).days

    if days_until_expiry < 0:
        expiry_status = ExpiryStatus.EXPIRED

    elif days_until_expiry <= warning_days:
        expiry_status = ExpiryStatus.EXPIRING_SOON

    else:
        expiry_status = ExpiryStatus.FRESH

    return (
        days_until_expiry,
        expiry_status,
    )


# ============================================================
# SERIALIZER
# ============================================================

def serialize_inventory_item(
    item: dict,
) -> dict:
    if item is None:
        return None

    result = dict(item)

    if "_id" in result:
        result["id"] = str(
            result.pop("_id")
        )

    elif result.get("id") is not None:
        result["id"] = str(
            result["id"]
        )

    for field in (
        "tenant_id",
        "category_id",
        "created_by",
        "updated_by",
    ):
        if result.get(field) is not None:
            result[field] = str(
                result[field]
            )

    expiry_status = result.get(
        "expiry_status"
    )

    if hasattr(expiry_status, "value"):
        result["expiry_status"] = (
            expiry_status.value
        )

    return result


# ============================================================
# CREATE
#
# Existing required signature:
#
# create_inventory_item(document: dict) -> dict
# ============================================================

async def create_inventory_item(
    document: dict,
) -> dict:
    collection = get_inventory_collection()

    mongodb_document = (
        normalize_for_mongodb(
            dict(document)
        )
    )

    result = await collection.insert_one(
        mongodb_document
    )

    created_item = await collection.find_one(
        {
            "_id": result.inserted_id,
        }
    )

    if created_item is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Inventory item was inserted "
                "but could not be retrieved"
            ),
        )

    return serialize_inventory_item(
        created_item
    )


# ============================================================
# LIST
#
# Keep exact signature expected by inventory_routes.py.
# ============================================================

async def list_inventory_items(
    *,
    tenant_id: ObjectId,
    query: dict,
    skip: int,
    limit: int,
) -> tuple[list[dict], int]:
    collection = get_inventory_collection()

    tenant_values = [tenant_id, str(tenant_id)]
    if ObjectId.is_valid(str(tenant_id)):
        tenant_values.append(ObjectId(str(tenant_id)))

    mongo_query = {
        "$or": [
            {"tenant_id": {"$in": tenant_values}},
            {"organization_id": {"$in": tenant_values}},
            {"created_by": {"$in": tenant_values}},
        ],
        **query,
    }

    total = await collection.count_documents(
        mongo_query
    )

    cursor = (
        collection
        .find(mongo_query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    items = []

    async for item in cursor:
        items.append(
            serialize_inventory_item(item)
        )

    return items, total


# ============================================================
# GET ONE
#
# Keep exact signature expected by inventory_routes.py.
# ============================================================

async def get_inventory_item(
    inventory_id: str,
    current_user: dict,
) -> dict:
    collection = get_inventory_collection()

    if not ObjectId.is_valid(
        str(inventory_id)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid inventory ID",
        )

    tenant_id = current_user.get("tenant_id") or current_user.get("organization_id") or current_user.get("_id")

    if tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "User does not belong to a tenant"
            ),
        )

    tenant_values = [tenant_id, str(tenant_id)]
    if ObjectId.is_valid(str(tenant_id)):
        tenant_values.append(ObjectId(str(tenant_id)))

    item = await collection.find_one(
        {
            "_id": ObjectId(
                str(inventory_id)
            ),
            "$or": [
                {"tenant_id": {"$in": tenant_values}},
                {"organization_id": {"$in": tenant_values}},
                {"created_by": {"$in": tenant_values}},
            ],
        }
    )

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found",
        )

    return serialize_inventory_item(item)


# ============================================================
# UPDATE
#
# Keep exact signature expected by inventory_routes.py.
# ============================================================

async def update_inventory_item(
    inventory_id: str,
    tenant_id: ObjectId,
    update_document: dict,
) -> Optional[dict]:
    collection = get_inventory_collection()

    if not ObjectId.is_valid(
        str(inventory_id)
    ):
        return None

    mongodb_update = (
        normalize_for_mongodb(
            dict(update_document)
        )
    )

    tenant_values = [tenant_id, str(tenant_id)]
    if ObjectId.is_valid(str(tenant_id)):
        tenant_values.append(ObjectId(str(tenant_id)))

    result = await collection.update_one(
        {
            "_id": ObjectId(
                str(inventory_id)
            ),
            "$or": [
                {"tenant_id": {"$in": tenant_values}},
                {"organization_id": {"$in": tenant_values}},
                {"created_by": {"$in": tenant_values}},
            ],
        },
        {
            "$set": mongodb_update,
        },
    )

    if result.matched_count == 0:
        return None

    updated_item = await collection.find_one(
        {
            "_id": ObjectId(
                str(inventory_id)
            ),
        }
    )

    if updated_item is None:
        return None

    return serialize_inventory_item(
        updated_item
    )


# ============================================================
# DELETE
#
# Keep exact signature expected by inventory_routes.py.
# ============================================================

async def delete_inventory_item(
    inventory_id: str,
    tenant_id: ObjectId,
) -> bool:
    collection = get_inventory_collection()

    if not ObjectId.is_valid(
        str(inventory_id)
    ):
        return False

    tenant_values = [tenant_id, str(tenant_id)]
    if ObjectId.is_valid(str(tenant_id)):
        tenant_values.append(ObjectId(str(tenant_id)))

    result = await collection.delete_one(
        {
            "_id": ObjectId(
                str(inventory_id)
            ),
            "$or": [
                {"tenant_id": {"$in": tenant_values}},
                {"organization_id": {"$in": tenant_values}},
                {"created_by": {"$in": tenant_values}},
            ],
        }
    )

    return result.deleted_count == 1