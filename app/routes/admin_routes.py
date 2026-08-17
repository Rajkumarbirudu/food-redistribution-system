from datetime import datetime, timezone, timedelta

from bson import ObjectId

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from app.core.dependencies import require_roles
from app.database import get_database
from app.models.enums import UserRole


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


# ============================================================
# HELPERS
# ============================================================

def utc_now() -> datetime:
    return datetime.now(
        timezone.utc
    )


def normalize_value(
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

    if "." in value:
        value = value.split(
            "."
        )[-1]

    return value


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


def serialize_document(
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


def remove_sensitive_user_fields(
    user: dict,
) -> dict:
    user = dict(
        user
    )

    sensitive_fields = [
        "password",
        "password_hash",
        "hashed_password",
        "refresh_token",
        "reset_token",
    ]

    for field in sensitive_fields:
        user.pop(
            field,
            None,
        )

    return user


def validate_object_id(
    value: str,
    field_name: str = "ID",
) -> ObjectId:
    if not ObjectId.is_valid(
        str(value)
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=f"Invalid {field_name}",
        )

    return ObjectId(
        str(value)
    )


# ============================================================
# COLLECTION HELPERS
# ============================================================

async def find_inventory_collection_name(
    database,
) -> str:
    collection_names = (
        await database.list_collection_names()
    )

    if (
        "inventory_items"
        in collection_names
    ):
        return "inventory_items"

    if (
        "inventory"
        in collection_names
    ):
        return "inventory"

    return "inventory_items"


async def find_organization_collection_name(
    database,
) -> str:
    collection_names = (
        await database.list_collection_names()
    )

    if (
        "organizations"
        in collection_names
    ):
        return "organizations"

    if (
        "tenants"
        in collection_names
    ):
        return "tenants"

    return "organizations"


async def get_inventory_collection(
    database,
):
    collection_name = (
        await find_inventory_collection_name(
            database
        )
    )

    return database[
        collection_name
    ]


async def get_organization_collection(
    database,
):
    collection_name = (
        await find_organization_collection_name(
            database
        )
    )

    return database[
        collection_name
    ]


# ============================================================
# DASHBOARD COUNT HELPERS
# ============================================================

async def count_statuses(
    collection,
    statuses: list[str],
) -> int:
    normalized_statuses = [
        f"^{value}$"
        for value in statuses
    ]

    return await collection.count_documents(
        {
            "$or": [
                {
                    "status": {
                        "$regex": regex,
                        "$options": "i",
                    }
                }
                for regex in normalized_statuses
            ]
        }
    )


async def count_expiry_statuses(
    collection,
    statuses: list[str],
) -> int:
    normalized_statuses = [
        f"^{value}$"
        for value in statuses
    ]

    return await collection.count_documents(
        {
            "$or": [
                {
                    "expiry_status": {
                        "$regex": regex,
                        "$options": "i",
                    }
                }
                for regex in normalized_statuses
            ]
        }
    )


# ============================================================
# ADMIN DASHBOARD
# ============================================================

@router.get(
    "/dashboard",
)
async def get_admin_dashboard(
    current_user: dict = Depends(
        require_roles(
            UserRole.ADMIN
        )
    ),
):
    database = get_database()

    inventory_collection = (
        await get_inventory_collection(
            database
        )
    )

    organization_collection = (
        await get_organization_collection(
            database
        )
    )


    # --------------------------------------------------------
    # MAIN COUNTS
    # --------------------------------------------------------

    total_users = (
        await database.users.count_documents(
            {}
        )
    )


    total_organizations = (
        await organization_collection.count_documents(
            {}
        )
    )


    total_inventory_items = (
        await inventory_collection.count_documents(
            {}
        )
    )


    total_donations = (
        await database.donations.count_documents(
            {}
        )
    )


    pending_users = (
        await database.users.count_documents(
            {
                "role": {
                    "$regex": "^(DONOR|INDIVIDUAL_DONOR|NGO|DELIVERY_PARTNER|DELIVERY_BOY)$",
                    "$options": "i",
                },
                "approval_status": {"$nin": ["APPROVED", "REJECTED", "approved", "rejected"]},
                "is_suspended": {"$ne": True},
                "$or": [
                    {"approval_status": {"$regex": "^PENDING$", "$options": "i"}},
                    {"is_active": False},
                ],
            }
        )
    )


    # --------------------------------------------------------
    # DONATION COUNTS
    # --------------------------------------------------------

    available_donations = (
        await count_statuses(
            database.donations,
            [
                "AVAILABLE",
                "PENDING",
            ],
        )
    )


    claimed_donations = (
        await count_statuses(
            database.donations,
            [
                "CLAIMED",
                "ACCEPTED",
                "PICKUP_SCHEDULED",
                "PICKED_UP",
            ],
        )
    )


    completed_donations = (
        await count_statuses(
            database.donations,
            [
                "COMPLETED",
                "DELIVERED",
            ],
        )
    )


    cancelled_donations = (
        await count_statuses(
            database.donations,
            [
                "CANCELLED",
            ],
        )
    )


    # --------------------------------------------------------
    # INVENTORY EXPIRY COUNTS
    # --------------------------------------------------------

    fresh_inventory = (
        await count_expiry_statuses(
            inventory_collection,
            [
                "FRESH",
                "SAFE",
            ],
        )
    )


    expiring_soon_inventory = (
        await count_expiry_statuses(
            inventory_collection,
            [
                "EXPIRING_SOON",
                "WARNING",
            ],
        )
    )


    expired_inventory = (
        await count_expiry_statuses(
            inventory_collection,
            [
                "EXPIRED",
            ],
        )
    )


    # --------------------------------------------------------
    # RECENT USERS
    # --------------------------------------------------------

    recent_users_cursor = (
        database.users
        .find({"role": {"$ne": "ADMIN"}})
        .sort(
            "created_at",
            -1,
        )
        .limit(10)
    )


    recent_users = []


    async for user in recent_users_cursor:
        user = (
            remove_sensitive_user_fields(
                user
            )
        )

        recent_users.append(
            serialize_document(
                user
            )
        )


    # --------------------------------------------------------
    # RECENT DONATIONS
    # --------------------------------------------------------

    recent_donations_cursor = (
        database.donations
        .find({})
        .sort(
            "created_at",
            -1,
        )
        .limit(5)
    )


    recent_donations = []


    async for donation in recent_donations_cursor:
        recent_donations.append(
            serialize_document(
                donation
            )
        )


    return {
        "total_users":
            total_users,

        "total_organizations":
            total_organizations,

        "total_inventory_items":
            total_inventory_items,

        "total_donations":
            total_donations,

        "pending_users":
            pending_users,

        "donation_overview": {
            "available":
                available_donations,

            "claimed":
                claimed_donations,

            "completed":
                completed_donations,

            "cancelled":
                cancelled_donations,
        },

        "inventory_expiry_overview": {
            "fresh":
                fresh_inventory,

            "expiring_soon":
                expiring_soon_inventory,

            "expired":
                expired_inventory,
        },

        "recent_users":
            recent_users,

        "recent_donations":
            recent_donations,
    }


# ============================================================
# GET PENDING USERS
# ============================================================

@router.get(
    "/pending-users",
    response_model=list,
    status_code=status.HTTP_200_OK,
)
async def get_pending_users(
    current_user: dict = Depends(require_roles(UserRole.ADMIN)),
):
    database = get_database()
    cursor = database.users.find(
        {
            "role": {
                "$regex": "^(DONOR|INDIVIDUAL_DONOR|NGO|DELIVERY_PARTNER|DELIVERY_BOY)$",
                "$options": "i",
            },
            "approval_status": {"$nin": ["APPROVED", "REJECTED", "approved", "rejected"]},
            "is_suspended": {"$ne": True},
            "$or": [
                {"approval_status": {"$regex": "^PENDING$", "$options": "i"}},
                {"is_active": False},
            ],
        }
    ).sort("created_at", -1)

    pending_list = []
    async for u in cursor:
        pending_list.append(serialize_document(remove_sensitive_user_fields(u)))

    return pending_list


# ============================================================
# GET USERS
# ============================================================

@router.get(
    "/users",
)
async def get_admin_users(
    approval_status: str | None = Query(
        default=None
    ),

    role: str | None = Query(
        default=None
    ),

    is_active: bool | None = Query(
        default=None
    ),

    current_user: dict = Depends(
        require_roles(
            UserRole.ADMIN
        )
    ),
):
    database = get_database()

    query = {}


    if approval_status:
        query[
            "approval_status"
        ] = {
            "$regex":
                f"^{approval_status}$",

            "$options":
                "i",
        }


    if role:
        if role.upper() == "ADMIN":
            return []
        query[
            "role"
        ] = {
            "$regex":
                f"^{role}$",

            "$options":
                "i",
        }
    else:
        query["role"] = {"$ne": "ADMIN"}


    if is_active is not None:
        query[
            "is_active"
        ] = is_active


    cursor = (
        database.users
        .find(query)
        .sort(
            "created_at",
            -1,
        )
    )


    users = []


    async for user in cursor:
        user = (
            remove_sensitive_user_fields(
                user
            )
        )

        users.append(
            serialize_document(
                user
            )
        )


    return users


# ============================================================
# GET SINGLE USER
# ============================================================

@router.get(
    "/users/{user_id}",
)
async def get_admin_user(
    user_id: str,

    current_user: dict = Depends(
        require_roles(
            UserRole.ADMIN
        )
    ),
):
    database = get_database()

    user_object_id = (
        validate_object_id(
            user_id,
            "user ID",
        )
    )


    user = (
        await database.users.find_one(
            {
                "_id":
                    user_object_id,
            }
        )
    )


    if user is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="User not found",
        )


    user = (
        remove_sensitive_user_fields(
            user
        )
    )


    return serialize_document(
        user
    )


# ============================================================
# GET ORGANIZATIONS
# ============================================================

@router.get(
    "/organizations",
)
async def get_admin_organizations(
    current_user: dict = Depends(
        require_roles(
            UserRole.ADMIN
        )
    ),
):
    database = get_database()

    collection = (
        await get_organization_collection(
            database
        )
    )


    cursor = (
        collection
        .find({})
        .sort(
            "created_at",
            -1,
        )
    )


    organizations = []


    async for organization in cursor:
        organizations.append(
            serialize_document(
                organization
            )
        )


    return organizations


# ============================================================
# GET SINGLE ORGANIZATION
# ============================================================

@router.get(
    "/organizations/{organization_id}",
)
async def get_admin_organization(
    organization_id: str,

    current_user: dict = Depends(
        require_roles(
            UserRole.ADMIN
        )
    ),
):
    database = get_database()

    collection = (
        await get_organization_collection(
            database
        )
    )

    organization_object_id = (
        validate_object_id(
            organization_id,
            "organization ID",
        )
    )


    organization = (
        await collection.find_one(
            {
                "_id":
                    organization_object_id,
            }
        )
    )


    if organization is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Organization not found",
        )


    return serialize_document(
        organization
    )


