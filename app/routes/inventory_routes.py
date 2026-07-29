from datetime import datetime, timezone

from bson import ObjectId

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)

from app.core.dependencies import require_roles
from app.models.enums import UserRole

from app.schemas.inventory_schema import (
    InventoryCreate,
    InventoryResponse,
    InventoryUpdate,
)

from app.repositories.category_repository import (
    find_category_by_id,
)

from app.services.inventory_service import (
    calculate_expiry_details,
    create_inventory_item,
    delete_inventory_item,
    get_inventory_item,
    list_inventory_items,
    update_inventory_item,
)

from app.database import get_database
from app.services.csv_import_service import (
    import_inventory_csv,
)


router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
)


# ============================================================
# TENANT ID
# ============================================================

def get_tenant_object_id(
    current_user: dict,
) -> ObjectId:
    tenant_id = (
        current_user.get("tenant_id")
        or current_user.get("organization_id")
        or current_user.get("_id")
        or current_user.get("id")
    )

    if tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not belong to a tenant",
        )

    if isinstance(tenant_id, ObjectId):
        return tenant_id

    if not ObjectId.is_valid(str(tenant_id)):
        user_id = current_user.get("_id") or current_user.get("id")
        if user_id and ObjectId.is_valid(str(user_id)):
            return ObjectId(str(user_id))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid tenant ID",
        )

    return ObjectId(str(tenant_id))


# ============================================================
# USER ID
# ============================================================

def get_current_user_id(
    current_user: dict,
):
    user_id = (
        current_user.get("_id")
        or current_user.get("id")
        or current_user.get("user_id")
    )

    if user_id is None:
        return None

    if isinstance(user_id, ObjectId):
        return user_id

    if ObjectId.is_valid(str(user_id)):
        return ObjectId(str(user_id))

    return str(user_id)


# ============================================================
# SERIALIZER
# ============================================================

def serialize_inventory(
    item: dict,
) -> dict:
    result = dict(item)

    if "_id" in result:
        result["id"] = str(
            result.pop("_id")
        )

    elif "id" in result:
        result["id"] = str(
            result["id"]
        )

    if result.get("tenant_id") is not None:
        result["tenant_id"] = str(
            result["tenant_id"]
        )

    if result.get("category_id") is not None:
        result["category_id"] = str(
            result["category_id"]
        )

    if result.get("created_by") is not None:
        result["created_by"] = str(
            result["created_by"]
        )

    expiry_status = result.get("expiry_status")

    if hasattr(expiry_status, "value"):
        result["expiry_status"] = expiry_status.value

    return result


# ============================================================
# CATEGORY LOOKUP
#
# Supports repositories that expect either:
#   find_category_by_id(str)
# or
#   find_category_by_id(ObjectId)
# ============================================================

async def get_category_or_404(
    category_id_value,
) -> dict:
    if not category_id_value:
        return {
            "_id": "default",
            "id": "default",
            "name": "General Food",
            "default_expiry_warning_days": 3
        }

    category_id_string = str(category_id_value).strip()

    if ObjectId.is_valid(category_id_string):
        category_object_id = ObjectId(category_id_string)
        try:
            category = await find_category_by_id(category_object_id)
            if category:
                return category
        except Exception:
            pass

    try:
        db = get_database()
        cat = await db.categories.find_one({
            "$or": [
                {"_id": category_id_string},
                {"name": category_id_string},
                {"slug": category_id_string}
            ]
        })
        if cat:
            return cat
    except Exception:
        pass

    return {
        "_id": category_id_string if ObjectId.is_valid(category_id_string) else ObjectId(),
        "id": category_id_string,
        "name": category_id_string.replace("_", " ").title(),
        "default_expiry_warning_days": 3
    }


# ============================================================
# BUILD DOCUMENT
# ============================================================

async def build_inventory_document(
    item_data: InventoryCreate,
    current_user: dict,
) -> dict:
    tenant_id = get_tenant_object_id(
        current_user
    )

    data = item_data.model_dump()

    category = await get_category_or_404(
        data["category_id"]
    )

    category_object_id = category.get("_id")
    if not isinstance(category_object_id, ObjectId):
        if ObjectId.is_valid(str(category_object_id)):
            category_object_id = ObjectId(str(category_object_id))
        else:
            category_object_id = ObjectId()

    warning_days = int(
        category.get(
            "default_expiry_warning_days",
            3,
        )
    )

    (
        days_until_expiry,
        expiry_status,
    ) = calculate_expiry_details(
        data["expiry_date"],
        warning_days,
    )

    now = datetime.now(timezone.utc)

    document = {
        **data,

        "category_id":
            category_object_id,

        "category_name":
            category.get("name", ""),

        "tenant_id":
            tenant_id,

        "created_by":
            get_current_user_id(
                current_user
            ),

        "days_until_expiry":
            days_until_expiry,

        "expiry_status": (
            expiry_status.value
            if hasattr(
                expiry_status,
                "value",
            )
            else str(expiry_status)
        ),

        "created_at":
            now,

        "updated_at":
            now,
    }

    return document


# ============================================================
# CSV IMPORT
#
# MUST BE ABOVE /{item_id}
# ============================================================

