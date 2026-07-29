import asyncio
from app.database import connect_to_mongodb, get_database

async def check():
    await connect_to_mongodb()
    db = get_database()
    query = {
        "role": {
            "$regex": "^(DONOR|NGO|DELIVERY_PARTNER|DELIVERY_BOY)$",
            "$options": "i",
        },
        "approval_status": {"$nin": ["APPROVED", "REJECTED", "approved", "rejected"]},
        "is_suspended": {"$ne": True},
        "$or": [
            {"approval_status": {"$regex": "^PENDING$", "$options": "i"}},
            {"is_active": False},
        ],
    }
    users = await db.users.find(query).to_list(100)
    print(f"MATCHED PENDING USERS COUNT: {len(users)}")
    for u in users:
        print(f"-> ID: {u['_id']} | Name: {u.get('full_name')} | Status: {u.get('approval_status')}")

if __name__ == "__main__":
    asyncio.run(check())