# ============================================================
# GET INVENTORY
# ============================================================

@router.get(
    "/inventory",
)
async def get_admin_inventory(
    expiry_status: str | None = Query(
        default=None
    ),

    current_user: dict = Depends(
        require_roles(
            UserRole.ADMIN
        )
    ),
):
    database = get_database()

    collection = (
        await get_inventory_collection(
            database
        )
    )


    query = {}


    if expiry_status:
        query[
            "expiry_status"
        ] = {
            "$regex":
                f"^{expiry_status}$",

            "$options":
                "i",
        }


    cursor = (
        collection
        .find(query)
        .sort(
            "created_at",
            -1,
        )
    )


    inventory_items = []


    async for item in cursor:
        inventory_items.append(
            serialize_document(
                item
            )
        )


    return inventory_items


# ============================================================
# GET SINGLE INVENTORY ITEM
# ============================================================

@router.get(
    "/inventory/{inventory_id}",
)
async def get_admin_inventory_item(
    inventory_id: str,

    current_user: dict = Depends(
        require_roles(
            UserRole.ADMIN
        )
    ),
):
    database = get_database()

    collection = (
        await get_inventory_collection(
            database
        )
    )

    inventory_object_id = (
        validate_object_id(
            inventory_id,
            "inventory ID",
        )
    )


    item = (
        await collection.find_one(
            {
                "_id":
                    inventory_object_id,
            }
        )
    )


    if item is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Inventory item not found",
        )


    return serialize_document(
        item
    )


