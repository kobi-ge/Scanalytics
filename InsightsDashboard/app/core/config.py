from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    # Prefer explicit ES_HOST, but fall back to ELASTICSEARCH_URL for compatibility
    ES_HOST: str = os.getenv("ES_HOST", os.getenv("ELASTICSEARCH_URL", "http://elasticsearch:9200"))
    ES_INDEX: str = "receipt_items"

    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://mongodb:27017")
    GRIDFS_DB_NAME: str = os.getenv("GRIDFS_DB_NAME", "files_db")
    MONGO_METADATA_DB: str = os.getenv("MONGO_METADATA_DB", "metadata_db")

    class Config:
        env_file = ".env"

settings = Settings()
