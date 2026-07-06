import json
from app.logger.logger import log_to_elastic
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from elasticsearch import AsyncElasticsearch
from aiokafka import AIOKafkaConsumer

from app.core.config import settings


class ClientsManager:
    def __init__(self):
        self.mongo_client = None
        self.db = None
        self.es_client = None
        self.kafka_consumer = None

    async def connect_all(self):
        await asyncio.gather(
            self._connect_mongo(),
            self._connect_es()
        )
        self._init_kafka()

    async def _connect_mongo(self):
        while True:
            try:
                self.mongo_client = AsyncIOMotorClient(settings.mongo_uri, serverSelectionTimeoutMS=5000)
                await self.mongo_client.admin.command('ping')
                self.db = self.mongo_client[settings.mongo_db_name]
                log_to_elastic("INFO", "Connected to MongoDB successfully.", "storageWorker")
                break
            except Exception as e:
                log_to_elastic("ERROR", f"Failed to connect to MongoDB: {e}. Retrying in 5 seconds...", "storageWorker")
                await asyncio.sleep(5)

    async def _connect_es(self):
        self.es_client = AsyncElasticsearch(settings.elasticsearch_url)
        while True:
            try:
                if await self.es_client.ping():
                    log_to_elastic("INFO", f"Connected to Elasticsearch at {settings.elasticsearch_url} successfully.", "storageWorker")
                    # Ensure the configured index exists (use setting if present)
                    es_index = getattr(settings, 'ES_INDEX', 'receipt_items') if hasattr(settings, 'ES_INDEX') else 'receipt_items'
                    if not await self.es_client.indices.exists(index=es_index):
                        await self.es_client.indices.create(index=es_index)
                    break
                else:
                    log_to_elastic("ERROR", "Failed to connect to Elasticsearch (ping returned False). Retrying in 5 seconds...", "storageWorker")
                    await asyncio.sleep(5)
            except Exception as e:
                log_to_elastic("ERROR", f"Error connecting to Elasticsearch: {e}. Retrying in 5 seconds...", "storageWorker")
                await asyncio.sleep(5)

    def _init_kafka(self):
        self.kafka_consumer = AIOKafkaConsumer(
            settings.kafka_data_topic,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id=settings.kafka_consumer_group,
            value_deserializer=lambda x: json.loads(x.decode("utf-8")),
            auto_offset_reset="earliest"
        )

    async def close_all(self):
        if self.mongo_client:
            self.mongo_client.close()
            log_to_elastic("INFO", "MongoDB client closed.", "storageWorker")
        if self.es_client:
            await self.es_client.close()
            log_to_elastic("INFO", "Elasticsearch client closed.", "storageWorker")
