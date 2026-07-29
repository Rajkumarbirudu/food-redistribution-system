from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status

from app.database import get_database


def serialize_value(value):
    if isinstance(value, ObjectId):
        return str(value)

    if isinstance(value, datetime):
        return value.isoformat()

    if isinstance(value, list):
        return [serialize_value(item) for item in value]

    if isinstance(value, dict):
        return {
            key: serialize_value(item)
            for key, item in value.items()
        }

    return value


def serialize_document(document: dict) -> dict:
    result = {}

    for key, value in document.items():
        if key in {
            "password",
            "password_hash",
            "hashed_password",
        }:
            continue

        if key == "_id":
            result["id"] = str(value)
        else:
            result[key] = serialize_value(value)

    return result


async def count_by_status(collection, field: str, value: str):
    return await collection.count_documents(
        {
            field: {
                "$regex": f"^{value}$",
                "$options": "i",
            }
        }
    )


async def get_admin_dashboard() -> dict:
    database = get_database()

    total_users = await database.users.count_documents({})

    total_organizations = (
        await database.organizations.count_documents({})
    )

    total_inventory_items = (
        await database.inventory_items.count_documents({})
    )

    total_donations = (
        await database.donations.count_documents({})
    )

    available_donations = await count_by_status(
        database.donations,
        "status",
        "AVAILABLE",
    )

    claimed_donations = await count_by_status(
        database.donations,
        "status",
        "CLAIMED",
    )

    completed_donations = await count_by_status(
        database.donations,
        "status",
        "COMPLETED",
    )

    cancelled_donations = await count_by_status(
        database.donations,
        "status",
        "CANCELLED",
    )

    fresh_inventory = await count_by_status(
        database.inventory_items,
        "expiry_status",
        "FRESH",
    )

    expiring_soon_inventory = await count_by_status(
        database.inventory_items,
        "expiry_status",
        "EXPIRING_SOON",
    )

    expired_inventory = await count_by_status(
        database.inventory_items,
        "expiry_status",
        "EXPIRED",
    )

    pending_users = await database.users.count_documents(
        {
            "role": {
                "$in": ["DONOR", "NGO"],
            },
            "approval_status": "PENDING",
        }
    )

    return {
        "total_users": total_users,
        "total_organizations": total_organizations,
        "total_inventory_items": total_inventory_items,
        "total_donations": total_donations,

        "pending_users": pending_users,

        "donation_overview": {
            "available": available_donations,
            "claimed": claimed_donations,
            "completed": completed_donations,
            "cancelled": cancelled_donations,
        },

        "inventory_expiry_overview": {
            "fresh": fresh_inventory,
            "expiring_soon": expiring_soon_inventory,
            "expired": expired_inventory,
        },
    }


async def get_admin_users(
    *,
    approval_status: str | None = None,
    role: str | None = None,
) -> list[dict]:
    database = get_database()

    query = {}

    if approval_status:
        query["approval_status"] = approval_status.upper()

    if role:
        query["role"] = role.upper()

    cursor = database.users.find(query).sort(
        "created_at",
        -1,
    )

    users = []

    async for user in cursor:
        users.append(
            serialize_document(user)
        )

    return users


async def get_admin_organizations() -> list[dict]:
    database = get_database()

    cursor = database.organizations.find({}).sort(
        "created_at",
        -1,
    )

    organizations = []

    async for organization in cursor:
        organizations.append(
            serialize_document(organization)
        )

    return organizations


async def get_admin_inventory(
    *,
    expiry_status: str | None = None,
) -> list[dict]:
    database = get_database()

    query = {}

    if expiry_status:
        query["expiry_status"] = expiry_status.upper()

    cursor = database.inventory_items.find(query).sort(
        "created_at",
        -1,
    )

    inventory_items = []

    async for item in cursor:
        inventory_items.append(
            serialize_document(item)
        )

    return inventory_items


async def get_admin_donations(
    *,
    donation_status: str | None = None,
) -> list[dict]:
    database = get_database()

    query = {}

    if donation_status:
        query["status"] = donation_status.upper()

    cursor = database.donations.find(query).sort(
        "created_at",
        -1,
    )

    donations = []

    async for donation in cursor:
        donations.append(
            serialize_document(donation)
        )

    return donations


async def approve_user(user_id: str) -> dict:
    database = get_database()

    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID",
        )

    user = await database.users.find_one(
        {
            "_id": ObjectId(user_id),
        }
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.get("role") not in {
        "DONOR",
        "NGO",
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only DONOR and NGO accounts require approval",
        )

    now = datetime.now(timezone.utc)

    await database.users.update_one(
        {
            "_id": ObjectId(user_id),
        },
        {
            "$set": {
                "approval_status": "APPROVED",
                "is_active": True,
                "approved_at": now,
                "updated_at": now,
            }
        },
    )

    updated_user = await database.users.find_one(
        {
            "_id": ObjectId(user_id),
        }
    )

    return serialize_document(updated_user)


async def reject_user(user_id: str) -> dict:
    database = get_database()

    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID",
        )

    user = await database.users.find_one(
        {
            "_id": ObjectId(user_id),
        }
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.get("role") not in {
        "DONOR",
        "NGO",
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only DONOR and NGO accounts can be rejected",
        )

    now = datetime.now(timezone.utc)

    await database.users.update_one(
        {
            "_id": ObjectId(user_id),
        },
        {
            "$set": {
                "approval_status": "REJECTED",
                "is_active": False,
                "rejected_at": now,
                "updated_at": now,
            }
        },
    )

    updated_user = await database.users.find_one(
        {
            "_id": ObjectId(user_id),
        }
    )

    return serialize_document(updated_user)