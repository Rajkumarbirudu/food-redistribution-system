from datetime import datetime, timezone

from bson import ObjectId

from fastapi import HTTPException, status

from pymongo import ReturnDocument

from app.database import get_database


# ============================================================
# HELPERS
# ============================================================

def utc_now() -> datetime:
    return datetime.now(
        timezone.utc
    )


def normalize_role(
    value,
) -> str:
    if hasattr(
        value,
        "value",
    ):
        value = value.value

    value = str(
        value or ""
    ).strip().upper()

    if value.startswith(
        "USERROLE."
    ):
        value = value.split(
            ".",
            1,
        )[1]

    return value


def object_id_or_none(
    value,
):
    if isinstance(
        value,
        ObjectId,
    ):
        return value

    if (
        value
        and ObjectId.is_valid(
            str(value)
        )
    ):
        return ObjectId(
            str(value)
        )

    return None


def require_object_id(
    value,
    field_name: str,
) -> ObjectId:
    result = object_id_or_none(
        value
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name}",
        )

    return result


def get_current_user_id(
    current_user: dict,
) -> ObjectId:
    value = (
        current_user.get("_id")
        or current_user.get("id")
        or current_user.get("user_id")
    )

    result = object_id_or_none(
        value
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current user ID is invalid",
        )

    return result


def get_current_tenant_id(
    current_user: dict,
) -> ObjectId:
    result = object_id_or_none(
        current_user.get(
            "tenant_id"
        )
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Current user does not belong "
                "to a valid tenant"
            ),
        )

    return result


def serialize_value(
    value,
):
    if isinstance(
        value,
        ObjectId,
    ):
        return str(value)

    if isinstance(
        value,
        datetime,
    ):
        return value.isoformat()

    if isinstance(
        value,
        list,
    ):
        return [
            serialize_value(item)
            for item in value
        ]

    if isinstance(
        value,
        dict,
    ):
        return {
            key: serialize_value(item)
            for key, item in value.items()
        }

    return value


def serialize_donation(
    document: dict,
) -> dict:
    result = {}

    for key, value in document.items():
        if key == "_id":
            result["id"] = str(
                value
            )
        else:
            result[key] = (
                serialize_value(
                    value
                )
            )

    return result


async def find_inventory_collection(
    database,
):
    collection_names = (
        await database.list_collection_names()
    )

    if (
        "inventory_items"
        in collection_names
    ):
        return database[
            "inventory_items"
        ]

    return database[
        "inventory"
    ]


async def get_donation_or_404(
    donation_id: str,
):
    donation_object_id = (
        require_object_id(
            donation_id,
            "donation ID",
        )
    )

    database = get_database()

    donation = (
        await database.donations.find_one(
            {
                "_id":
                    donation_object_id,
            }
        )
    )

    if donation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found",
        )

    return donation


# ============================================================
# CREATE DONATION
# ============================================================

async def create_donation(
    donation_data,
    current_user: dict | None = None,
):
    database = get_database()

    inventory_collection = (
        await find_inventory_collection(
            database
        )
    )

    if hasattr(
        donation_data,
        "model_dump",
    ):
        payload = (
            donation_data.model_dump()
        )
    else:
        payload = dict(
            donation_data
        )

    if current_user is None:
        current_user = payload.pop(
            "current_user",
            None,
        )

    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current user is missing",
        )

    if (
        normalize_role(
            current_user.get(
                "role"
            )
        )
        != "DONOR"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only donor accounts can "
                "create donations"
            ),
        )

    inventory_id = (
        require_object_id(
            payload.get(
                "inventory_id"
            ),
            "inventory ID",
        )
    )

    tenant_id = (
        get_current_tenant_id(
            current_user
        )
    )

    donor_id = (
        get_current_user_id(
            current_user
        )
    )

    quantity = float(
        payload.get(
            "quantity",
            0,
        )
    )

    if quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Donation quantity must "
                "be greater than zero"
            ),
        )

    inventory = (
        await inventory_collection.find_one(
            {
                "_id": inventory_id,
                "tenant_id": tenant_id,
            }
        )
    )

    if inventory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found",
        )

    available_quantity = float(
        inventory.get(
            "quantity",
            0,
        )
    )

    if quantity > available_quantity:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Donation quantity exceeds "
                "available inventory quantity"
            ),
        )

    now = utc_now()

    updated_inventory = (
        await inventory_collection.find_one_and_update(
            {
                "_id": inventory_id,
                "tenant_id": tenant_id,
                "quantity": {
                    "$gte": quantity,
                },
            },
            {
                "$inc": {
                    "quantity":
                        -quantity,
                },
                "$set": {
                    "updated_at":
                        now,
                },
            },
            return_document=(
                ReturnDocument.AFTER
            ),
        )
    )

    if updated_inventory is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Inventory quantity changed. "
                "Please refresh and try again."
            ),
        )

    donation_document = {
        "inventory_id":
            inventory_id,

        "tenant_id":
            tenant_id,

        "donor_id":
            donor_id,

        "ngo_id":
            None,

        "food_name":
            inventory.get(
                "food_name",
                inventory.get(
                    "name",
                    "Food Item",
                ),
            ),

        "category_id":
            inventory.get(
                "category_id"
            ),

        "category_name":
            inventory.get(
                "category_name",
                "",
            ),

        "quantity":
            quantity,

        "unit":
            inventory.get(
                "unit",
                "",
            ),

        "pickup_address":
            inventory.get(
                "pickup_address",
                "",
            ),

        "pickup_time":
            inventory.get(
                "pickup_time",
                "",
            ),

        "contact_person":
            inventory.get(
                "contact_person",
                "",
            ),

        "phone_number":
            inventory.get(
                "phone_number",
                "",
            ),

        "expiry_date":
            inventory.get(
                "expiry_date"
            ),

        "pickup_deadline":
            payload.get(
                "pickup_deadline"
            ),

        "notes":
            payload.get(
                "notes"
            ),

        "status":
            "AVAILABLE",

        "pickup_date":
            None,

        "scheduled_pickup_time":
            None,

        "vehicle_number":
            None,

        "driver_name":
            None,

        "volunteer_name":
            None,

        "special_instructions":
            None,

        "accepted_at":
            None,

        "pickup_scheduled_at":
            None,

        "picked_up_at":
            None,

        "completed_at":
            None,

        "cancelled_at":
            None,

        "created_at":
            now,

        "updated_at":
            now,
    }

    try:
        result = (
            await database.donations.insert_one(
                donation_document
            )
        )

    except Exception:
        await inventory_collection.update_one(
            {
                "_id":
                    inventory_id,
            },
            {
                "$inc": {
                    "quantity":
                        quantity,
                },
                "$set": {
                    "updated_at":
                        utc_now(),
                },
            },
        )

        raise

    created = (
        await database.donations.find_one(
            {
                "_id":
                    result.inserted_id,
            }
        )
    )

    return serialize_donation(
        created
    )


