from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from bson import ObjectId
from app.core.config import settings
from app.logger.logger import log_to_elastic


class MongoService:
    """
    Manages connections to:
      - metadata_db (receipts collection) — for querying receipt docs by user/store/date
      - files_db (GridFS) — for fetching the binary image files
    Uses a single AsyncIOMotorClient for both databases.
    """

    def __init__(self):
        self.client = AsyncIOMotorClient(settings.MONGO_URI)
        self.metadata_db = self.client[settings.MONGO_METADATA_DB]
        self.gridfs_bucket = AsyncIOMotorGridFSBucket(self.client[settings.GRIDFS_DB_NAME])

    async def find_receipts(self, user_id: str, store: str, purchase_date: str) -> list:
        """Query the receipts collection filtered by user_id, store, and purchase_date."""
        query = {
            "user_id": user_id,
            "store": store,
            "purchase_date": purchase_date,
        }
        cursor = self.metadata_db.receipts.find(query)
        return await cursor.to_list(length=None)

    async def get_file(self, file_id: str) -> dict | None:
        """
        Retrieve a file from GridFS by its string file_id.
        Returns a dict with 'data', 'content_type', and 'filename', or None if not found.
        """
        try:
            grid_out = await self.gridfs_bucket.open_download_stream(ObjectId(file_id))
            data = await grid_out.read()
            return {
                "data": data,
                "content_type": grid_out.metadata.get("contentType", "application/octet-stream")
                    if grid_out.metadata else getattr(grid_out, "content_type", "application/octet-stream"),
                "filename": grid_out.filename or file_id,
            }
        except Exception as e:
            log_to_elastic("WARNING", f"GridFS file not found for id={file_id}: {e}", "InsightsDashboard")
            return None


# Singleton instance
mongo_service = MongoService()
