import time
from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket

from app.core.config import settings
from app.logger.logger import log_to_elastic
from app.utils.cursor import build_keyset_filter, decode_cursor, encode_cursor

SLIM_RECEIPT_PROJECTION = {
    "_id": 1,
    "receipt_id": 1,
    "file_id": 1,
    "store": 1,
    "purchase_date": 1,
    "total_price": 1,
    "payment_method": 1,
    "item_count": 1,
    "created_at": 1,
    "user_id": 1,
}

DEFAULT_PAGE_SIZE = 12
MAX_PAGE_SIZE = 50


def _format_created_at(value) -> str:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    return str(value)


def doc_to_summary(doc: dict) -> dict:
    file_id = doc.get("file_id")
    item_count = doc.get("item_count")
    if item_count is None:
        item_count = len(doc.get("items") or [])
    created_at = doc.get("created_at")
    if not created_at:
        created_at = datetime.now(timezone.utc)
    return {
        "id": str(doc["_id"]),
        "receipt_id": doc.get("receipt_id"),
        "file_id": file_id,
        "store": doc.get("store"),
        "purchase_date": doc.get("purchase_date"),
        "total_price": doc.get("total_price"),
        "payment_method": doc.get("payment_method"),
        "item_count": item_count,
        "created_at": _format_created_at(created_at),
        "has_image": bool(file_id),
    }


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

    async def count_receipts(self, user_id: str) -> int:
        start = time.perf_counter()
        try:
            count = await self.metadata_db.receipts.count_documents(
                {"user_id": user_id},
                hint="idx_user_id",
            )
        except Exception:
            count = await self.metadata_db.receipts.count_documents({"user_id": user_id})
        elapsed_ms = (time.perf_counter() - start) * 1000
        log_to_elastic(
            "INFO",
            f"count_receipts user={user_id} count={count} latency_ms={elapsed_ms:.2f}",
            "InsightsDashboard",
        )
        return count

    async def list_receipts(
        self,
        user_id: str,
        limit: int = DEFAULT_PAGE_SIZE,
        cursor: str | None = None,
    ) -> tuple[list[dict], str | None, bool]:
        limit = max(1, min(limit, MAX_PAGE_SIZE))
        query: dict = {"user_id": user_id}
        if cursor:
            query.update(build_keyset_filter(decode_cursor(cursor)))

        start = time.perf_counter()
        cursor_db = (
            self.metadata_db.receipts.find(query, SLIM_RECEIPT_PROJECTION)
            .sort([("created_at", -1), ("_id", -1)])
            .limit(limit + 1)
        )
        docs = await cursor_db.to_list(length=limit + 1)
        elapsed_ms = (time.perf_counter() - start) * 1000

        has_more = len(docs) > limit
        page_docs = docs[:limit]
        items = [doc_to_summary(doc) for doc in page_docs]

        next_cursor = None
        if has_more and page_docs:
            last = page_docs[-1]
            created_at = last.get("created_at") or datetime.now(timezone.utc)
            next_cursor = encode_cursor(created_at, str(last["_id"]))

        log_to_elastic(
            "INFO",
            f"list_receipts user={user_id} limit={limit} returned={len(items)} "
            f"has_more={has_more} latency_ms={elapsed_ms:.2f}",
            "InsightsDashboard",
        )
        return items, next_cursor, has_more

    async def get_receipt_detail(self, user_id: str, receipt_id: str) -> dict | None:
        receipt = await self.metadata_db.receipts.find_one(
            {"_id": receipt_id, "user_id": user_id}
        )
        if not receipt:
            return None
        summary = doc_to_summary(receipt)
        summary["items"] = receipt.get("items") or []
        return summary

    async def get_thumbnail_stream(self, user_id: str, file_id: str) -> dict | None:
        try:
            file_doc = await self.client[settings.GRIDFS_DB_NAME]["fs.files"].find_one(
                {"_id": ObjectId(file_id), "metadata.user_id": user_id}
            )
            if not file_doc:
                return None

            grid_out = await self.gridfs_bucket.open_download_stream(ObjectId(file_id))
            data = await grid_out.read()
            content_type = "application/octet-stream"
            if grid_out.metadata and grid_out.metadata.get("contentType"):
                content_type = grid_out.metadata["contentType"]
            elif getattr(grid_out, "content_type", None):
                content_type = grid_out.content_type
            return {"data": data, "content_type": content_type}
        except Exception as e:
            log_to_elastic("WARNING", f"Thumbnail not found file_id={file_id}: {e}", "InsightsDashboard")
            return None

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

            receipt = await self.scan_db.scans.find_one({"file_id": file_id})
            if receipt:
                receipt["_id"] = str(receipt["_id"])
            return receipt
        except Exception as e:
            log_to_elastic("ERROR", f"Failed to fetch receipt for file_id {file_id}: {e}", "InsightsDashboard")
            return None

    async def search_receipts(self, user_id: str, category: str = None, store: str = None) -> list:
        """Search receipts by user_id, category, and store name (slim projection)."""
        query = {"user_id": user_id}
        if category:
            query["items.category"] = {"$regex": category, "$options": "i"}
        if store:
            query["store"] = {"$regex": store, "$options": "i"}

        try:
            cursor = (
                self.metadata_db.receipts.find(query, SLIM_RECEIPT_PROJECTION)
                .sort([("created_at", -1), ("_id", -1)])
                .limit(100)
            )
            receipts = await cursor.to_list(length=100)
            return [doc_to_summary(r) for r in receipts]
        except Exception as e:
            log_to_elastic("ERROR", f"Failed to search receipts for user {user_id}: {e}", "InsightsDashboard")
            return []


# Singleton instance
mongo_service = MongoService()
