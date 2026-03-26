from app.logger.logger import log_to_elastic
from elasticsearch import AsyncElasticsearch
from elasticsearch.exceptions import NotFoundError, ConnectionError
from fastapi import HTTPException
from app.core.config import settings
from app.schemas import SearchItemBase


class ElasticService:
    def __init__(self):
        self.es = AsyncElasticsearch(hosts=[settings.ES_HOST])
        self.index = settings.ES_INDEX

    async def get_category_distribution(self, user_id: str):
        query = {
            "size": 0,
            "query": {
                "term": {"user_id.keyword": user_id}
            },
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
            aggs = response.get("aggregations", {})
            buckets = aggs.get("categories", {}).get("buckets", [])
            return [{"category": b["key"], "total_price": b.get("total_price", {}).get("value", 0.0)} for b in buckets]
        except NotFoundError:
            raise HTTPException(status_code=404, detail=f"Index '{self.index}' not found")
        except ConnectionError:
            raise HTTPException(status_code=503, detail="Elasticsearch connection error")
        except Exception as e:
            log_to_elastic("ERROR", f"Error querying ES: {e}", "InsightsDashboard")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_monthly_trends(self, user_id: str):
        query = {
            "size": 0,
            "query": {
                "term": {"user_id.keyword": user_id}
            },
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
            log_to_elastic("ERROR", f"Error querying ES: {e}", "InsightsDashboard")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_top_stores(self, user_id: str):
        query = {
            "size": 0,
            "query": {
                "term": {"user_id.keyword": user_id}
            },
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
            log_to_elastic("ERROR", f"Error querying ES: {e}", "InsightsDashboard")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_payment_methods(self, user_id: str):
        query = {
            "size": 0,
            "query": {
                "term": {"user_id.keyword": user_id}
            },
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
            log_to_elastic("ERROR", f"Error querying ES: {e}", "InsightsDashboard")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def search_items(self, user_id: str, query: str = None, category: str = None):
        must_clauses = [
            {"term": {"user_id.keyword": user_id}}
        ]
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
                    "must": must_clauses
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
            log_to_elastic("ERROR", f"Error querying ES: {e}", "InsightsDashboard")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_spending_by_month_and_store(self, user_id: str):
        query = {
            "size": 0,
            "query": {
                "term": {"user_id.keyword": user_id}
            },
            "aggs": {
                "monthly": {
                    "date_histogram": {
                        "field": "purchase_date",
                        "calendar_interval": "month",
                        "format": "yyyy-MM-dd"
                    },
                    "aggs": {
                        "stores": {
                            "terms": {"field": "store.keyword", "size": 100},
                            "aggs": {
                                "total_spending": {"sum": {"field": "price"}}
                            }
                        }
                    }
                }
            }
        }
        try:
            response = await self.es.search(index=self.index, body=query)
            aggs = response.get("aggregations", {})
            monthly_buckets = aggs.get("monthly", {}).get("buckets", [])
            
            result = []
            for m_bucket in monthly_buckets:
                month_str = m_bucket.get("key_as_string")
                if not month_str:
                    continue
                # Ensure it returns YYYY-MM-DD
                month_str = month_str[:10]
                
                stores_buckets = m_bucket.get("stores", {}).get("buckets", [])
                stores_list = [
                    {
                        "store": s_bucket["key"],
                        "total": s_bucket.get("total_spending", {}).get("value", 0.0)
                    }
                    for s_bucket in stores_buckets
                ]
                result.append({
                    "month": month_str,
                    "stores": stores_list
                })
            return result
        except NotFoundError:
            raise HTTPException(status_code=404, detail="Index not found")
        except ConnectionError:
            raise HTTPException(status_code=503, detail="Elasticsearch connection error")
        except Exception as e:
            log_to_elastic("ERROR", f"Error querying ES: {e}", "InsightsDashboard")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    async def get_user_benchmark(self, user_id: str):
        query = {
            "size": 0,
            "aggs": {
                "user_stats": {
                    "filter": {
                        "term": {"user_id.keyword": user_id}
                    },
                    "aggs": {
                        "user_avg_item_price": {"avg": {"field": "price"}},
                        "user_total_spending": {"sum": {"field": "price"}},
                        "top_category": {
                            "terms": {
                                "field": "category.keyword",
                                "size": 1,
                                "order": {"total_spending": "desc"}
                            },
                            "aggs": {
                                "total_spending": {"sum": {"field": "price"}},
                                "user_category_avg": {"avg": {"field": "price"}}
                            }
                        }
                    }
                },
                "global_stats": {
                    "global": {},
                    "aggs": {
                        "global_avg_item_price": {"avg": {"field": "price"}},
                        "user_averages": {
                            "terms": {"field": "user_id.keyword", "size": 10000},
                            "aggs": {
                                "avg_price": {"avg": {"field": "price"}}
                            }
                        },
                        "global_categories": {
                            "terms": {"field": "category.keyword", "size": 1000},
                            "aggs": {
                                "global_category_avg": {"avg": {"field": "price"}}
                            }
                        }
                    }
                }
            }
        }
        try:
            response = await self.es.search(index=self.index, body=query)
            aggs = response.get("aggregations", {})
            user_stats = aggs.get("user_stats", {})
            
            user_avg = user_stats.get("user_avg_item_price", {}).get("value")
            user_total = user_stats.get("user_total_spending", {}).get("value")
            
            global_stats = aggs.get("global_stats", {})
            global_avg = global_stats.get("global_avg_item_price", {}).get("value")
            
            if user_avg is None:
                user_avg = 0.0
            if global_avg is None:
                global_avg = 0.0
            if user_total is None:
                user_total = 0.0
                
            diff_percent = 0.0
            if global_avg > 0:
                diff_percent = round(((user_avg - global_avg) / global_avg) * 100, 1)
            
            if diff_percent > 0:
                status = "You spend more than the average"
            elif diff_percent < 0:
                status = "You spend less than the average"
            else:
                status = "You spend exactly the average"
                
            # Calculate percentile based on user averages (User-to-User)
            user_avg_buckets = global_stats.get("user_averages", {}).get("buckets", [])
            all_user_avgs = [b["avg_price"]["value"] for b in user_avg_buckets if b["avg_price"]["value"] is not None]
            rank = 0
            if all_user_avgs:
                # Count users whose spending is lower than the current user
                lower_than = sum(1 for avg in all_user_avgs if avg < user_avg)
                rank = int((lower_than / len(all_user_avgs)) * 100)
            
            result = {
                "user_avg_item_price": round(user_avg, 2),
                "global_avg_item_price": round(global_avg, 2),
                "diff_percent": diff_percent,
                "status": status,
                "percentile_rank": rank,
                "user_total_spending": round(user_total, 2)
            }
            
            top_category_buckets = user_stats.get("top_category", {}).get("buckets", [])
            if top_category_buckets:
                top_cat = top_category_buckets[0]
                cat_name = top_cat["key"]
                user_cat_avg = top_cat.get("user_category_avg", {}).get("value", 0.0)
                
                result["top_category"] = cat_name
                result["user_top_category_avg"] = round(user_cat_avg, 2)
                
                global_categories = global_stats.get("global_categories", {}).get("buckets", [])
                global_cat_avg = 0.0
                for g_cat in global_categories:
                    if g_cat["key"] == cat_name:
                        global_cat_avg = g_cat.get("global_category_avg", {}).get("value", 0.0)
                        break
                result["global_top_category_avg"] = round(global_cat_avg, 2)
                
            return result
        except NotFoundError:
            raise HTTPException(status_code=404, detail="Index not found")
        except ConnectionError:
            raise HTTPException(status_code=503, detail="Elasticsearch connection error")
        except Exception as e:
            log_to_elastic("ERROR", f"Error querying ES: {e}", "InsightsDashboard")
            raise HTTPException(status_code=500, detail="Internal Server Error")
