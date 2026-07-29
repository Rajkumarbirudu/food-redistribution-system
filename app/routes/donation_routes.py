from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import ReturnDocument
from datetime import datetime, timezone, timedelta
from app.database import get_database
from app.core.dependencies import get_current_user, require_roles
from app.models.enums import UserRole
from app.schemas.donation_schema import (
    DonationCancelResponse,
    DonationCreate,
    DonationResponse,
    PickupScheduleRequest,
)


router = APIRouter(
    prefix="/donations",
    tags=["Donations"],
)


# ============================================================
# HELPERS
# ============================================================

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def normalize_role(value) -> str:
    if hasattr(value, "value"):
        value = value.value

    return str(value or "").strip().upper()


def normalize_status(value) -> str:
    return str(value or "").strip().upper()


def get_user_id(user: dict):
    return user.get("_id") or user.get("id")


def get_tenant_id(user: dict):
    return (
        user.get("tenant_id")
        or user.get("organization_id")
    )


def build_id_values(value) -> list:
    values = []

    if value is None:
        return values

    original_value = value
    string_value = str(value)

    values.append(original_value)

    if string_value not in values:
        values.append(string_value)

    if ObjectId.is_valid(string_value):
        mongo_id = ObjectId(string_value)

        if mongo_id not in values:
            values.append(mongo_id)

    return values


def build_status_values(*statuses) -> list:
    values = []

    for status_value in statuses:
        upper_value = str(status_value).upper()
        lower_value = str(status_value).lower()

        if upper_value not in values:
            values.append(upper_value)

        if lower_value not in values:
            values.append(lower_value)

    return values


def serialize_donation(document: dict) -> dict:
    return {
        "id": str(
            document.get("_id", "")
        ),

        "inventory_id": str(
            document.get("inventory_id", "")
        ),

        "tenant_id": str(
            document.get(
                "tenant_id",
                document.get(
                    "organization_id",
                    ""
                ),
            )
        ),

        "donor_id": (
            str(document.get("donor_id"))
            if document.get("donor_id")
            is not None
            else None
        ),

        "ngo_id": (
            str(document.get("ngo_id"))
            if document.get("ngo_id") is not None
            else (
                str(document.get("claimed_by_ngo_id"))
                if document.get("claimed_by_ngo_id") is not None
                else None
            )
        ),

        "pickup_date": document.get("pickup_date"),
        "scheduled_pickup_time": document.get("scheduled_pickup_time"),
        "vehicle_number": document.get("vehicle_number"),
        "driver_name": document.get("driver_name"),
        "volunteer_name": document.get("volunteer_name"),
        "special_instructions": document.get("special_instructions"),

        "accepted_at": document.get("accepted_at"),
        "pickup_scheduled_at": document.get("pickup_scheduled_at"),
        "picked_up_at": document.get("picked_up_at"),
        "completed_at": document.get("completed_at"),
        "cancelled_at": document.get("cancelled_at"),

        "food_name": (
            document.get("food_name")
            or document.get("name")
            or document.get("food")
            or "Food Donation"
        ),

        "category_id": str(
            document.get("category_id", "")
        ),

        "category_name": (
            document.get("category_name")
            or document.get("food_category")
            or document.get("category")
            or ""
        ),

        "quantity": float(
            document.get("quantity", 0)
        ),

        "unit": document.get("unit", ""),

        "pickup_address": (
            document.get("pickup_address")
            or document.get("address")
            or ""
        ),

        "pickup_time": (
            document.get("pickup_time")
            or ""
        ),

        "contact_person": (
            document.get("contact_person")
            or document.get("full_name")
            or ""
        ),

        "phone_number": (
            document.get("phone_number")
            or document.get("phone")
            or ""
        ),

        "expiry_date": document.get(
            "expiry_date"
        ),

        "pickup_deadline": (
            document.get("pickup_deadline")
            or document.get("pickup_date")
            or document.get("expiry_date")
        ),

        "notes": (
            document.get("notes")
            or document.get(
                "special_instructions"
            )
        ),

        "status": normalize_status(
            document.get(
                "status",
                "AVAILABLE",
            )
        ),

        "delivery_partner_id": (
            str(document.get("delivery_partner_id"))
            if document.get("delivery_partner_id") is not None
            else None
        ),

        "delivery_boy_id": (
            str(document.get("delivery_boy_id"))
            if document.get("delivery_boy_id") is not None
            else None
        ),

        "delivery_boy_name": document.get("delivery_boy_name"),

        "current_location": document.get("current_location"),

        "historical_path": document.get("historical_path"),

        "created_at": (
            document.get("created_at")
            or document.get("updated_at")
            or utc_now()
        ),

        "updated_at": (
            document.get("updated_at")
            or document.get("created_at")
            or utc_now()
        ),
    }


