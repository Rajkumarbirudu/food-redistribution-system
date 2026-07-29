from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user
from app.database import get_database


router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
)


def serialize_category(category: dict) -> dict:
    return {
        "id": str(category["_id"]),
        "name": category.get("name", ""),
        "description": category.get("description", ""),
        "perishability_risk": category.get(
            "perishability_risk",
            "",
        ),
        "storage_requirement": category.get(
            "storage_requirement",
            "",
        ),
        "is_active": category.get("is_active", True),
    }


@router.get("")
async def get_categories(
    current_user: dict = Depends(get_current_user),
):
    database = get_database()

    cursor = database.categories.find(
        {
            "is_active": {
                "$ne": False,
            }
        }
    ).sort("name", 1)

    categories = []

    async for category in cursor:
        categories.append(
            serialize_category(category)
        )

    return categories