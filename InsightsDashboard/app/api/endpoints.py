from fastapi import APIRouter, Depends, Query, Header, HTTPException
from typing import List, Optional
from app.services.elastic_service import ElasticService
from app.schemas import (
    CategoryStats,
    MonthlyTrend,
    StoreStats,
    PaymentMethodStats,
    SearchResponse,
    SpendingByMonthStore
)

router = APIRouter()

def get_elastic_service():
    return ElasticService()

def get_user_id(x_user_id: Optional[str] = Header(default=None)) -> str:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header missing")
    return x_user_id

@router.get("/stats/category-distribution", response_model=List[CategoryStats])
async def category_distribution(
    user_id: str = Depends(get_user_id),
    es_service: ElasticService = Depends(get_elastic_service)
):
    return await es_service.get_category_distribution(user_id)

@router.get("/stats/monthly-trends", response_model=List[MonthlyTrend])
async def monthly_trends(
    user_id: str = Depends(get_user_id),
    es_service: ElasticService = Depends(get_elastic_service)
):
    return await es_service.get_monthly_trends(user_id)

@router.get("/stats/top-stores", response_model=List[StoreStats])
async def top_stores(
    user_id: str = Depends(get_user_id),
    es_service: ElasticService = Depends(get_elastic_service)
):
    return await es_service.get_top_stores(user_id)

@router.get("/stats/payment-methods", response_model=List[PaymentMethodStats])
async def payment_methods(
    user_id: str = Depends(get_user_id),
    es_service: ElasticService = Depends(get_elastic_service)
):
    return await es_service.get_payment_methods(user_id)

@router.get("/stats/spending-by-month-and-store", response_model=List[SpendingByMonthStore])
async def spending_by_month_and_store(
    user_id: str = Depends(get_user_id),
    es_service: ElasticService = Depends(get_elastic_service)
):
    return await es_service.get_spending_by_month_and_store(user_id)

@router.get("/search/items", response_model=SearchResponse)
async def search_items(
    q: Optional[str] = Query(None, description="Search term for name and store"),
    category: Optional[str] = Query(None, description="Filter by category"),
    user_id: str = Depends(get_user_id),
    es_service: ElasticService = Depends(get_elastic_service)
):
    return await es_service.search_items(user_id, query=q, category=category)
