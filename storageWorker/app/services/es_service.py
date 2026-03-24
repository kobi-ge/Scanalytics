import logging
from elasticsearch import AsyncElasticsearch, helpers

logger = logging.getLogger(__name__)

class ElasticsearchService:
    def __init__(self, es_client: AsyncElasticsearch):
        self.es_client = es_client

    async def save_receipt_items(self, user_id: str, receipt_id: str, data: dict):
        items = data.get("items", [])
        if not items:
            return

        actions = []
        # Each item must include all parent receipt fields.
        parent_fields = {k: v for k, v in data.items() if k not in ("items", "_id")}

        for index, item in enumerate(items):
            doc = {**parent_fields, **item}
            # Use a composite ID for ES to prevent duplicates on retry
            doc_id = f"{user_id}_{receipt_id}_{index}"
            actions.append({
                "_op_type": "index",
                "_index": "receipt_items",
                "_id": doc_id,
                "_source": doc
            })
            
        try:
            await helpers.async_bulk(self.es_client, actions)
            logger.info(f"Saved {len(actions)} items to Elasticsearch for receipt {receipt_id} of user {user_id}.")
        except Exception as e:
            logger.error(f"Error saving to Elasticsearch: {e}")
            raise
