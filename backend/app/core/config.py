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
    cloudinary_cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    cloudinary_api_key = os.getenv("CLOUDINARY_API_KEY", "")
    cloudinary_api_secret = os.getenv("CLOUDINARY_API_SECRET", "")
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")
    smtp_from = os.getenv("SMTP_FROM", "")
    pinata_jwt = os.getenv("PINATA_JWT", "")
    pinata_gateway = os.getenv("PINATA_GATEWAY", "https://gateway.pinata.cloud/ipfs")
    amoy_rpc_url = os.getenv("AMOY_RPC_URL", "https://rpc-amoy.polygon.technology")
    polygon_wallet_address = os.getenv("POLYGON_WALLET_ADDRESS", "")
    polygon_private_key = os.getenv("POLYGON_PRIVATE_KEY", "")
    polygon_contract_address = os.getenv("POLYGON_CONTRACT_ADDRESS", "")


settings = Settings()
