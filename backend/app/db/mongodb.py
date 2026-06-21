from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import PyMongoError

from app.core.config import settings


client: AsyncIOMotorClient | None = None
database: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    global client, database
    try:
        client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
        database = client[settings.mongodb_db]
        await database.users.create_index("email", unique=True)
        await database.users.create_index("role")
        await database.activity_logs.create_index([("user_id", 1), ("created_at", -1)])
        await database.student_reports.create_index([("user_id", 1), ("created_at", -1)])
        await database.attendance_records.create_index([("student_id", 1), ("created_at", -1)])
        await database.performance_evaluations.create_index([("student_id", 1), ("created_at", -1)])
        await database.completion_approvals.create_index([("student_id", 1), ("created_at", -1)])
    except PyMongoError:
        client = None
        database = None
        raise RuntimeError("Unable to connect to MongoDB")


async def close_mongo_connection() -> None:
    global client
    if client is not None:
        client.close()
        client = None


def get_database() -> AsyncIOMotorDatabase:
    if database is None:
        raise RuntimeError("MongoDB connection is not initialized")
    return database
