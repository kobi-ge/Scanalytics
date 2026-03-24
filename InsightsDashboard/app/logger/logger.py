import os
from elasticsearch import Elasticsearch
import datetime

# Connect to Elasticsearch using environment variable
es_url = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
es = Elasticsearch([es_url])

def log_to_elastic(level: str, message: str, service_name: str):
    log_entry = {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "level": level.upper(),
        "service_name": service_name,
        "message": message
    }
    
    try:
        es.index(index="app-logs", document=log_entry)
        # Also print to console for visibility
        print(f"[{level.upper()}] {message}")
    except Exception as e:
        print(f"Elastic logging failed: {e}")
