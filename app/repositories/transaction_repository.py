from datetime import datetime, timezone

from app.database import get_database


async def create_inventory_transaction(
    *,
    tenant_id,
    inventory_item_id,
    user_id,
    transaction_type: str,
    quantity: float,
    metadata: dict | None = None,
) -> None:

    transaction_document = {
        "tenant_id": tenant_id,
        "inventory_item_id": inventory_item_id,
        "user_id": user_id,
        "transaction_type": transaction_type,
        "quantity": quantity,
        "metadata": metadata or {},
        "created_at": datetime.now(timezone.utc),
    }

    collection = get_database()[
        "inventory_transactions"
    ]

    await collection.insert_one(
        transaction_document
    )