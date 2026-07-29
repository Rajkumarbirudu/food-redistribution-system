from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.repositories.category_repository import (
    create_category,
    find_category_by_id,
    find_category_by_name,
    list_active_categories,
    update_category_by_id,
)

from app.schemas.category_schema import (
    CategoryCreateRequest,
    CategoryUpdateRequest,
)


DEFAULT_CATEGORIES = [
    {
        "name": "Dairy",
        "description": "Milk, curd, cheese and other dairy products.",
        "perishability_risk": "HIGH",
        "storage_requirement": "REFRIGERATED",
        "default_expiry_warning_days": 2,
    },
    {
        "name": "Fruits",
        "description": "Fresh fruits and fruit products.",
        "perishability_risk": "MEDIUM",
        "storage_requirement": "COOL_DRY_PLACE",
        "default_expiry_warning_days": 3,
    },
    {
        "name": "Vegetables",
        "description": "Fresh vegetables and vegetable products.",
        "perishability_risk": "HIGH",
        "storage_requirement": "COOL_DRY_PLACE",
        "default_expiry_warning_days": 3,
    },
    {
        "name": "Grains",
        "description": "Rice, wheat and other grain products.",
        "perishability_risk": "LOW",
        "storage_requirement": "ROOM_TEMPERATURE",
        "default_expiry_warning_days": 15,
    },
    {
        "name": "Bakery",
        "description": "Bread, cakes and other bakery products.",
        "perishability_risk": "MEDIUM",
        "storage_requirement": "ROOM_TEMPERATURE",
        "default_expiry_warning_days": 2,
    },
    {
        "name": "Cooked Food",
        "description": "Prepared meals and cooked food.",
        "perishability_risk": "HIGH",
        "storage_requirement": "REFRIGERATED",
        "default_expiry_warning_days": 1,
    },
    {
        "name": "Packaged Food",
        "description": "Sealed and packaged food products.",
        "perishability_risk": "LOW",
        "storage_requirement": "ROOM_TEMPERATURE",
        "default_expiry_warning_days": 15,
    },
]


def serialize_category(category: dict) -> dict:
    return {
        "id": str(category["_id"]),
        "name": category.get("name", ""),
        "description": category.get(
            "description",
            "",
        ),
        "perishability_risk": category.get(
            "perishability_risk",
            "MEDIUM",
        ),
        "storage_requirement": category.get(
            "storage_requirement",
            "ROOM_TEMPERATURE",
        ),
        "default_expiry_warning_days": (
            category.get(
                "default_expiry_warning_days",
                3,
            )
        ),
        "is_active": category.get(
            "is_active",
            True,
        ),
    }


async def seed_default_categories() -> None:
    """
    Create Aura Food default categories when they
    do not already exist.

    Safe to call multiple times.
    """

    now = datetime.now(timezone.utc)

    for category_data in DEFAULT_CATEGORIES:
        existing_category = (
            await find_category_by_name(
                category_data["name"]
            )
        )

        if existing_category is not None:
            continue

        category_document = {
            **category_data,
            "name_normalized": (
                category_data["name"]
                .strip()
                .lower()
            ),
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }

        await create_category(
            category_document
        )


async def create_food_category(
    request: CategoryCreateRequest,
) -> dict:
    category_name = request.name.strip()

    existing_category = (
        await find_category_by_name(
            category_name
        )
    )

    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Food category already exists",
        )

    now = datetime.now(timezone.utc)

    category_document = {
        "name": category_name,
        "name_normalized": (
            category_name.lower()
        ),
        "description": request.description,
        "perishability_risk": (
            request.perishability_risk.value
        ),
        "storage_requirement": (
            request.storage_requirement.value
        ),
        "default_expiry_warning_days": (
            request.default_expiry_warning_days
        ),
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }

    category = await create_category(
        category_document
    )

    return serialize_category(category)


async def get_food_categories() -> list[dict]:
    """
    Return active categories.

    If the database has no active categories,
    automatically create Aura Food defaults.
    """

    categories = await list_active_categories()

    if not categories:
        await seed_default_categories()

        categories = (
            await list_active_categories()
        )

    return [
        serialize_category(category)
        for category in categories
    ]


async def get_food_category(
    category_id: str,
) -> dict:
    category = await find_category_by_id(
        category_id
    )

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food category not found",
        )

    return serialize_category(category)


async def update_food_category(
    category_id: str,
    request: CategoryUpdateRequest,
) -> dict:
    existing_category = (
        await find_category_by_id(
            category_id
        )
    )

    if existing_category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food category not found",
        )

    update_document = request.model_dump(
        exclude_unset=True
    )

    if not update_document:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided for update",
        )

    if "name" in update_document:
        category_name = (
            update_document["name"].strip()
        )

        duplicate_category = (
            await find_category_by_name(
                category_name
            )
        )

        if (
            duplicate_category is not None
            and str(
                duplicate_category["_id"]
            )
            != category_id
        ):
            raise HTTPException(
                status_code=(
                    status.HTTP_409_CONFLICT
                ),
                detail=(
                    "Food category already exists"
                ),
            )

        update_document["name"] = (
            category_name
        )

        update_document[
            "name_normalized"
        ] = category_name.lower()

    if "perishability_risk" in update_document:
        value = update_document[
            "perishability_risk"
        ]

        if hasattr(value, "value"):
            update_document[
                "perishability_risk"
            ] = value.value

    if "storage_requirement" in update_document:
        value = update_document[
            "storage_requirement"
        ]

        if hasattr(value, "value"):
            update_document[
                "storage_requirement"
            ] = value.value

    update_document["updated_at"] = (
        datetime.now(timezone.utc)
    )

    updated_category = (
        await update_category_by_id(
            category_id,
            update_document,
        )
    )

    if updated_category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food category not found",
        )

    return serialize_category(
        updated_category
    )