@router.post(
    "/import-csv",
    status_code=status.HTTP_200_OK,
)
async def upload_inventory_csv(
    file: UploadFile = File(...),
    current_user: dict = Depends(
        require_roles(UserRole.DONOR, UserRole.INDIVIDUAL_DONOR, UserRole.ADMIN)
    ),
):
    return await import_inventory_csv(
        file=file,
        current_user=current_user,
    )


# ============================================================
# CREATE
# ============================================================

@router.post(
    "",
    response_model=InventoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_item(
    item_data: InventoryCreate,
    current_user: dict = Depends(
        require_roles(UserRole.DONOR, UserRole.INDIVIDUAL_DONOR, UserRole.ADMIN)
    ),
):
    document = await build_inventory_document(
        item_data,
        current_user,
    )

    created_item = await create_inventory_item(
        document
    )

    return serialize_inventory(
        created_item
    )


# ============================================================
# LIST
# ============================================================

@router.get(
    "",
    response_model=list[InventoryResponse],
)
async def list_inventory(
    current_user: dict = Depends(
        require_roles(UserRole.DONOR, UserRole.INDIVIDUAL_DONOR, UserRole.ADMIN)
    ),
):
    tenant_id = get_tenant_object_id(
        current_user
    )

    items, total = await list_inventory_items(
        tenant_id=tenant_id,
        query={},
        skip=0,
        limit=1000,
    )

    return [
        serialize_inventory(item)
        for item in items
    ]


# ============================================================
# GET ONE
# ============================================================

@router.get(
    "/{item_id}",
    response_model=InventoryResponse,
)
async def get_item(
    item_id: str,
    current_user: dict = Depends(
        require_roles(UserRole.DONOR, UserRole.INDIVIDUAL_DONOR, UserRole.ADMIN)
    ),
):
    item = await get_inventory_item(
        inventory_id=item_id,
        current_user=current_user,
    )

    return serialize_inventory(item)


# ============================================================
# UPDATE
# ============================================================

@router.put(
    "/{item_id}",
    response_model=InventoryResponse,
)
async def update_item(
    item_id: str,
    item_data: InventoryUpdate,
    current_user: dict = Depends(
        require_roles(UserRole.DONOR, UserRole.INDIVIDUAL_DONOR, UserRole.ADMIN)
    ),
):
    tenant_id = get_tenant_object_id(
        current_user
    )

    update_document = item_data.model_dump(
        exclude_unset=True
    )

    if not update_document:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided for update",
        )

    category = None

    if "category_id" in update_document:
        category = await get_category_or_404(
            update_document["category_id"]
        )

        update_document["category_id"] = (
            category.get("_id") or category.get("id")
        )

        update_document["category_name"] = (
            category.get("name", "")
        )

    if "expiry_date" in update_document:
        if category is None:
            existing_item = await get_inventory_item(
                inventory_id=item_id,
                current_user=current_user,
            )

            category = await get_category_or_404(
                existing_item["category_id"]
            )

        warning_days = int(
            category.get(
                "default_expiry_warning_days",
                3,
            )
        )

        (
            days_until_expiry,
            expiry_status,
        ) = calculate_expiry_details(
            update_document["expiry_date"],
            warning_days,
        )

        update_document["days_until_expiry"] = (
            days_until_expiry
        )

        update_document["expiry_status"] = (
            expiry_status.value
            if hasattr(expiry_status, "value")
            else str(expiry_status)
        )

    update_document["updated_at"] = (
        datetime.now(timezone.utc)
    )

    updated_item = await update_inventory_item(
        inventory_id=item_id,
        tenant_id=tenant_id,
        update_document=update_document,
    )

    if updated_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found",
        )

    return serialize_inventory(
        updated_item
    )


# ============================================================
# DELETE
# ============================================================

@router.delete(
    "/{item_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_item(
    item_id: str,
    current_user: dict = Depends(
        require_roles(UserRole.DONOR, UserRole.INDIVIDUAL_DONOR, UserRole.ADMIN)
    ),
):
    tenant_id = get_tenant_object_id(
        current_user
    )

    deleted = await delete_inventory_item(
        inventory_id=item_id,
        tenant_id=tenant_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found",
        )

    return {
        "message":
            "Inventory item deleted successfully"
    }


@router.delete(
    "/clear/all-items",
    status_code=status.HTTP_200_OK,
)
async def clear_all_inventory_items(
    current_user: dict = Depends(
        require_roles(UserRole.DONOR, UserRole.INDIVIDUAL_DONOR, UserRole.ADMIN)
    ),
):
    database = get_database()
    user_id = current_user.get("_id") or current_user.get("id")
    tenant_id = current_user.get("tenant_id") or current_user.get("organization_id")
    
    query_vals = []
    if user_id:
        query_vals.append(user_id)
        if ObjectId.is_valid(str(user_id)):
            query_vals.append(ObjectId(str(user_id)))
    if tenant_id:
        query_vals.append(tenant_id)
        if ObjectId.is_valid(str(tenant_id)):
            query_vals.append(ObjectId(str(tenant_id)))

    res = await database.inventory.delete_many({
        "$or": [
            {"tenant_id": {"$in": query_vals}},
            {"organization_id": {"$in": query_vals}},
            {"created_by": {"$in": query_vals}},
            {"donor_id": {"$in": query_vals}}
        ]
    })
    return {"message": f"Cleared {res.deleted_count} items."}