async def find_inventory(
    database,
    inventory_id,
):
    id_values = build_id_values(
        inventory_id
    )

    print()
    print("=" * 70)
    print("FIND INVENTORY FOR DONATION")
    print("RECEIVED INVENTORY ID:", inventory_id)
    print("SEARCH VALUES:", id_values)
    print("=" * 70)

    return await (
        database
        .inventory
        .find_one(
            {
                "_id": {
                    "$in": id_values
                }
            }
        )
    )


async def find_donation(
    database,
    donation_id,
):
    return await (
        database
        .donations
        .find_one(
            {
                "_id": {
                    "$in":
                        build_id_values(
                            donation_id
                        )
                }
            }
        )
    )


# ============================================================
# CREATE DONATION
#
# POST /donations
#
# DONOR ONLY
# ============================================================

@router.post(
    "",
    response_model=DonationResponse,
    status_code=status.HTTP_201_CREATED,
)
@router.post(
    "/",
    response_model=DonationResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
async def create_donation(
    payload: DonationCreate,

    current_user: dict = Depends(
        require_roles(
            UserRole.DONOR,
            UserRole.INDIVIDUAL_DONOR,
            UserRole.ADMIN,
        )
    ),
):
    database = get_database()

    print()
    print("=" * 70)
    print("CREATE DONATION")
    print("USER:", get_user_id(current_user))
    print("ROLE:", current_user.get("role"))
    print("TENANT:", get_tenant_id(current_user))
    print("PAYLOAD:", payload.model_dump())
    print("=" * 70)


    # ========================================================
    # FIND INVENTORY
    # ========================================================

    inventory = await find_inventory(
        database,
        payload.inventory_id,
    )

    if inventory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Inventory item not found. "
                f"Received inventory_id: "
                f"{payload.inventory_id}"
            ),
        )


    # ========================================================
    # VERIFY DONOR OWNS INVENTORY
    # ========================================================

    user_tenant_id = get_tenant_id(
        current_user
    )

    inventory_tenant_id = (
        inventory.get("tenant_id")
        or inventory.get(
            "organization_id"
        )
    )

    if (
        str(user_tenant_id)
        != str(inventory_tenant_id)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You can donate only inventory "
                "belonging to your organization"
            ),
        )


    # ========================================================
    # QUANTITY VALIDATION
    # ========================================================

    available_quantity = float(
        inventory.get("quantity", 0)
    )

    donation_quantity = float(
        payload.quantity
    )

    if available_quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Inventory item has "
                "no available quantity"
            ),
        )

    if donation_quantity > available_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Donation quantity cannot exceed "
                f"available quantity "
                f"({available_quantity})"
            ),
        )


    # ========================================================
    # EXPIRY VALIDATION
    # ========================================================

    expiry_status = normalize_status(
        inventory.get("expiry_status")
    )

    if expiry_status == "EXPIRED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expired food cannot be donated",
        )

    expiry_date = inventory.get(
        "expiry_date"
    )

    if expiry_date is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Inventory item does not "
                "have an expiry date"
            ),
        )


    # ========================================================
    # PICKUP DEADLINE
    # ========================================================

    now = utc_now()

    pickup_deadline = (
        payload.pickup_deadline
    )

    if pickup_deadline.tzinfo is None:
        pickup_deadline = (
            pickup_deadline.replace(
                tzinfo=timezone.utc
            )
        )

    if pickup_deadline <= now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Pickup deadline "
                "must be in the future"
            ),
        )


    # ========================================================
    # CREATE DOCUMENT
    # ========================================================

    donation_document = {
        "inventory_id":
            inventory["_id"],

        "tenant_id":
            inventory_tenant_id,

        "organization_id":
            inventory_tenant_id,

        "donor_id":
            get_user_id(current_user),

        "food_name":
            (
                inventory.get("food_name")
                or inventory.get("name")
                or "Food Item"
            ),

        "category_id":
            inventory.get(
                "category_id",
                "",
            ),

        "category_name":
            (
                inventory.get(
                    "category_name"
                )
                or inventory.get(
                    "food_category"
                )
                or ""
            ),

        "quantity":
            donation_quantity,

        "unit":
            inventory.get("unit", ""),

        "pickup_address":
            (
                inventory.get(
                    "pickup_address"
                )
                or current_user.get(
                    "address"
                )
                or ""
            ),

        "pickup_time":
            inventory.get(
                "pickup_time",
                "",
            ),

        "contact_person":
            (
                inventory.get(
                    "contact_person"
                )
                or current_user.get(
                    "full_name"
                )
                or ""
            ),

        "phone_number":
            (
                inventory.get(
                    "phone_number"
                )
                or inventory.get("phone")
                or current_user.get(
                    "phone_number"
                )
                or current_user.get("phone")
                or ""
            ),

        "expiry_date":
            expiry_date,

        "pickup_deadline":
            pickup_deadline,

        "notes":
            payload.notes,

        "status":
            "AVAILABLE",

        "claimed_by":
            None,

        "ngo_id":
            None,

        "claimed_by_ngo_id":
            None,

        "assigned_ngo_id":
            None,

        "claimed_at":
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


    result = await (
        database
        .donations
        .insert_one(
            donation_document
        )
    )


    created_donation = await (
        database
        .donations
        .find_one(
            {
                "_id":
                    result.inserted_id
            }
        )
    )


    if created_donation is None:
        raise HTTPException(
            status_code=500,
            detail=(
                "Donation created but "
                "could not be loaded"
            ),
        )


    print(
        "DONATION CREATED:",
        result.inserted_id
    )


    return serialize_donation(
        created_donation
    )


# ============================================================
# LIST DONATIONS
#
# GET /donations
#
# ADMIN:
#   ALL DONATIONS
#
# DONOR:
#   DONATIONS BELONGING TO DONOR ORGANIZATION
#
# NGO:
#   AVAILABLE/OPEN/PENDING DONATIONS
#   +
#   DONATIONS CLAIMED/ASSIGNED TO CURRENT NGO
# ============================================================

@router.get(
    "",
    response_model=list[DonationResponse],
)
@router.get(
    "/",
    response_model=list[DonationResponse],
    include_in_schema=False,
)
async def list_donations(
    current_user: dict = Depends(
        get_current_user
    ),
):
    database = get_database()

    role = normalize_role(
        current_user.get("role")
    )

    user_id = get_user_id(
        current_user
    )

    tenant_id = get_tenant_id(
        current_user
    )


    print()
    print("=" * 70)
    print("LIST DONATIONS")
    print("ROLE:", role)
    print("USER ID:", user_id)
    print("TENANT ID:", tenant_id)
    print("=" * 70)


    # ========================================================
    # ADMIN
    # ========================================================

    if role == UserRole.ADMIN.value:
        query = {}


    # ========================================================
    # DONOR
    # ========================================================

    elif role in [UserRole.DONOR.value, UserRole.INDIVIDUAL_DONOR.value]:
        tenant_values = build_id_values(
            tenant_id
        )

        donor_values = build_id_values(
            user_id
        )

        query = {
            "$or": [
                {
                    "tenant_id": {
                        "$in":
                            tenant_values
                    }
                },

                {
                    "organization_id": {
                        "$in":
                            tenant_values
                    }
                },

                {
                    "donor_tenant_id": {
                        "$in":
                            tenant_values
                    }
                },

                {
                    "donor_id": {
                        "$in":
                            donor_values
                    }
                },
            ]
        }


    # ========================================================
    # NGO
    # ========================================================

    elif role == UserRole.NGO.value:
        ngo_values = build_id_values(
            user_id
        )

        visible_statuses = (
            build_status_values(
                "AVAILABLE",
                "OPEN",
                "PENDING",
            )
        )

        query = {
            "$or": [
                {
                    "status": {
                        "$in":
                            visible_statuses
                    }
                },

                {
                    "claimed_by": {
                        "$in":
                            ngo_values
                    }
                },

                {
                    "ngo_id": {
                        "$in":
                            ngo_values
                    }
                },

                {
                    "claimed_by_ngo_id": {
                        "$in":
                            ngo_values
                    }
                },

                {
                    "assigned_ngo_id": {
                        "$in":
                            ngo_values
                    }
                },
            ]
        }


    elif role in ["DELIVERY_PARTNER", "DELIVERY_BOY"]:
        courier_values = build_id_values(user_id)
        query = {
            "$or": [
                {"delivery_boy_id": {"$in": courier_values}},
                {"delivery_partner_id": {"$in": courier_values}}
            ]
        }


    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You do not have permission "
                "to access this resource"
            ),
        )


    print(
        "DONATION QUERY:",
        query
    )


    documents = await (
        database
        .donations
        .find(query)
        .sort(
            "created_at",
            -1,
        )
        .to_list(
            length=1000
        )
    )


    print(
        "DONATIONS FOUND:",
        len(documents)
    )


    return [
        serialize_donation(document)
        for document in documents
    ]


