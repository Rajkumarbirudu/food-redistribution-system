from app.database import get_database


async def get_admin_dashboard_counts() -> dict:
    database = get_database()

    total_users = await database.users.count_documents({})
    total_organizations = await database.organizations.count_documents({})
    total_inventory_items = await database.inventory_items.count_documents({})
    total_donations = await database.donations.count_documents({})

    available_donations = await database.donations.count_documents(
        {"status": "AVAILABLE"}
    )

    claimed_donations = await database.donations.count_documents(
        {"status": "CLAIMED"}
    )

    completed_donations = await database.donations.count_documents(
        {"status": "COMPLETED"}
    )

    cancelled_donations = await database.donations.count_documents(
        {"status": "CANCELLED"}
    )

    fresh_inventory = await database.inventory_items.count_documents(
        {"expiry_status": "FRESH"}
    )

    expiring_soon_inventory = (
        await database.inventory_items.count_documents(
            {"expiry_status": "EXPIRING_SOON"}
        )
    )

    expired_inventory = await database.inventory_items.count_documents(
        {"expiry_status": "EXPIRED"}
    )

    donor_users = await database.users.count_documents(
        {"role": "DONOR"}
    )

    ngo_users = await database.users.count_documents(
        {"role": "NGO"}
    )

    admin_users = await database.users.count_documents(
        {"role": "ADMIN"}
    )

    return {
        "total_users": total_users,
        "total_organizations": total_organizations,
        "total_inventory_items": total_inventory_items,
        "total_donations": total_donations,
        "available_donations": available_donations,
        "claimed_donations": claimed_donations,
        "completed_donations": completed_donations,
        "cancelled_donations": cancelled_donations,
        "fresh_inventory": fresh_inventory,
        "expiring_soon_inventory": expiring_soon_inventory,
        "expired_inventory": expired_inventory,
        "donor_users": donor_users,
        "ngo_users": ngo_users,
        "admin_users": admin_users,
    }


async def get_recent_donations(
    limit: int = 10,
) -> list[dict]:
    cursor = (
        get_database()["donations"]
        .find({})
        .sort("created_at", -1)
        .limit(limit)
    )

    return await cursor.to_list(length=limit)


async def get_recent_inventory_items(
    limit: int = 10,
) -> list[dict]:
    cursor = (
        get_database()["inventory_items"]
        .find({})
        .sort("created_at", -1)
        .limit(limit)
    )

    return await cursor.to_list(length=limit)