# ============================================================
# GET DONATIONS
# ============================================================

@router.get(
    "/donations",
)
async def get_admin_donations(
    donation_status: str | None = Query(
        default=None,
        alias="status",
    ),

    current_user: dict = Depends(
        require_roles(
            UserRole.ADMIN
        )
    ),
):
    database = get_database()

    query = {}


    if donation_status:
        normalized_status = (
            normalize_value(
                donation_status
            )
        )


        if (
            normalized_status
            == "CLAIMED"
        ):
            query[
                "status"
            ] = {
                "$in": [
                    "CLAIMED",
                    "ACCEPTED",
                    "PICKUP_SCHEDULED",
                    "PICKED_UP",
                ]
            }

        elif (
            normalized_status
            == "AVAILABLE"
        ):
            query[
                "status"
            ] = {
                "$in": [
                    "AVAILABLE",
                    "PENDING",
                ]
            }

        elif (
            normalized_status
            == "COMPLETED"
        ):
            query[
                "status"
            ] = {
                "$in": [
                    "COMPLETED",
                    "DELIVERED",
                ]
            }

        else:
            query[
                "status"
            ] = {
                "$regex":
                    f"^{normalized_status}$",

                "$options":
                    "i",
            }


    cursor = (
        database.donations
        .find(query)
        .sort(
            "created_at",
            -1,
        )
    )


    donations = []


    async for donation in cursor:
        donations.append(
            serialize_document(
                donation
            )
        )


    return donations


