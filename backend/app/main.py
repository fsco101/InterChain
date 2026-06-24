from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.mongodb import close_mongo_connection, connect_to_mongo
from app.routers.auth import router as auth_router
from app.routers.admin import router as admin_router
from app.routers.employer import router as employer_router
from app.routers.instructor import router as instructor_router
from app.routers.notifications import router as notifications_router
from app.routers.records import router as records_router
from app.routers.student import router as student_router
from app.routers.ipfs import router as ipfs_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(title=settings.project_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(admin_router, prefix=settings.api_prefix)
app.include_router(records_router, prefix=settings.api_prefix)
app.include_router(student_router, prefix=settings.api_prefix)
app.include_router(instructor_router, prefix=settings.api_prefix)
app.include_router(employer_router, prefix=settings.api_prefix)
app.include_router(notifications_router, prefix=settings.api_prefix)
app.include_router(ipfs_router, prefix=settings.api_prefix)


@app.get("/")
async def health_check():
    return {"status": "ok", "service": settings.project_name}