from typing import List

@router.get(
    "/pending-delivery",
    response_model=List[dict],
    status_code=status.HTTP_200_OK,
)
async def get_pending_deliveries(
    current_user: dict = Depends(get_current_user),
):
    database = get_database()
    if current_user.get("role") not in ["DELIVERY_PARTNER", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to Delivery Partners.",
        )

    cursor = database.donations.find({
        "status": "CLAIMED",
        "delivery_partner_id": None
    }).sort("created_at", -1)
    donations = await cursor.to_list(length=100)
    return [serialize_donation(d) for d in donations]


# ============================================================
# GET SINGLE DONATION
#
# GET /donations/{donation_id}
# ============================================================

@router.get(
    "/{donation_id}",
    response_model=DonationResponse,
)
async def get_donation(
    donation_id: str,

    current_user: dict = Depends(
        get_current_user
    ),
):
    database = get_database()

    donation = await find_donation(
        database,
        donation_id,
    )

    if donation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found",
        )


    role = normalize_role(
        current_user.get("role")
    )

    current_user_id = get_user_id(
        current_user
    )

    current_tenant_id = get_tenant_id(
        current_user
    )


    if role == UserRole.ADMIN.value:
        return serialize_donation(
            donation
        )


    if role == UserRole.DONOR.value:
        donation_tenant_id = (
            donation.get("tenant_id")
            or donation.get(
                "organization_id"
            )
        )

        if (
            str(donation_tenant_id)
            != str(current_tenant_id)
            and
            str(donation.get("donor_id"))
            != str(current_user_id)
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


    if role == UserRole.NGO.value:
        donation_status = normalize_status(
            donation.get("status")
        )

        public_statuses = {
            "AVAILABLE",
            "OPEN",
            "PENDING",
        }

        ngo_fields = [
            donation.get("claimed_by"),
            donation.get("ngo_id"),
            donation.get(
                "claimed_by_ngo_id"
            ),
            donation.get(
                "assigned_ngo_id"
            ),
        ]

        belongs_to_ngo = any(
            str(value)
            == str(current_user_id)
            for value in ngo_fields
            if value is not None
        )

        if (
            donation_status
            in public_statuses
            or belongs_to_ngo
        ):
            return serialize_donation(
                donation
            )


    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=(
            "You cannot access "
            "this donation"
        ),
    )


