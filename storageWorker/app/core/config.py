import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    kafka_bootstrap_servers: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
    kafka_data_topic: str = os.getenv("KAFKA_DATA_TOPIC", "data")
    kafka_consumer_group: str = os.getenv("KAFKA_CONSUMER_GROUP", "storage-worker-group")
    
    mongo_uri: str = os.getenv("MONGO_URI", "mongodb://mongodb:27017")
    mongo_db_name: str = os.getenv("MONGO_DB_NAME", "metadata_db")
    
    elasticsearch_url: str = os.getenv("ELASTICSEARCH_URL", "http://elasticsearch:9200")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