# ============================================================
# GET SINGLE DONATION
# ============================================================

@router.get(
    "/donations/{donation_id}",
)
async def get_admin_donation(
    donation_id: str,

    current_user: dict = Depends(
        require_roles(
            UserRole.ADMIN
        )
    ),
):
    database = get_database()

    donation_object_id = (
        validate_object_id(
            donation_id,
            "donation ID",
        )
    )


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
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Donation not found",
        )


    return serialize_document(
        donation
    )


# ============================================================
# APPROVE USER
# ============================================================

@router.patch(
    "/users/{user_id}/approve",
)
async def approve_user(
    user_id: str,

    current_user: dict = Depends(
        require_roles(
            UserRole.ADMIN
        )
    ),
):
    database = get_database()

    user_object_id = (
        validate_object_id(
            user_id,
            "user ID",
        )
    )


    user = (
        await database.users.find_one(
            {
                "_id":
                    user_object_id,
            }
        )
    )


    if user is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="User not found",
        )


    if (
        normalize_value(
            user.get(
                "role"
            )
        )
        == "ADMIN"
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Admin accounts cannot be "
                "approved through this endpoint"
            ),
        )


    now = utc_now()


    await database.users.update_one(
        {
            "_id":
                user_object_id,
        },
        {
            "$set": {
                "approval_status":
                    "APPROVED",

                "is_active":
                    True,

                "approved_at":
                    now,

                "updated_at":
                    now,
            }
        },
    )


    updated_user = (
        await database.users.find_one(
            {
                "_id":
                    user_object_id,
            }
        )
    )


    updated_user = (
        remove_sensitive_user_fields(
            updated_user
        )
    )


    return {
        "message":
            "User approved successfully",

        "user":
            serialize_document(
                updated_user
            ),
    }


# ============================================================
# REJECT USER
# ============================================================

@router.patch(
    "/users/{user_id}/reject",
)
async def reject_user(
    user_id: str,

    current_user: dict = Depends(
        require_roles(
            UserRole.ADMIN
        )
    ),
):
    database = get_database()

    user_object_id = (
        validate_object_id(
            user_id,
            "user ID",
        )
    )


    user = (
        await database.users.find_one(
            {
                "_id":
                    user_object_id,
            }
        )
    )


    if user is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="User not found",
        )


    if (
        normalize_value(
            user.get(
                "role"
            )
        )
        == "ADMIN"
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Admin accounts cannot be "
                "rejected through this endpoint"
            ),
        )


    now = utc_now()


    await database.users.update_one(
        {
            "_id":
                user_object_id,
        },
        {
            "$set": {
                "approval_status":
                    "REJECTED",

                "is_active":
                    False,

                "rejected_at":
                    now,

                "updated_at":
                    now,
            }
        },
    )


    updated_user = (
        await database.users.find_one(
            {
                "_id":
                    user_object_id,
            }
        )
    )


    updated_user = (
        remove_sensitive_user_fields(
            updated_user
        )
    )


    return {
        "message":
            "User rejected successfully",

        "user":
            serialize_document(
                updated_user
            ),
    }


# ============================================================
# ACTIVATE USER
# ============================================================

@router.patch(
    "/users/{user_id}/activate",
)
async def activate_user(
    user_id: str,

    current_user: dict = Depends(
        require_roles(
            UserRole.ADMIN
        )
    ),
):
    database = get_database()

    user_object_id = (
        validate_object_id(
            user_id,
            "user ID",
        )
    )


    user = (
        await database.users.find_one(
            {
                "_id":
                    user_object_id,
            }
        )
    )


    if user is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="User not found",
        )


    if (
        normalize_value(
            user.get(
                "role"
            )
        )
        == "ADMIN"
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Admin account status cannot "
                "be changed here"
            ),
        )


    now = utc_now()


    await database.users.update_one(
        {
            "_id":
                user_object_id,
        },
        {
            "$set": {
                "is_active":
                    True,

                "updated_at":
                    now,
            }
        },
    )


    updated_user = (
        await database.users.find_one(
            {
                "_id":
                    user_object_id,
            }
        )
    )


    updated_user = (
        remove_sensitive_user_fields(
            updated_user
        )
    )


    return {
        "message":
            "User activated successfully",

        "user":
            serialize_document(
                updated_user
            ),
    }


# ============================================================
# DEACTIVATE USER
# ============================================================