# ============================================================
# CLAIM DONATION
#
# POST /donations/{donation_id}/claim
#
# NGO ONLY
# ============================================================

@router.post(
    "/{donation_id}/claim",
    response_model=DonationResponse,
)
async def claim_donation(
    donation_id: str,
    payload: PickupScheduleRequest,

    current_user: dict = Depends(
        require_roles(
            UserRole.NGO
        )
    ),
):
    database = get_database()

    ngo_id = get_user_id(
        current_user
    )

    now = utc_now()

    pickup_date_normalized = payload.pickup_date
    if pickup_date_normalized.tzinfo is None:
        pickup_date_normalized = pickup_date_normalized.replace(tzinfo=timezone.utc)

    donation = await (
        database
        .donations
        .find_one_and_update(
            {
                "_id": {
                    "$in":
                        build_id_values(
                            donation_id
                        )
                },

                "status": {
                    "$in":
                        build_status_values(
                            "AVAILABLE",
                            "OPEN",
                            "PENDING",
                        )
                },
            },

            {
                "$set": {
                    "status":
                        "CLAIMED",

                    "claimed_by":
                        ngo_id,

                    "ngo_id":
                        ngo_id,

                    "claimed_by_ngo_id":
                        ngo_id,

                    "assigned_ngo_id":
                        ngo_id,

                    "claimed_at":
                        now,

                    "pickup_date":
                        pickup_date_normalized,

                    "scheduled_pickup_time":
                        payload.pickup_time,

                    "vehicle_number":
                        payload.vehicle_number,

                    "driver_name":
                        payload.driver_name,

                    "volunteer_name":
                        payload.volunteer_name,

                    "special_instructions":
                        payload.special_instructions,

                    "pickup_scheduled_at":
                        now,

                    "updated_at":
                        now,
                }
            },

            return_document=
                ReturnDocument.AFTER,
        )
    )


    if donation is None:
        existing = await find_donation(
            database,
            donation_id,
        )

        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Donation not found",
            )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Donation is no "
                "longer available"
            ),
        )

    inventory_id = donation.get("inventory_id")
    donation_qty = donation.get("quantity", 0)

    if inventory_id:
        inventory_id_values = build_id_values(inventory_id)
        inv_item = await database.inventory.find_one({"_id": {"$in": inventory_id_values}})
        if inv_item:
            current_qty = inv_item.get("quantity", 0)
            new_qty = current_qty - donation_qty
            if new_qty <= 0:
                await database.inventory.delete_one({"_id": inv_item["_id"]})
            else:
                await database.inventory.update_one(
                    {"_id": inv_item["_id"]},
                    {"$set": {"quantity": new_qty, "updated_at": now}}
                )

    return serialize_donation(
        donation
    )


