from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ES_HOST: str = "http://localhost:9200"
    ES_INDEX: str = "receipt_items"

    MONGO_URI: str = "mongodb://localhost:27017"
    GRIDFS_DB_NAME: str = "files_db"
    MONGO_METADATA_DB: str = "metadata_db"

    class Config:
        env_file = ".env"

settings = Settings()
