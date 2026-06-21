from pathlib import Path
import os

from dotenv import load_dotenv


load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")


class Settings:
    project_name = "InternChain"
    api_prefix = "/api"
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    mongodb_db = os.getenv("MONGODB_DB", "interchain")
    jwt_secret = os.getenv("JWT_SECRET", "change-this-secret-before-production")
    jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_expires_minutes = int(os.getenv("JWT_EXPIRES_MINUTES", "120"))
    frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")


settings = Settings()