# ============================================================
# COMPLETE DONATION
#
# POST /donations/{donation_id}/complete
#
# NGO ONLY
# ============================================================

@router.post(
    "/{donation_id}/complete",
    response_model=DonationResponse,
)
async def complete_donation(
    donation_id: str,

    current_user: dict = Depends(
        require_roles(
            UserRole.NGO
        )
    ),
):
    database = get_database()

    ngo_id = get_user_id(
        current_user
    )

    ngo_values = build_id_values(
        ngo_id
    )

    now = utc_now()


    donation = await (
        database
        .donations
        .find_one_and_update(
            {
                "_id": {
                    "$in":
                        build_id_values(
                            donation_id
                        )
                },

                "status": {
                    "$in":
                        build_status_values(
                            "CLAIMED"
                        )
                },

                "$or": [
                    {
                        "claimed_by": {
                            "$in":
                                ngo_values
                        }
                    },

                    {
                        "ngo_id": {
                            "$in":
                                ngo_values
                        }
                    },

                    {
                        "claimed_by_ngo_id": {
                            "$in":
                                ngo_values
                        }
                    },

                    {
                        "assigned_ngo_id": {
                            "$in":
                                ngo_values
                        }
                    },
                ],
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

            return_document=
                ReturnDocument.AFTER,
        )
    )


    if donation is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Only a donation claimed "
                "by this NGO can be completed"
            ),
        )


    return serialize_donation(
        donation
    )


