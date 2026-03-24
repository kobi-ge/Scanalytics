from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from app.services.elastic_service import ElasticService
from app.schemas import (
    CategoryStats,
    MonthlyTrend,
    StoreStats,
    PaymentMethodStats,
    SearchResponse
)

router = APIRouter()

def get_elastic_service():
    return ElasticService()

@router.get("/stats/category-distribution", response_model=List[CategoryStats])
async def category_distribution(es_service: ElasticService = Depends(get_elastic_service)):
    return await es_service.get_category_distribution()

@router.get("/stats/monthly-trends", response_model=List[MonthlyTrend])
async def monthly_trends(es_service: ElasticService = Depends(get_elastic_service)):
    return await es_service.get_monthly_trends()

@router.get("/stats/top-stores", response_model=List[StoreStats])
async def top_stores(es_service: ElasticService = Depends(get_elastic_service)):
    return await es_service.get_top_stores()

@router.get("/stats/payment-methods", response_model=List[PaymentMethodStats])
async def payment_methods(es_service: ElasticService = Depends(get_elastic_service)):
    return await es_service.get_payment_methods()

@router.get("/search/items", response_model=SearchResponse)
async def search_items(
    q: Optional[str] = Query(None, description="Search term for name and store"),
    category: Optional[str] = Query(None, description="Filter by category"),
    es_service: ElasticService = Depends(get_elastic_service)
):
    return await es_service.search_items(query=q, category=category)
