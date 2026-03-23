import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

class MongoService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def save_receipt(self, receipt_id: str, data: dict):
        try:
            # Use receipt_id as the _id to ensure idempotency
            data["_id"] = receipt_id
            await self.db.receipts.replace_one(
                {"_id": receipt_id},
                data,
                upsert=True
            )
            logger.info(f"Saved receipt {receipt_id} to MongoDB.")
        except Exception as e:
            logger.error(f"Error saving to MongoDB: {e}")
            raise
