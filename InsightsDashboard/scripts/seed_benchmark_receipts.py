"""Seed synthetic receipts for pagination benchmarks."""
import argparse
import asyncio
import os
import uuid
from datetime import datetime, timedelta, timezone

from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
METADATA_DB = os.getenv("MONGO_METADATA_DB", "metadata_db")


async def seed(user_id: str, count: int) -> None:
    client = AsyncIOMotorClient(MONGO_URI)
    collection = client[METADATA_DB]["receipts"]
    base_time = datetime.now(timezone.utc)

    for i in range(count):
        created_at = base_time - timedelta(minutes=i)
        receipt_id = f"bench-{uuid.uuid4().hex[:8]}"
        doc_id = f"{user_id}_{receipt_id}"
        await collection.replace_one(
            {"_id": doc_id},
            {
                "_id": doc_id,
                "user_id": user_id,
                "receipt_id": receipt_id,
                "store": f"Bench Store {i % 20}",
                "purchase_date": created_at.strftime("%Y-%m-%d"),
                "total_price": float(10 + (i % 50)),
                "payment_method": "Visa",
                "item_count": 3,
                "created_at": created_at,
                "items": [
                    {"name": "Item A", "quantity": 1, "price": 5.0, "category": "General"},
                    {"name": "Item B", "quantity": 2, "price": 2.5, "category": "General"},
                ],
            },
            upsert=True,
        )

    print(f"Seeded {count} receipts for user_id={user_id}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--user-id", required=True)
    parser.add_argument("--count", type=int, default=500)
    args = parser.parse_args()
    asyncio.run(seed(args.user_id, args.count))


if __name__ == "__main__":
    main()
