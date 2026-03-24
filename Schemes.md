

## 📊 מבני נתונים (Schemas)

### 1. MongoDB Schema (Nested)

זהו המבנה המקורי המכיל את כל פרטי הקבלה והפריטים תחת מערך אחד.

{
    "user_id": 123,
  "payment_method": "Visa",
  "receipt_id": "12345",
  "store": "מחסני חשמל",
  "purchase_date": "2024-03-20",
  "total_price": 4500,
  "items": [
    { "name": "מקרר סמסונג", "quantity": 1, "price": 4000, "category": "חשמל" },
    { "name": "קומקום חשמלי", "quantity": 1, "price": 500, "category": "כלי בית" }
  ]
}


### 1. es Schema 

[
  {
    "user_id": 123
    "payment_method": "Visa",
    "receipt_id": "12345",
    "store": "מחסני חשמל",
    "purchase_date": "2024-03-20",
    "total_price": 4500,
    "name": "מקרר סמסונג",
    "quantity": 1,
    "price": 4000,
    "category": "חשמל"
  }
]

רכיב,שם / מזהה,תיאור
MongoDB GridFS, files_db,אחסון קבצי המקור והנתונים המקוננים.
Elasticsearch, app-logs,אינדוקס נתונים שטוחים (Flattened) לחיפוש מהיר.
Kafka Topic, Images,טופיק להעברת קבצי תמונת הקבלות.
Kafka Topic, data,טופיק להעברת נתוני ה-JSON המעובדים.


# Database Connections
MONGO_URI=mongodb://localhost:27017
ELASTICSEARCH_URL=http://localhost:9200


# Message Broker
KAFKA_BOOTSTRAP_SERVERS=localhost:29092
