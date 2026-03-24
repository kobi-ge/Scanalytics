from app.logger.logger import log_to_elastic
from elasticsearch import AsyncElasticsearch, helpers


class ElasticsearchService:
    def __init__(self, es_client: AsyncElasticsearch):
        self.es_client = es_client

    async def save_receipt_items(self, receipt_id: str, data: dict):
        items = data.get("items", [])
        if not items:
            return

        actions = []
        # Each item must include all parent receipt fields.
        parent_fields = {k: v for k, v in data.items() if k not in ("items", "_id")}

        for index, item in enumerate(items):
            doc = {**parent_fields, **item}
            # Use a composite ID for ES to prevent duplicates on retry
            doc_id = f"{receipt_id}_{index}"
            actions.append({
                "_op_type": "index",
                "_index": "receipt_items",
                "_id": doc_id,
                "_source": doc
            })
            
        try:
            await helpers.async_bulk(self.es_client, actions)
            log_to_elastic("INFO", f"Saved {len(actions)} items to Elasticsearch for receipt {receipt_id}.", "storageWorker")
        except Exception as e:
            log_to_elastic("ERROR", f"Error saving to Elasticsearch: {e}", "storageWorker")
            raise
