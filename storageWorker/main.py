import asyncio
import json
from app.logger.logger import log_to_elastic
from app.core.clients import ClientsManager
from app.services.processor import StorageProcessor
from app.services.mongo_service import MongoService
from app.services.es_service import ElasticsearchService
from app.models.schemas import Receipt
from pydantic import ValidationError
import signal


async def run_consumer_loop(consumer, processor):
    try:
        await consumer.start()
        log_to_elastic("INFO", "Kafka consumer started listening...", "storageWorker")
        async for msg in consumer:
            log_to_elastic("INFO", f"Received message: {msg.value}", "storageWorker")
            try:
                # Validating input schema
                receipt = Receipt(**msg.value)
                await processor.process_message(receipt.model_dump(exclude_none=True))
            except ValidationError as e:
                log_to_elastic("ERROR", f"Validation error: {e}", "storageWorker")
            except Exception as e:
                log_to_elastic("ERROR", f"Failed to process message: {e}", "storageWorker")
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
        log_to_elastic("INFO", "Graceful shutdown initiated...", "storageWorker")
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
        log_to_elastic("INFO", "Consumer task cancelled for shutdown.", "storageWorker")
    finally:
        await clients.close_all()
        log_to_elastic("INFO", "Clients closed successfully.", "storageWorker")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log_to_elastic("INFO", "Interrupted by user, shutting down.", "storageWorker")
