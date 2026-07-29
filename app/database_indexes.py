from pymongo import ASCENDING, DESCENDING

from app.database import get_database


async def create_database_indexes() -> None:
    database = get_database()

    # =========================================================
    # USERS COLLECTION
    # =========================================================

    await database.users.create_index(
        [
            ("email", ASCENDING),
        ],
        unique=True,
        name="unique_user_email",
    )

    await database.users.create_index(
        [
            ("tenant_id", ASCENDING),
            ("role", ASCENDING),
        ],
        name="users_by_tenant_and_role",
    )

    # =========================================================
    # ORGANIZATIONS COLLECTION
    # =========================================================

    await database.organizations.create_index(
        [
            ("name", ASCENDING),
        ],
        name="organization_name_index",
    )

    # =========================================================
    # FOOD CATEGORIES COLLECTION
    # =========================================================

    await database.food_categories.create_index(
        [
            ("name_normalized", ASCENDING),
        ],
        unique=True,
        name="unique_food_category_name",
    )

    await database.food_categories.create_index(
        [
            ("is_active", ASCENDING),
            ("name", ASCENDING),
        ],
        name="active_food_categories",
    )

    # =========================================================
    # INVENTORY ITEMS COLLECTION
    # =========================================================

    # Tenant inventory sorted/filtered by expiry date.

    await database.inventory_items.create_index(
        [
            ("tenant_id", ASCENDING),
            ("expiry_date", ASCENDING),
        ],
        name="inventory_by_tenant_and_expiry",
    )

    # Tenant inventory sorted by newest created item.

    await database.inventory_items.create_index(
        [
            ("tenant_id", ASCENDING),
            ("created_at", DESCENDING),
        ],
        name="inventory_by_tenant_and_created",
    )

    # Tenant inventory filtered by food category.

    await database.inventory_items.create_index(
        [
            ("tenant_id", ASCENDING),
            ("category_id", ASCENDING),
        ],
        name="inventory_by_tenant_and_category",
    )

    # Tenant inventory filtered by expiry status.

    await database.inventory_items.create_index(
        [
            ("tenant_id", ASCENDING),
            ("expiry_status", ASCENDING),
        ],
        name="inventory_by_tenant_and_status",
    )

    # Keep the existing barcode index for now.
    #
    # Duplicate barcode prevention is already handled
    # inside inventory_service.py before inserting data.
    #
    # We are NOT changing this existing index to unique
    # because doing so can cause another IndexOptionsConflict.

    await database.inventory_items.create_index(
        [
            ("tenant_id", ASCENDING),
            ("barcode", ASCENDING),
        ],
        name="inventory_by_tenant_and_barcode",
    )

    # =========================================================
    # INVENTORY TRANSACTIONS COLLECTION
    # =========================================================

    # IMPORTANT:
    #
    # Keep created_at ASCENDING because this index already
    # exists in your MongoDB database with this definition.
    #
    # Changing ASCENDING to DESCENDING while keeping the same
    # name causes IndexKeySpecsConflict.

    await database.inventory_transactions.create_index(
        [
            ("tenant_id", ASCENDING),
            ("created_at", ASCENDING),
        ],
        name="transactions_by_tenant",
    )

    # New index used to retrieve transaction history
    # for one inventory item.

    await database.inventory_transactions.create_index(
        [
            ("inventory_item_id", ASCENDING),
            ("created_at", DESCENDING),
        ],
        name="transactions_by_inventory_item",
    )

    # =========================================================
    # EXPIRY ALERTS COLLECTION
    # =========================================================

    await database.expiry_alerts.create_index(
        [
            ("tenant_id", ASCENDING),
            ("inventory_item_id", ASCENDING),
        ],
        name="expiry_alert_by_inventory",
    )

    # =========================================================
    # DONATIONS COLLECTION
    # =========================================================

    # Keep created_at ASCENDING because this is the definition
    # you previously created in MongoDB.

    await database.donations.create_index(
        [
            ("tenant_id", ASCENDING),
            ("created_at", ASCENDING),
        ],
        name="donations_by_tenant",
    )

    # =========================================================
    # SUCCESS MESSAGE
    # =========================================================

    print("MongoDB indexes created successfully")