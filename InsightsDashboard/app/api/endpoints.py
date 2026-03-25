from fastapi import APIRouter, Depends, Query, Header, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional
import base64
from io import BytesIO

from app.services.elastic_service import ElasticService
from app.services.mongo_service import mongo_service
from app.schemas import (
    CategoryStats,
    MonthlyTrend,
    StoreStats,
    PaymentMethodStats,
    SearchResponse,
    SpendingByMonthStore,
    UserBenchmarkResponse
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

@router.get("/stats/user-benchmark", response_model=UserBenchmarkResponse)
async def user_benchmark(
    user_id: str = Depends(get_user_id),
    es_service: ElasticService = Depends(get_elastic_service)
):
    return await es_service.get_user_benchmark(user_id)

@router.get("/receipts/recent")
async def get_recent_receipts(
    user_id: str = Depends(get_user_id),
):
    """Fetch the latest complete receipts for the user from MongoDB."""
    cursor = mongo_service.metadata_db.receipts.find({"user_id": user_id}).sort("purchase_date", -1).limit(20)
    receipts = await cursor.to_list(length=20)
    for r in receipts:
        r["_id"] = str(r["_id"])
    return {"items": receipts}

@router.get("/receipts/images")
async def get_receipt_images(
    user_id: str = Depends(get_user_id),
):
    """
    Retrieve the latest 5 receipt images from GridFS for the authenticated user.
    
    Flow:
    1. Query metadata_db.receipts for the 5 most recent documents with files matching user_id
    2. Extract file_id from each matching receipt
    3. Fetch binary image data from files_db GridFS
    4. Return as StreamingResponse (single) or base64 JSON list (multiple)
    """
    # 1. Query metadata_db for matching receipts
    receipts = await mongo_service.find_recent_receipts_with_files(
        user_id=user_id,
        limit=5
    )

    if not receipts:
        raise HTTPException(status_code=404, detail="No receipts found for the given filters")

    # 2. Collect file_ids
    file_ids = [r["file_id"] for r in receipts if r.get("file_id")]

    if not file_ids:
        raise HTTPException(status_code=404, detail="Matching receipts found but none have an associated image file")

    # 3. Fetch files from GridFS
    images = []
    for fid in file_ids:
        file_data = await mongo_service.get_file(fid)
        if file_data:
            images.append(file_data)

    if not images:
        raise HTTPException(status_code=404, detail="Image files not found in GridFS")

    # 4. Return the images
    if len(images) == 1:
        img = images[0]
        return StreamingResponse(
            BytesIO(img["data"]),
            media_type=img["content_type"],
            headers={"Content-Disposition": f'inline; filename="{img["filename"]}"'},
        )

    # Multiple images → JSON with base64-encoded data
    result = [
        {
            "filename": img["filename"],
            "content_type": img["content_type"],
            "data_base64": base64.b64encode(img["data"]).decode("utf-8"),
        }
        for img in images
    ]
    return {"images": result, "count": len(result)}