# ============================================================
# LIST DONATIONS
# ============================================================

async def list_donations(
    current_user: dict,
) -> list[dict]:
    database = get_database()

    role = normalize_role(
        current_user.get(
            "role"
        )
    )

    query = {}

    if role == "DONOR":
        query = {
            "tenant_id":
                get_current_tenant_id(
                    current_user
                )
        }

    elif role == "NGO":
        ngo_id = (
            get_current_user_id(
                current_user
            )
        )

        query = {
            "$or": [
                {
                    "status": {
                        "$in": [
                            "AVAILABLE",
                            "PENDING",
                        ]
                    }
                },
                {
                    "ngo_id":
                        ngo_id,
                },
            ]
        }

    elif role == "ADMIN":
        query = {}

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unsupported user role",
        )

    cursor = (
        database.donations
        .find(query)
        .sort(
            "created_at",
            -1,
        )
    )

    result = []

    async for document in cursor:
        result.append(
            serialize_donation(
                document
            )
        )

    return result


# ============================================================
# GET DONATION
# ============================================================

async def get_donation(
    donation_id: str,
    current_user: dict,
) -> dict:
    donation = (
        await get_donation_or_404(
            donation_id
        )
    )

    role = normalize_role(
        current_user.get(
            "role"
        )
    )

    if role == "ADMIN":
        return serialize_donation(
            donation
        )

    if role == "DONOR":
        if str(
            donation.get(
                "tenant_id"
            )
        ) != str(
            get_current_tenant_id(
                current_user
            )
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You cannot access "
                    "this donation"
                ),
            )

        return serialize_donation(
            donation
        )

    if role == "NGO":
        ngo_id = (
            get_current_user_id(
                current_user
            )
        )

        donation_status = (
            normalize_role(
                donation.get(
                    "status"
                )
            )
        )

        if (
            donation_status
            not in {
                "AVAILABLE",
                "PENDING",
            }
            and str(
                donation.get(
                    "ngo_id"
                )
            )
            != str(
                ngo_id
            )
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You cannot access "
                    "this donation"
                ),
            )

        return serialize_donation(
            donation
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Unsupported user role",
    )


# ============================================================
# ACCEPT DONATION
# ============================================================

async def accept_donation(
    donation_id: str,
    current_user: dict,
) -> dict:
    database = get_database()

    ngo_id = (
        get_current_user_id(
            current_user
        )
    )

    donation_object_id = (
        require_object_id(
            donation_id,
            "donation ID",
        )
    )

    now = utc_now()

    updated = (
        await database.donations.find_one_and_update(
            {
                "_id":
                    donation_object_id,

                "status": {
                    "$in": [
                        "AVAILABLE",
                        "PENDING",
                    ]
                },

                "$or": [
                    {
                        "ngo_id":
                            None,
                    },
                    {
                        "ngo_id": {
                            "$exists":
                                False,
                        }
                    },
                ],
            },
            {
                "$set": {
                    "ngo_id":
                        ngo_id,

                    "status":
                        "ACCEPTED",

                    "accepted_at":
                        now,

                    "updated_at":
                        now,
                }
            },
            return_document=(
                ReturnDocument.AFTER
            ),
        )
    )

    if updated is None:
        existing = (
            await database.donations.find_one(
                {
                    "_id":
                        donation_object_id,
                }
            )
        )

        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Donation not found",
            )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Donation is no longer available"
            ),
        )

    return serialize_donation(
        updated
    )


