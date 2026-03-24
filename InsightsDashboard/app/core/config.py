from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ES_HOST: str = "http://localhost:9200"
    ES_INDEX: str = "receipt_items"

    class Config:
        env_file = ".env"

settings = Settings()
