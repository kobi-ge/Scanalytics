
## 📊 Data Structures (Schemas)

### 1. MongoDB Schema (Nested)

This is the original structure containing all receipt details and items in a single nested object.

{
  "user_id": 123,
  "payment_method": "Visa",
  "receipt_id": "12345",
  "store": "Walmart",
  "purchase_date": "2024-03-20",
  "total_price": 4500,
  "items": [
    { "name": "Samsung Refrigerator", "quantity": 1, "price": 4000, "category": "Electronics & Gadgets" },
    { "name": "Electric Kettle", "quantity": 1, "price": 500, "category": "Home & Furniture" }
  ]
}


### 2. Elasticsearch Schema (Flattened)

[
  {
    "user_id": 123,
    "payment_method": "Visa",
    "receipt_id": "12345",
    "store": "Walmart",
    "purchase_date": "2024-03-20",
    "total_price": 4500,
    "name": "Samsung Refrigerator",
    "quantity": 1,
    "price": 4000,
    "category": "Electronics & Gadgets"
  }
]

Component | Name / ID | Description
---|---|---
MongoDB GridFS | files_db | Storage for source image files and nested raw data.
MongoDB | metadata_db | Persistent storage for processed receipt metadata.
Elasticsearch | app-logs | System logs indexing for diagnostics.
Elasticsearch | receipt_items | Flattened item indexing for high-performance analytics.
Kafka Topic | Images | Pipeline for raw receipt image file transfers.
Kafka Topic | Data | Pipeline for processed JSON data integration.


# Database Connections
MONGO_URI=mongodb://localhost:27017
ELASTICSEARCH_URL=http://localhost:9200


# Message Broker
KAFKA_BOOTSTRAP_SERVERS=localhost:29092
