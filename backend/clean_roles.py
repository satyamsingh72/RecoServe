import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "ipre_reco_db")

async def clean_roles():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    # Delete roles that don't have a 'name' field
    result = await db.roles.delete_many({"name": {"$exists": False}})
    print(f"Deleted {result.deleted_count} corrupted role documents (missing 'name' field).")

    # Also ensure default roles are present (just in case)
    roles = [
        {
            "name": "Admin",
            "permissions": [
                "user_manage",
                "recommendations_view",
                "recommendations_feedback",
                "stats_view",
                "pipeline_run",
                "pipeline_status",
                "data_refresh",
            ],
        },
        {
            "name": "Standard",
            "permissions": [
                "recommendations_view",
                "stats_view",
            ],
        },
    ]

    for role in roles:
        await db.roles.update_one({"name": role["name"]}, {"$set": role}, upsert=True)
        print(f"Ensured role: {role['name']}")

if __name__ == "__main__":
    asyncio.run(clean_roles())