# ============================================================
# CANCEL DONATION
#
# POST /donations/{donation_id}/cancel
#
# DONOR ONLY
# ============================================================

@router.post(
    "/{donation_id}/cancel",
    response_model=DonationCancelResponse,
)
async def cancel_donation(
    donation_id: str,

    current_user: dict = Depends(
        require_roles(
            UserRole.DONOR
        )
    ),
):
    database = get_database()

    tenant_id = get_tenant_id(
        current_user
    )

    donor_id = get_user_id(
        current_user
    )

    tenant_values = build_id_values(
        tenant_id
    )

    donor_values = build_id_values(
        donor_id
    )

    now = utc_now()


    donation = await (
        database
        .donations
        .find_one_and_update(
            {
                "_id": {
                    "$in":
                        build_id_values(
                            donation_id
                        )
                },

                "status": {
                    "$in":
                        build_status_values(
                            "AVAILABLE",
                            "OPEN",
                            "PENDING",
                        )
                },

                "$or": [
                    {
                        "tenant_id": {
                            "$in":
                                tenant_values
                        }
                    },

                    {
                        "organization_id": {
                            "$in":
                                tenant_values
                        }
                    },

                    {
                        "donor_id": {
                            "$in":
                                donor_values
                        }
                    },
                ],
            },

            {
                "$set": {
                    "status":
                        "CANCELLED",

                    "cancelled_at":
                        now,

                    "updated_at":
                        now,
                }
            },

            return_document=
                ReturnDocument.AFTER,
        )
    )


    if donation is None:
        existing = await find_donation(
            database,
            donation_id,
        )

        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Donation not found",
            )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Only an available donation "
                "owned by this donor can "
                "be cancelled"
            ),
        )


    return {
        "message":
            "Donation cancelled successfully",

        "donation":
            serialize_donation(
                donation
            ),
    }


# ============================================================
# DELIVERY ENDPOINTS
# ============================================================

from typing import List
from pydantic import BaseModel

class AssignDeliveryRequest(BaseModel):
    delivery_boy_id: str
    vehicle_number: str

class UpdateLocationRequest(BaseModel):
    lat: float
    lng: float


# pending-delivery route relocated above get_donation


@router.post(
    "/{donation_id}/assign-delivery",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def assign_delivery(
    donation_id: str,
    payload: AssignDeliveryRequest,
    current_user: dict = Depends(get_current_user),
):
    database = get_database()
    if current_user.get("role") not in ["DELIVERY_PARTNER", "DELIVERY_BOY", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to Delivery Partners and Couriers.",
        )

    try:
        donation_id_obj = ObjectId(donation_id)
        dboy_id_obj = ObjectId(payload.delivery_boy_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format.",
        )

    dboy = await database.users.find_one({"_id": dboy_id_obj, "role": {"$in": ["DELIVERY_PARTNER", "DELIVERY_BOY"]}})
    if not dboy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Courier not found or inactive.",
        )

    now = datetime.now(timezone.utc)
    donation = await database.donations.find_one_and_update(
        {"_id": donation_id_obj, "status": "CLAIMED"},
        {
            "$set": {
                "status": "ASSIGNED",
                "delivery_partner_id": current_user["_id"] if current_user.get("role") == "DELIVERY_PARTNER" else dboy.get("tenant_id"),
                "delivery_boy_id": dboy_id_obj,
                "delivery_boy_name": dboy.get("full_name", ""),
                "vehicle_number": payload.vehicle_number,
                "updated_at": now
            }
        },
        return_document=ReturnDocument.AFTER
    )

    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found or not in CLAIMED status.",
        )

    return serialize_donation(donation)


