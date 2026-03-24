import asyncio
import json
import logging
from app.core.clients import ClientsManager
from app.services.processor import StorageProcessor
from app.services.mongo_service import MongoService
from app.services.es_service import ElasticsearchService
from app.models.schemas import Receipt
from pydantic import ValidationError
import signal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_consumer_loop(consumer, processor):
    try:
        await consumer.start()
        logger.info("Kafka consumer started listening...")
        async for msg in consumer:
            logger.info(f"Received message: {msg.value}")
            try:
                # Validating input schema
                receipt = Receipt(**msg.value)
                await processor.process_message(receipt.model_dump())
            except ValidationError as e:
                logger.error(f"Validation error: {e}")
            except Exception as e:
                logger.error(f"Failed to process message: {e}")
    finally:
        await consumer.stop()

async def main():
    clients = ClientsManager()
    
    # Establish resilient connections to DBs
    await clients.connect_all()

    mongo_service = MongoService(clients.db)
    es_service = ElasticsearchService(clients.es_client)
    processor = StorageProcessor(mongo_service, es_service)

    loop = asyncio.get_running_loop()
    
    task = asyncio.create_task(run_consumer_loop(clients.kafka_consumer, processor))

    def handle_shutdown():
        logger.info("Graceful shutdown initiated...")
        task.cancel()

    # Register signal handlers for graceful shutdown (Unix only, will skip on Windows if failed)
    try:
        loop.add_signal_handler(signal.SIGINT, handle_shutdown)
        loop.add_signal_handler(signal.SIGTERM, handle_shutdown)
    except NotImplementedError:
        pass

    try:
        await task
    except asyncio.CancelledError:
        logger.info("Consumer task cancelled for shutdown.")
    finally:
        await clients.close_all()
        logger.info("Clients closed successfully.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Interrupted by user, shutting down.")