# ============================================================
# SCHEDULE PICKUP
# ============================================================

async def schedule_pickup(
    donation_id: str,
    pickup_data,
    current_user: dict,
) -> dict:
    database = get_database()

    ngo_id = (
        get_current_user_id(
            current_user
        )
    )

    donation_object_id = (
        require_object_id(
            donation_id,
            "donation ID",
        )
    )

    if hasattr(
        pickup_data,
        "model_dump",
    ):
        payload = (
            pickup_data.model_dump()
        )
    else:
        payload = dict(
            pickup_data
        )

    now = utc_now()

    updated = (
        await database.donations.find_one_and_update(
            {
                "_id":
                    donation_object_id,

                "ngo_id":
                    ngo_id,

                "status": {
                    "$in": [
                        "ACCEPTED",
                        "PICKUP_SCHEDULED",
                    ]
                },
            },
            {
                "$set": {
                    "pickup_date":
                        payload.get(
                            "pickup_date"
                        ),

                    "scheduled_pickup_time":
                        payload.get(
                            "pickup_time"
                        ),

                    "vehicle_number":
                        payload.get(
                            "vehicle_number"
                        ),

                    "driver_name":
                        payload.get(
                            "driver_name"
                        ),

                    "volunteer_name":
                        payload.get(
                            "volunteer_name"
                        ),

                    "special_instructions":
                        payload.get(
                            "special_instructions"
                        ),

                    "status":
                        "PICKUP_SCHEDULED",

                    "pickup_scheduled_at":
                        now,

                    "updated_at":
                        now,
                }
            },
            return_document=(
                ReturnDocument.AFTER
            ),
        )
    )

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Donation cannot be scheduled "
                "for pickup"
            ),
        )

    return serialize_donation(
        updated
    )


# ============================================================
# CONFIRM PICKUP
# ============================================================

async def confirm_pickup(
    donation_id: str,
    current_user: dict,
) -> dict:
    database = get_database()

    ngo_id = (
        get_current_user_id(
            current_user
        )
    )

    now = utc_now()

    updated = (
        await database.donations.find_one_and_update(
            {
                "_id":
                    require_object_id(
                        donation_id,
                        "donation ID",
                    ),

                "ngo_id":
                    ngo_id,

                "status":
                    "PICKUP_SCHEDULED",
            },
            {
                "$set": {
                    "status":
                        "PICKED_UP",

                    "picked_up_at":
                        now,

                    "updated_at":
                        now,
                }
            },
            return_document=(
                ReturnDocument.AFTER
            ),
        )
    )

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Donation cannot be "
                "confirmed as picked up"
            ),
        )

    return serialize_donation(
        updated
    )


# ============================================================
# COMPLETE DONATION
# ============================================================

async def complete_donation(
    donation_id: str,
    current_user: dict,
) -> dict:
    database = get_database()

    ngo_id = (
        get_current_user_id(
            current_user
        )
    )

    now = utc_now()

    updated = (
        await database.donations.find_one_and_update(
            {
                "_id":
                    require_object_id(
                        donation_id,
                        "donation ID",
                    ),

                "ngo_id":
                    ngo_id,

                "status":
                    "PICKED_UP",
            },
            {
                "$set": {
                    "status":
                        "COMPLETED",

                    "completed_at":
                        now,

                    "updated_at":
                        now,
                }
            },
            return_document=(
                ReturnDocument.AFTER
            ),
        )
    )

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Donation cannot be completed"
            ),
        )

    return serialize_donation(
        updated
    )


# ============================================================
# CANCEL NGO PICKUP
# ============================================================

async def cancel_ngo_pickup(
    donation_id: str,
    current_user: dict,
) -> dict:
    database = get_database()

    ngo_id = (
        get_current_user_id(
            current_user
        )
    )

    now = utc_now()

    updated = (
        await database.donations.find_one_and_update(
            {
                "_id":
                    require_object_id(
                        donation_id,
                        "donation ID",
                    ),

                "ngo_id":
                    ngo_id,

                "status": {
                    "$in": [
                        "ACCEPTED",
                        "PICKUP_SCHEDULED",
                    ]
                },
            },
            {
                "$set": {
                    "ngo_id":
                        None,

                    "status":
                        "AVAILABLE",

                    "pickup_date":
                        None,

                    "scheduled_pickup_time":
                        None,

                    "vehicle_number":
                        None,

                    "driver_name":
                        None,

                    "volunteer_name":
                        None,

                    "special_instructions":
                        None,

                    "accepted_at":
                        None,

                    "pickup_scheduled_at":
                        None,

                    "cancelled_at":
                        now,

                    "updated_at":
                        now,
                }
            },
            return_document=(
                ReturnDocument.AFTER
            ),
        )
    )

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Pickup cannot be cancelled"
            ),
        )

    return serialize_donation(
        updated
    )