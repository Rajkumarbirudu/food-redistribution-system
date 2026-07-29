import asyncio
import os
import sys
from pymongo import MongoClient

def migrate_database(local_uri: str, cloud_uri: str, db_name: str = "food_redistribution"):
    print(f"Connecting to local database: {local_uri}...")
    local_client = MongoClient(local_uri, serverSelectionTimeoutMS=5000)
    local_db = local_client[db_name]

    print(f"Connecting to cloud database...")
    cloud_client = MongoClient(cloud_uri, serverSelectionTimeoutMS=10000)
    cloud_db = cloud_client[db_name]

    # Test cloud ping
    cloud_client.admin.command("ping")
    print("Cloud database ping successful!")

    collections = local_db.list_collection_names()
    print(f"Found local collections: {collections}")

    for coll_name in collections:
        if coll_name.startswith("system."):
            continue
        docs = list(local_db[coll_name].find({}))
        if not docs:
            print(f"Collection '{coll_name}' is empty. Skipping.")
            continue

        print(f"Migrating {len(docs)} documents for collection '{coll_name}'...")
        count = 0
        for doc in docs:
            cloud_db[coll_name].replace_one({"_id": doc["_id"]}, doc, upsert=True)
            count += 1
        print(f"Successfully synced {count} documents into cloud collection '{coll_name}'.")

    print("\nDatabase migration complete! All local accounts and data are now in your cloud database.")

if __name__ == "__main__":
    local_uri = "mongodb://localhost:27017"
    cloud_uri = ""
    if len(sys.argv) > 1:
        arg_val = sys.argv[1].strip()
        if "YOUR_MONGODB_ATLAS_URL" not in arg_val.upper() and "<" not in arg_val:
            cloud_uri = arg_val

    if not cloud_uri:
        print("\n--- MongoDB Atlas Connection Required ---")
        cloud_uri = input("Please paste your real MongoDB Atlas connection string (e.g. mongodb+srv://...): ").strip()
    
    if not cloud_uri or "YOUR_MONGODB_ATLAS_URL" in cloud_uri.upper():
        print("\n[Error] Please provide your actual MongoDB Atlas connection string.")
        sys.exit(1)

    migrate_database(local_uri, cloud_uri)
