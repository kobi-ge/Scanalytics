import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

class MongoService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def save_receipt(self, doc_id: str, data: dict):
        try:
            # Use doc_id as the _id to ensure idempotency
            data["_id"] = doc_id
            await self.db.receipts.replace_one(
                {"_id": doc_id},
                data,
                upsert=True
            )
            logger.info(f"Saved receipt {doc_id} to MongoDB.")
        except Exception as e:
            logger.error(f"Error saving to MongoDB: {e}")
            raise
