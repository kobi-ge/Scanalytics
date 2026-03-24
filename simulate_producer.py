import asyncio
import json
import uuid
import random
from datetime import datetime
from aiokafka import AIOKafkaProducer

# Use localhost:29092 since we are running this script outside of the docker network
KAFKA_BOOTSTRAP_SERVERS = "localhost:29092"
KAFKA_TOPIC = "data"

STORES = ["Super-Pharm", "Shufersal", "Rami Levy", "KSP", "Ivory", "Tiv Taam"]
ITEMS = ["Milk", "Bread", "Eggs", "Laptop", "Mouse", "Keyboard", "Shampoo", "Toothpaste", "Coffee", "Tea"]

async def send_messages():
    producer = AIOKafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode("utf-8")
    )
    
    # Start the producer
    await producer.start()
    print(f"✅ Producer started and connected to Kafka at {KAFKA_BOOTSTRAP_SERVERS}")
    
    try:
        count = 1
        while True:
            # Generate random receipt data simulating real flow
            receipt_id = f"receipt-{uuid.uuid4().hex[:8]}"
            num_items = random.randint(1, 6)
            
            items = []
            total_price = 0.0
            
            for _ in range(num_items):
                item_name = random.choice(ITEMS)
                price = round(random.uniform(10.0, 200.0), 2)
                quantity = random.randint(1, 4)
                total_price += price * quantity
                
                items.append({
                    "name": item_name,
                    "quantity": quantity,
                    "price": price,
                    "category": random.choice(["חשמל", "כלי בית", "מזון", "פארמה", "אחר"])
                })
            
            receipt = {
                "payment_method": random.choice(["Visa", "MasterCard", "Cash", "Bit"]),
                "receipt_id": receipt_id,
                "store": random.choice(STORES),
                "purchase_date": datetime.utcnow().strftime("%Y-%m-%d"),
                "total_price": round(total_price, 2),
                "items": items
            }
            
            print(f"[{count}] Sending receipt {receipt_id} (Amount: {receipt['total_price']}, Items: {num_items}) -> Topic: {KAFKA_TOPIC}")
            # print(json.dumps(receipt, indent=2))
            
            # Send message to Kafka
            await producer.send_and_wait(KAFKA_TOPIC, value=receipt)
            count += 1
            
            # Wait a bit before sending the next one to simulate real traffic
            sleep_time = random.uniform(0.5, 2.5)
            await asyncio.sleep(sleep_time)
            
    except asyncio.CancelledError:
        print("⚠️ Simulation stopped.")
    except Exception as e:
        print(f"❌ Error occurred: {e}")
    finally:
        # Wait for all pending messages to be delivered or expire.
        await producer.stop()
        print("🛑 Producer stopped.")

if __name__ == "__main__":
    print("🚀 Starting Simulation Producer...")
    print("Press Ctrl+C to stop the simulation.")
    try:
        asyncio.run(send_messages())
    except KeyboardInterrupt:
        print("\n⏹️ Interrupted by user.")
