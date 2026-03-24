from app.logger.logger import log_to_elastic
from motor.motor_asyncio import AsyncIOMotorDatabase


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
            log_to_elastic("INFO", f"Saved receipt {receipt_id} to MongoDB.", "storageWorker")
        except Exception as e:
            log_to_elastic("ERROR", f"Error saving to MongoDB: {e}", "storageWorker")
            raise
