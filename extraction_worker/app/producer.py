import json

from confluent_kafka import Producer

class KafkaProducer:
    def __init__(self, host, port, logger):
        self.host = host
        self.port = port
        self.config = {
            "bootstrap.servers": f"{self.host}:{self.port}"
        }
        self.logger = logger

    def init_producer(self):
        try:
            self.producer = Producer(self.config)
            self.logger.info(f"producer created successfully")
        except Exception as e:
            self.logger.eror(f"error creating producer")

    def delivery_report(self, err, msg):
        if err:
            print(f"❌ Delivery failed: {err}")
        else:
            print(f"✅ Delivered {msg.value().decode('utf-8')}")
            print(f"✅ Delivered to {msg.topic()} : partition {msg.partition()} : at offset {msg.offset()}")

    def produce(self, data):
        try:
            value = json.dumps(data).encode("utf-8")
            self.producer.produce(
                topic="data",
                value=value,
                callback=self.delivery_report
            )
            self.producer.flush()
            self.logger.info(f"data: {data} was sent to topic data")
        except Exception as e:
            self.logger.error(f"error sending data to topic data")
            