@router.patch(
    "/users/{user_id}/deactivate",
)
async def deactivate_user(
    user_id: str,

    current_user: dict = Depends(
        require_roles(
            UserRole.ADMIN
        )
    ),
):
    database = get_database()

    user_object_id = (
        validate_object_id(
            user_id,
            "user ID",
        )
    )


    user = (
        await database.users.find_one(
            {
                "_id":
                    user_object_id,
            }
        )
    )


    if user is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="User not found",
        )


    if (
        normalize_value(
            user.get(
                "role"
            )
        )
        == "ADMIN"
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Admin accounts cannot "
                "be deactivated"
            ),
        )


    now = utc_now()


    await database.users.update_one(
        {
            "_id":
                user_object_id,
        },
        {
            "$set": {
                "is_active":
                    False,

                "updated_at":
                    now,
            }
        },
    )


    updated_user = (
        await database.users.find_one(
            {
                "_id":
                    user_object_id,
            }
        )
    )


    updated_user = (
        remove_sensitive_user_fields(
            updated_user
        )
    )


    return {
        "message":
            "User deactivated successfully",

        "user":
            serialize_document(
                updated_user
            ),
    }


@router.patch(
    "/users/{user_id}/warn",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def warn_user(
    user_id: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN)),
):
    database = get_database()
    user_object_id = validate_object_id(user_id, "user ID")

    user = await database.users.find_one({"_id": user_object_id})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    now = utc_now()
    FINE_AMOUNT = 100.0  # $100 penalty fine per warning
    
    current_warnings = user.get("warnings_count", 0)
    new_warnings = current_warnings + 1
    
    current_wallet = float(user.get("wallet_balance", 1000.0))
    new_wallet = max(0.0, current_wallet - FINE_AMOUNT)
    
    update_data = {
        "warnings_count": new_warnings,
        "wallet_balance": new_wallet,
        "updated_at": now
    }
    
    # Condition: 3 warnings -> suspended for 1 month (30 days)
    suspended = False
    if new_warnings >= 3:
        suspended_until = now + timedelta(days=30)
        update_data["is_suspended"] = True
        update_data["is_active"] = False
        update_data["suspended_until"] = suspended_until
        update_data["suspension_reason"] = f"Automated 1-month suspension triggered after receiving {new_warnings} warnings (Fine of ₹{FINE_AMOUNT:.0f} applied)."
        suspended = True

    await database.users.update_one(
        {"_id": user_object_id},
        {"$set": update_data}
    )

    # Log transaction
    await database.wallet_transactions.insert_one({
        "user_id": user_object_id,
        "user_name": user.get("full_name", ""),
        "amount": -FINE_AMOUNT,
        "balance_after": new_wallet,
        "type": "WARNING_FINE",
        "description": f"Penalty fine for Warning #{new_warnings}",
        "created_at": now
    })

    updated_user = await database.users.find_one({"_id": user_object_id})
    
    msg = f"Warning #{new_warnings} issued to {user.get('full_name')}. ₹{FINE_AMOUNT:.0f} fine deducted from wallet."
    if suspended:
        msg += " 3 warnings limit reached! Delivery partner suspended for 1 month."

    return {
        "message": msg,
        "warnings_count": updated_user.get("warnings_count", 0),
        "wallet_balance": float(updated_user.get("wallet_balance", 0.0)),
        "is_suspended": updated_user.get("is_suspended", False),
        "suspended_until": updated_user.get("suspended_until"),
    }


@router.patch(
    "/users/{user_id}/suspend",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def suspend_user(
    user_id: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN)),
):
    database = get_database()
    user_object_id = validate_object_id(user_id, "user ID")

    user = await database.users.find_one({"_id": user_object_id})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if normalize_value(user.get("role")) == "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin accounts cannot be suspended",
        )

    now = utc_now()
    is_suspended = user.get("is_suspended", False)
    new_suspended = not is_suspended
    
    update_data = {
        "is_suspended": new_suspended,
        "is_active": not new_suspended,
        "updated_at": now
    }
    
    if new_suspended:
        update_data["suspended_until"] = now + timedelta(days=30)
        update_data["suspension_reason"] = "Manual 1-month suspension by Administrator."
    else:
        update_data["suspended_until"] = None
        update_data["suspension_reason"] = None
    
    await database.users.update_one(
        {"_id": user_object_id},
        {"$set": update_data}
    )

    return {
        "message": f"Delivery partner {'suspended for 1 month' if new_suspended else 'suspension lifted'}.",
        "is_suspended": new_suspended,
        "suspended_until": update_data.get("suspended_until"),
    }