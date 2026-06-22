from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import PyMongoError

from app.core.config import settings
from app.db.fallback import FallbackDatabase


client: AsyncIOMotorClient | None = None
database: AsyncIOMotorDatabase | FallbackDatabase | None = None


async def connect_to_mongo() -> None:
    global client, database
    try:
        client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
        db = client[settings.mongodb_db]
        await db.users.create_index("email", unique=True)
        await db.users.create_index("role")
        await db.activity_logs.create_index([("user_id", 1), ("created_at", -1)])
        await db.student_reports.create_index([("user_id", 1), ("created_at", -1)])
        await db.attendance_records.create_index([("student_id", 1), ("created_at", -1)])
        await db.performance_evaluations.create_index([("student_id", 1), ("created_at", -1)])
        await db.completion_approvals.create_index([("student_id", 1), ("created_at", -1)])
        database = db
    except PyMongoError:
        client = None
        database = FallbackDatabase()
        print("[WARNING] MongoDB unavailable — using local fallback database")


async def close_mongo_connection() -> None:
    global client
    if client is not None:
        client.close()
        client = None


def get_database() -> AsyncIOMotorDatabase | FallbackDatabase:
    if database is None:
        raise RuntimeError("MongoDB connection is not initialized")
    return database
