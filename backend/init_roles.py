import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "ipre_reco_db")

async def init_db():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    # Define default permissions
    permissions = [
        {"name": "user_manage", "description": "Manage users and roles"},
        {"name": "recommendations_view", "description": "View recommendations"},
        {"name": "recommendations_feedback", "description": "Submit feedback for recommendations"},
        {"name": "stats_view", "description": "View system stats"},
        {"name": "pipeline_run", "description": "Run the recommendation pipeline"},
        {"name": "pipeline_status", "description": "Check pipeline status"},
        {"name": "data_refresh", "description": "Refresh recommendation data"},
    ]

    for perm in permissions:
        await db.permissions.update_one({"name": perm["name"]}, {"$set": perm}, upsert=True)
        print(f"Ensured permission: {perm['name']}")

    # Define default roles and their permissions
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

    print("Database initialization complete.")

if __name__ == "__main__":
    asyncio.run(init_db())
