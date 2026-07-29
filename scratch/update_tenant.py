import pymongo
from bson import ObjectId

client = pymongo.MongoClient('mongodb://localhost:27017')
db = client.food_redistribution
res = db.inventory.update_one({}, {"$set": {"tenant_id": ObjectId("6a4fd7012b1ff3bcadf03eb8")}})
print("Matched count:", res.matched_count)
print("Modified count:", res.modified_count)
