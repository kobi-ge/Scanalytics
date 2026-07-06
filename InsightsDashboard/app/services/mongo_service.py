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
        self.scan_db = self.client["scanalytics_db"]
        self.gridfs_bucket = AsyncIOMotorGridFSBucket(self.client[settings.GRIDFS_DB_NAME])

    async def find_recent_files_by_user(self, user_id: str, limit: int = 5) -> list:
        """Query GridFS files directly by user_id stored in file metadata."""
        collection = self.client[settings.GRIDFS_DB_NAME]["fs.files"]
        cursor = collection.find(
            {"metadata.user_id": user_id}
        ).sort("uploadDate", -1).limit(limit)
        return await cursor.to_list(length=limit)

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

    async def get_receipt_by_file_id(self, file_id: str) -> dict | None:
        """Fetch receipt metadata associated with a file_id from the receipts collection."""
        try:
            receipt = await self.metadata_db.receipts.find_one({"file_id": file_id})
            if receipt:
                receipt["_id"] = str(receipt["_id"])
                return receipt

            # Fallback lookup if metadata_db has no receipt document.
            receipt = await self.scan_db.scans.find_one({"file_id": file_id})
            if receipt:
                receipt["_id"] = str(receipt["_id"])
            return receipt
        except Exception as e:
            log_to_elastic("ERROR", f"Failed to fetch receipt for file_id {file_id}: {e}", "InsightsDashboard")
            return None

    async def search_receipts(self, user_id: str, category: str = None, store: str = None) -> list:
        """Search receipts by user_id, category, and store name."""
        query = {"user_id": user_id}
        if category:
            query["items.category"] = {"$regex": category, "$options": "i"}
        if store:
            query["store"] = {"$regex": store, "$options": "i"}
        
        try:
            cursor = self.metadata_db.receipts.find(query).sort("purchase_date", -1)
            receipts = await cursor.to_list(length=100)
            if receipts:
                for r in receipts:
                    r["_id"] = str(r["_id"])
                return receipts

            # Fallback to scanalytics_db.scans when metadata_db returns no receipts.
            cursor = self.scan_db.scans.find(query).sort("purchase_date", -1)
            receipts = await cursor.to_list(length=100)
            for r in receipts:
                r["_id"] = str(r["_id"])
            return receipts
        except Exception as e:
            log_to_elastic("ERROR", f"Failed to search receipts for user {user_id}: {e}", "InsightsDashboard")
            return []


# Singleton instance
mongo_service = MongoService()
