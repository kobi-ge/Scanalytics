"""
One-time backfill for legacy receipts missing created_at / item_count.
Usage: python storageWorker/scripts/backfill_created_at.py
"""
import asyncio
import os
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient


MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
METADATA_DB = os.getenv("MONGO_METADATA_DB", "metadata_db")
GRIDFS_DB = os.getenv("GRIDFS_DB_NAME", "files_db")


async def derive_created_at(client, doc: dict) -> datetime:
    file_id = doc.get("file_id")
    if file_id:
        try:
            from bson import ObjectId

            file_doc = await client[GRIDFS_DB]["fs.files"].find_one({"_id": ObjectId(file_id)})
            if file_doc and file_doc.get("uploadDate"):
                upload_date = file_doc["uploadDate"]
                if upload_date.tzinfo is None:
                    upload_date = upload_date.replace(tzinfo=timezone.utc)
                return upload_date
        except Exception:
            pass

    purchase_date = doc.get("purchase_date")
    if purchase_date:
        try:
            return datetime.strptime(purchase_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            pass

    return datetime.now(timezone.utc)


async def main() -> None:
    client = AsyncIOMotorClient(MONGO_URI)
    collection = client[METADATA_DB]["receipts"]
    updated = 0

    async for doc in collection.find({}):
        changes = {}
        if not doc.get("created_at"):
            changes["created_at"] = await derive_created_at(client, doc)
        if doc.get("item_count") is None:
            changes["item_count"] = len(doc.get("items") or [])
        if changes:
            await collection.update_one({"_id": doc["_id"]}, {"$set": changes})
            updated += 1

    print(f"Backfill complete. Updated {updated} documents.")


if __name__ == "__main__":
    asyncio.run(main())
