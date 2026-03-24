import os
from elasticsearch import Elasticsearch
from pprint import pprint
# from dotenv import load_dotenv, find_dotenv

# Load env variables for standalone execution
# load_dotenv(find_dotenv())

def fetch_logs():
    es_url = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
    es = Elasticsearch([es_url])
    print("--- LAST 20 LOGS ---")
    try:
        response = es.search(
            index="receipt_items",
            query={"match_all": {}},
            size=100
        )
        
        for hit in reversed(response['hits']['hits']):
            src = hit['_source']
            time_str = src.get('timestamp', '')[:19].replace('T', ' ')
            pprint(f"{time_str} | {src.get('level')} | {src.get('service_name')} | {src.get('message')}")
            
    except Exception as e:
        print("Failed to fetch logs:", e)

if __name__ == "__main__":
    fetch_logs()
