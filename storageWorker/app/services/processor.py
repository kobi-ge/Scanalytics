from app.logger.logger import log_to_elastic
from app.services.mongo_service import MongoService
from app.services.es_service import ElasticsearchService


class StorageProcessor:
    def __init__(self, mongo_service: MongoService, es_service: ElasticsearchService):
        self.mongo_service = mongo_service
        self.es_service = es_service

    async def process_message(self, data: dict):
        receipt_id = data.get("receipt_id")
        if not receipt_id:
            log_to_elastic("WARNING", "No receipt_id found in message. Skipping.", "storageWorker")
            return

        # 1. Save full JSON to MongoDB (Collection: receipts)
        await self.mongo_service.save_receipt(receipt_id, data)

        # 2. Flatten the items list and save to Elasticsearch
        await self.es_service.save_receipt_items(receipt_id, data)