@router.post(
    "/{donation_id}/pickup",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def pickup_donation(
    donation_id: str,
    current_user: dict = Depends(get_current_user),
):
    database = get_database()
    if current_user.get("role") not in ["DELIVERY_PARTNER", "DELIVERY_BOY", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to Delivery Partners and Couriers.",
        )

    try:
        donation_id_obj = ObjectId(donation_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format.",
        )

    query = {"_id": donation_id_obj, "status": "ASSIGNED"}
    if current_user.get("role") in ["DELIVERY_PARTNER", "DELIVERY_BOY"]:
        query["delivery_boy_id"] = current_user["_id"]

    donation = await database.donations.find_one(query)
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found or not assigned to you.",
        )

    donor_address = donation.get("pickup_address", "")
    start_coords = get_mock_coordinates(donor_address)

    now = datetime.now(timezone.utc)
    updated = await database.donations.find_one_and_update(
        {"_id": donation_id_obj},
        {
            "$set": {
                "status": "IN_TRANSIT",
                "current_location": start_coords,
                "historical_path": [start_coords],
                "picked_up_at": now,
                "updated_at": now
            }
        },
        return_document=ReturnDocument.AFTER
    )

    return serialize_donation(updated)


@router.post(
    "/{donation_id}/location",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def update_location(
    donation_id: str,
    payload: UpdateLocationRequest,
    current_user: dict = Depends(get_current_user),
):
    database = get_database()
    if current_user.get("role") not in ["DELIVERY_PARTNER", "DELIVERY_BOY", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to Delivery Partners and Couriers.",
        )

    try:
        donation_id_obj = ObjectId(donation_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format.",
        )

    query = {"_id": donation_id_obj, "status": "IN_TRANSIT"}
    if current_user.get("role") in ["DELIVERY_PARTNER", "DELIVERY_BOY"]:
        query["delivery_boy_id"] = current_user["_id"]

    donation = await database.donations.find_one(query)
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active shipment not found.",
        )

    coords = {"lat": round(float(payload.lat), 6), "lng": round(float(payload.lng), 6)}
    now = datetime.now(timezone.utc)

    # Deduplicate sequential GPS log points
    existing_path = donation.get("historical_path", [])
    should_push = True
    if existing_path and len(existing_path) > 0:
        last = existing_path[-1]
        if isinstance(last, dict) and "lat" in last and "lng" in last:
            lat_diff = abs(float(last["lat"]) - coords["lat"])
            lng_diff = abs(float(last["lng"]) - coords["lng"])
            if lat_diff < 0.00005 and lng_diff < 0.00005:
                should_push = False

    update_op = {
        "$set": {
            "current_location": coords,
            "updated_at": now
        }
    }
    if should_push:
        update_op["$push"] = {"historical_path": coords}

    updated = await database.donations.find_one_and_update(
        {"_id": donation_id_obj},
        update_op,
        return_document=ReturnDocument.AFTER
    )

    return serialize_donation(updated)


@router.post(
    "/{donation_id}/deliver",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def deliver_donation(
    donation_id: str,
    current_user: dict = Depends(get_current_user),
):
    database = get_database()
    if current_user.get("role") not in ["DELIVERY_PARTNER", "DELIVERY_BOY", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to Delivery Partners and Couriers.",
        )

    try:
        donation_id_obj = ObjectId(donation_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format.",
        )

    query = {"_id": donation_id_obj, "status": "IN_TRANSIT"}
    if current_user.get("role") in ["DELIVERY_PARTNER", "DELIVERY_BOY"]:
        query["delivery_boy_id"] = current_user["_id"]

    donation = await database.donations.find_one(query)
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active shipment not found.",
        )

    now = datetime.now(timezone.utc)
    updated = await database.donations.find_one_and_update(
        {"_id": donation_id_obj},
        {
            "$set": {
                "status": "COMPLETED",
                "completed_at": now,
                "updated_at": now
            }
        },
        return_document=ReturnDocument.AFTER
    )

    return serialize_donation(updated)


