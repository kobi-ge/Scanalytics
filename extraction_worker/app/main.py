import logging

from consumer import KafkaConsumer
from utils import extract_file_id
from mongo_connection import MongoConnection
from producer import KafkaProducer
from ocr import parse_to_json


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

consumer_instance = KafkaConsumer(logger)
producer_instance = KafkaProducer(logger)
mongo_instance = MongoConnection(logger)

def main():
    producer_instance.init_producer()
    consumer_instance.init_consumer()
    mongo_instance.connect()
    mongo_instance.create_collection()
    
    try:
        while True:
            msg = consumer_instance.consume()
            if msg is None:
                continue
            file_id = extract_file_id(msg)
            if not file_id:
                logger.warning(f"Could not extract file_id from message: {msg}. Skipping.")
                continue
            image_bytes = mongo_instance.get_from_gridfs(file_id)
            parsed_data = parse_to_json(image_bytes)
            print(f"\n✅ OCR Processing Finished! Parsed Data: \n{parsed_data}\n")
            producer_instance.produce(parsed_data)
    except KeyboardInterrupt:
        print("\n🔴 Stopping main worker gracefully...")



if __name__ == "__main__":
    main()
