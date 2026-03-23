import json
import logging
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from elasticsearch import AsyncElasticsearch
from aiokafka import AIOKafkaConsumer

from app.core.config import settings

logger = logging.getLogger(__name__)

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
                logger.info("Connected to MongoDB successfully.")
                break
            except Exception as e:
                logger.error(f"Failed to connect to MongoDB: {e}. Retrying in 5 seconds...")
                await asyncio.sleep(5)

    async def _connect_es(self):
        self.es_client = AsyncElasticsearch(settings.elasticsearch_url)
        while True:
            try:
                if await self.es_client.ping():
                    logger.info("Connected to Elasticsearch successfully.")
                    if not await self.es_client.indices.exists(index="receipt_items"):
                        await self.es_client.indices.create(index="receipt_items")
                    break
                else:
                    logger.error("Failed to connect to Elasticsearch (ping returned False). Retrying in 5 seconds...")
                    await asyncio.sleep(5)
            except Exception as e:
                logger.error(f"Error connecting to Elasticsearch: {e}. Retrying in 5 seconds...")
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
            logger.info("MongoDB client closed.")
        if self.es_client:
            await self.es_client.close()
            logger.info("Elasticsearch client closed.")