@router.get(
    "/{donation_id}/track",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def track_donation(
    donation_id: str,
    current_user: dict = Depends(get_current_user),
):
    database = get_database()

    try:
        donation_id_obj = ObjectId(donation_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format.",
        )

    donation = await database.donations.find_one({"_id": donation_id_obj})
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found.",
        )

    ngo_address = "NGO Destination"
    ngo_org = await database.organizations.find_one({"_id": donation.get("claimed_by_ngo_id")})
    if ngo_org:
        ngo_address = ngo_org.get("address", "NGO Destination")

    donor_address = donation.get("pickup_address", "")

    pickup_coords = get_mock_coordinates(donor_address)
    dropoff_coords = get_mock_coordinates(ngo_address)

    raw_path = donation.get("historical_path") or [pickup_coords]
    unique_path = []
    for pt in raw_path:
        if not isinstance(pt, dict) or "lat" not in pt or "lng" not in pt:
            continue
        if not unique_path:
            unique_path.append({"lat": round(float(pt["lat"]), 6), "lng": round(float(pt["lng"]), 6)})
        else:
            last = unique_path[-1]
            if abs(float(last["lat"]) - float(pt["lat"])) > 0.00005 or abs(float(last["lng"]) - float(pt["lng"])) > 0.00005:
                unique_path.append({"lat": round(float(pt["lat"]), 6), "lng": round(float(pt["lng"]), 6)})

    current_loc = donation.get("current_location") or pickup_coords
    current_loc = {"lat": round(float(current_loc["lat"]), 6), "lng": round(float(current_loc["lng"]), 6)}

    nearby_places = [
        {"name": "Hitech City Metro Station", "type": "Metro Station", "distance": "150m away", "status": "PASSED", "lat": pickup_coords["lat"] + 0.0008, "lng": pickup_coords["lng"] + 0.0006},
        {"name": "Cyber Towers Traffic Flyover", "type": "Major Junction", "distance": "420m away", "status": "CURRENT_NEARBY", "lat": pickup_coords["lat"] + 0.0015, "lng": pickup_coords["lng"] + 0.0012},
        {"name": "HDFC Bank & Financial Hub", "type": "Commercial Landmark", "distance": "750m away", "status": "UPCOMING", "lat": pickup_coords["lat"] + 0.0028, "lng": pickup_coords["lng"] + 0.0022},
        {"name": "Inorbit Mall Junction", "type": "Shopping Hub", "distance": "1.2 km away", "status": "UPCOMING", "lat": pickup_coords["lat"] + 0.0042, "lng": pickup_coords["lng"] + 0.0035},
        {"name": "Jubilee Hills Community Center", "type": "Civic Landmark", "distance": "1.8 km away", "status": "UPCOMING", "lat": dropoff_coords["lat"] - 0.0010, "lng": dropoff_coords["lng"] - 0.0008},
        {"name": ngo_address if ngo_address != "NGO Destination" else "NGO Community Food Bank Hub", "type": "Dropoff Destination", "distance": "2.4 km away", "status": "DESTINATION", "lat": dropoff_coords["lat"], "lng": dropoff_coords["lng"]}
    ]

    return {
        "donation": serialize_donation(donation),
        "pickup_address": donor_address,
        "pickup_coordinates": pickup_coords,
        "dropoff_address": ngo_address,
        "dropoff_coordinates": dropoff_coords,
        "current_location": current_loc,
        "historical_path": unique_path,
        "nearby_places": nearby_places,
    }


def get_mock_coordinates(address: str) -> dict:
    import hashlib
    if not address or not address.strip():
        return {"lat": 17.3850, "lng": 78.4867}
    h = int(hashlib.md5(address.encode("utf-8")).hexdigest(), 16)
    lat = 17.3850 + ((h % 1000) - 500) * 0.0001
    lng = 78.4867 + (((h // 1000) % 1000) - 500) * 0.0001
    return {"lat": round(lat, 6), "lng": round(lng, 6)}