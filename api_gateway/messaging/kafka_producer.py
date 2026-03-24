import os
from confluent_kafka import Producer
import json

class KafkaProducerHelper:
    def __init__(self, bootstrap_servers=None):
        if bootstrap_servers is None:
            bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:29092")
        self.producer = Producer({'bootstrap.servers': bootstrap_servers})

    def send_message(self, topic: str, message: dict):
        self.producer.produce(
            topic, 
            value=json.dumps(message).encode('utf-8'),
            callback=self.delivery_report
        )
        self.producer.flush()

    @staticmethod
    def delivery_report(err, msg):
        if err is not None:
            print(f"❌ Message delivery failed: {err}")
        else:
            print(f"✅ Message delivered successfully to topic '{msg.topic()}' [partition {msg.partition()}] at offset {msg.offset()}")
            print(f"   Payload received: {msg.value().decode('utf-8')}")


kafka_helper = KafkaProducerHelper()
