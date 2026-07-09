from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.logger.logger import log_to_elastic


async def ensure_all_indexes() -> None:
    client = AsyncIOMotorClient(settings.MONGO_URI)
    metadata_db = client[settings.MONGO_METADATA_DB]
    files_db = client[settings.GRIDFS_DB_NAME]

    await metadata_db.receipts.create_index(
        [("user_id", 1), ("created_at", -1), ("_id", -1)],
        name="idx_user_created_id",
        background=True,
    )
    await metadata_db.receipts.create_index(
        [("user_id", 1)],
        name="idx_user_id",
        background=True,
    )
    await files_db["fs.files"].create_index(
        [("metadata.user_id", 1), ("uploadDate", -1)],
        name="idx_gridfs_user_upload",
        background=True,
    )
    log_to_elastic("INFO", "MongoDB indexes ensured for receipt pagination", "InsightsDashboard")
