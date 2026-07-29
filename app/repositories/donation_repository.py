from typing import Optional

from bson import ObjectId

from app.database import get_database


def get_donation_collection():
    database = get_database()

    return database.donations


async def create_donation(
    document: dict,
) -> dict:
    collection = get_donation_collection()

    result = await collection.insert_one(
        document
    )

    donation = await collection.find_one(
        {
            "_id": result.inserted_id,
        }
    )

    return donation


async def find_donation_by_id(
    donation_id,
    tenant_id: ObjectId | None = None,
) -> Optional[dict]:
    collection = get_donation_collection()

    if isinstance(
        donation_id,
        ObjectId,
    ):
        object_id = donation_id

    else:
        donation_id_string = str(
            donation_id
        ).strip()

        if not ObjectId.is_valid(
            donation_id_string
        ):
            return None

        object_id = ObjectId(
            donation_id_string
        )

    query = {
        "_id": object_id,
    }

    if tenant_id is not None:
        query["tenant_id"] = tenant_id

    return await collection.find_one(
        query
    )


async def list_donations_by_tenant(
    tenant_id: ObjectId,
) -> list[dict]:
    collection = get_donation_collection()

    cursor = collection.find(
        {
            "tenant_id": tenant_id,
        }
    ).sort(
        "created_at",
        -1,
    )

    donations = []

    async for donation in cursor:
        donations.append(donation)

    return donations


async def update_donation_by_id(
    donation_id: ObjectId,
    tenant_id: ObjectId,
    update_document: dict,
) -> Optional[dict]:
    collection = get_donation_collection()

    result = await collection.update_one(
        {
            "_id": donation_id,
            "tenant_id": tenant_id,
        },
        {
            "$set": update_document,
        },
    )

    if result.matched_count == 0:
        return None

    return await collection.find_one(
        {
            "_id": donation_id,
            "tenant_id": tenant_id,
        }
    )