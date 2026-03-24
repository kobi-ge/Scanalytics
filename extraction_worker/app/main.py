import logging

from consumer import KafkaConsumer
from utils import extract_metadata
from mongo_connection import MongoConnection
from producer import KafkaProducer
from ocr import parse_to_json
from logger import log_to_elastic




consumer_instance = KafkaConsumer(log_to_elastic)
producer_instance = KafkaProducer(log_to_elastic)
mongo_instance = MongoConnection(log_to_elastic)

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
                
            file_id, user_id = extract_metadata(msg)
            if not file_id:
                log_to_elastic("warning", f"Could not extract metadata from message: {msg}. Skipping.")
                continue
                
            image_bytes = mongo_instance.get_from_gridfs(file_id)
            if not image_bytes:
                log_to_elastic("error", f"Failed to fetch image bytes for file_id: {file_id}. Skipping.")
                continue
                
            parsed_data = parse_to_json(image_bytes)
            
            if parsed_data is not None:
                parsed_data["user_id"] = user_id
                parsed_data["file_id"] = file_id
                
            log_to_elastic("info", f"\n✅ OCR Processing Finished! Parsed Data: \n{parsed_data}\n")
            producer_instance.produce(parsed_data)
    except KeyboardInterrupt:
        log_to_elastic("info", "\n🔴 Stopping main worker gracefully...")



if __name__ == "__main__":
    main()
