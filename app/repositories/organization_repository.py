from bson import ObjectId

from app.database import get_database


def get_organizations_collection():
    database = get_database()

    return database["organizations"]


async def create_organization(
    organization_document: dict,
) -> dict:

    collection = get_organizations_collection()

    result = await collection.insert_one(
        organization_document
    )

    organization_document["_id"] = result.inserted_id

    return organization_document


async def delete_organization_by_id(
    organization_id: ObjectId,
) -> None:

    collection = get_organizations_collection()

    await collection.delete_one(
        {
            "_id": organization_id
        }
    )