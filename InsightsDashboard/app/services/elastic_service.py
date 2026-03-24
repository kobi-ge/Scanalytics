import logging
from elasticsearch import AsyncElasticsearch
from elasticsearch.exceptions import NotFoundError, ConnectionError
from fastapi import HTTPException
from app.core.config import settings
from app.schemas import SearchItemBase

logger = logging.getLogger(__name__)

class ElasticService:
    def __init__(self):
        self.es = AsyncElasticsearch(hosts=[settings.ES_HOST])
        self.index = settings.ES_INDEX

    async def get_category_distribution(self):
        query = {
            "size": 0,
            "aggs": {
                "categories": {
                    "terms": {"field": "category.keyword", "size": 1000},
                    "aggs": {
                        "total_price": {"sum": {"field": "price"}}
                    }
                }
            }
        }
        try:
            response = await self.es.search(index=self.index, body=query)
            buckets = response["aggregations"]["categories"]["buckets"]
            return [{"category": b["key"], "total_price": b["total_price"]["value"]} for b in buckets]
        except NotFoundError:
            raise HTTPException(status_code=404, detail=f"Index '{self.index}' not found")
        except ConnectionError:
            raise HTTPException(status_code=503, detail="Elasticsearch connection error")
        except Exception as e:
            logger.error(f"Error querying ES: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_monthly_trends(self):
        query = {
            "size": 0,
            "aggs": {
                "monthly": {
                    "date_histogram": {
                        "field": "purchase_date",
                        "calendar_interval": "month",
                        "format": "yyyy-MM"
                    },
                    "aggs": {
                        "total_spending": {"sum": {"field": "price"}}
                    }
                }
            }
        }
        try:
            response = await self.es.search(index=self.index, body=query)
            buckets = response["aggregations"]["monthly"]["buckets"]
            return [{"month": b["key_as_string"], "total_spending": b["total_spending"]["value"]} for b in buckets]
        except NotFoundError:
            raise HTTPException(status_code=404, detail="Index not found")
        except ConnectionError:
            raise HTTPException(status_code=503, detail="Elasticsearch connection error")
        except Exception as e:
            logger.error(f"Error querying ES: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_top_stores(self):
        query = {
            "size": 0,
            "aggs": {
                "stores": {
                    "terms": {"field": "store.keyword", "size": 100},
                    "aggs": {
                        "total_spending": {"sum": {"field": "price"}},
                        "visit_count": {"cardinality": {"field": "receipt_id.keyword"}}
                    }
                }
            }
        }
        try:
            response = await self.es.search(index=self.index, body=query)
            buckets = response["aggregations"]["stores"]["buckets"]
            return [
                {
                    "store": b["key"],
                    "total_spending": b["total_spending"]["value"],
                    "visit_count": b["visit_count"]["value"],
                    "product_count": b["doc_count"]
                } for b in buckets
            ]
        except NotFoundError:
            raise HTTPException(status_code=404, detail="Index not found")
        except ConnectionError:
            raise HTTPException(status_code=503, detail="Elasticsearch connection error")
        except Exception as e:
            logger.error(f"Error querying ES: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_payment_methods(self):
        query = {
            "size": 0,
            "aggs": {
                "methods": {
                    "terms": {"field": "payment_method.keyword", "size": 100},
                    "aggs": {
                        "total_spending": {"sum": {"field": "price"}}
                    }
                }
            }
        }
        try:
            response = await self.es.search(index=self.index, body=query)
            buckets = response["aggregations"]["methods"]["buckets"]
            return [{"payment_method": b["key"], "total_spending": b["total_spending"]["value"]} for b in buckets]
        except NotFoundError:
            raise HTTPException(status_code=404, detail="Index not found")
        except ConnectionError:
            raise HTTPException(status_code=503, detail="Elasticsearch connection error")
        except Exception as e:
            logger.error(f"Error querying ES: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def search_items(self, query: str = None, category: str = None):
        must_clauses = []
        if query:
            must_clauses.append({
                "multi_match": {
                    "query": query,
                    "fields": ["name", "store"]
                }
            })
        if category:
            must_clauses.append({
                "term": {"category.keyword": category}
            })
            
        search_body = {
            "query": {
                "bool": {
                    "must": must_clauses if must_clauses else [{"match_all": {}}]
                }
            },
            "size": 100
        }
        
        try:
            response = await self.es.search(index=self.index, body=search_body)
            hits = response["hits"]["hits"]
            items = []
            for hit in hits:
                source = hit["_source"]
                items.append(SearchItemBase(**source))
            return {"items": items}
        except NotFoundError:
            raise HTTPException(status_code=404, detail="Index not found")
        except ConnectionError:
            raise HTTPException(status_code=503, detail="Elasticsearch connection error")
        except Exception as e:
            logger.error(f"Error querying ES: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")
