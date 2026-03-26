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
    # 1. Query GridFS fs.files directly by user_id metadata
    file_docs = await mongo_service.find_recent_files_by_user(
        user_id=user_id,
        limit=5
    )

    if not file_docs:
        raise HTTPException(status_code=404, detail="No receipt images found for this user")

    # 2. Fetch binary image data and associated receipt metadata
    images = []
    for doc in file_docs:
        fid = str(doc["_id"])
        file_data = await mongo_service.get_file(fid)
        receipt_data = await mongo_service.get_receipt_by_file_id(fid)
        
        if file_data:
            file_data["file_id"] = fid
            if receipt_data:
                file_data.update({
                    "items": receipt_data.get("items", []),
                    "store": receipt_data.get("store"),
                    "purchase_date": receipt_data.get("purchase_date"),
                    "total_price": receipt_data.get("total_price"),
                    "payment_method": receipt_data.get("payment_method"),
                })
            else:
                file_data["items"] = []
            images.append(file_data)

    if not images:
        raise HTTPException(status_code=404, detail="Image files not found in GridFS")

    # 3. Return all as base64 JSON (consistent format for the frontend)
    result = [
        {
            "file_id": img["file_id"],
            "filename": img["filename"],
            "content_type": img["content_type"],
            "data_base64": base64.b64encode(img["data"]).decode("utf-8"),
            "items": img.get("items", []),
            "store": img.get("store"),
            "purchase_date": img.get("purchase_date"),
            "total_price": img.get("total_price"),
            "payment_method": img.get("payment_method"),
        }
        for img in images
    ]
    return {"images": result, "count": len(result)}


@router.get("/receipts/search")
async def search_receipts(
    category: Optional[str] = Query(None),
    store: Optional[str] = Query(None),
    search_type: str = Query("data", regex="^(data|physical)$"),
    user_id: str = Depends(get_user_id),
):
    """
    Search receipts by category and/or store.
    - search_type=data: returns JSON receipt list.
    - search_type=physical: returns a binary file stream for the first match with a file.
    """
    receipts = await mongo_service.search_receipts(user_id, category, store)

    if not receipts:
        raise HTTPException(status_code=404, detail="No matching receipts found")

    if search_type == "data":
        return {"items": receipts}

    # Physical Receipt Mode: find first with file_id
    receipt_with_file = next((r for r in receipts if r.get("file_id")), None)
    
    if not receipt_with_file:
        # Check if we have records but no files
        if receipts:
            raise HTTPException(
                status_code=404, 
                detail="Data exists, but no physical scan is available."
            )
        raise HTTPException(status_code=404, detail="No physical scan found")

    file_id = receipt_with_file["file_id"]
    file_data = await mongo_service.get_file(file_id)
    
    if not file_data:
        raise HTTPException(status_code=404, detail="Physical scan found in metadata but missing in GridFS")

    from io import BytesIO
    return StreamingResponse(
        BytesIO(file_data["data"]),
        media_type=file_data["content_type"],
        headers={"Content-Disposition": f"inline; filename={file_data['filename']}"}
    )

@router.delete("/receipts/{receipt_id}")
async def delete_receipt(
    receipt_id: str,
    user_id: str = Depends(get_user_id),
    es_service: ElasticService = Depends(get_elastic_service)
):
    """
    Coordinated Full Wipe of a receipt and all its associated data.
    """
    # 1. Fetch metadata first to get all identifiers before we delete the record
    # This ensures we have the correct internal IDs for ES cleanup
    search_query = {"user_id": user_id}
    try:
        from bson import ObjectId
        search_query["_id"] = ObjectId(receipt_id)
    except:
        search_query["receipt_id"] = receipt_id

    receipt = await mongo_service.metadata_db.receipts.find_one(search_query)
    
    # Fallback to file_id if not found by primary IDs
    if not receipt:
        receipt = await mongo_service.metadata_db.receipts.find_one({"user_id": user_id, "file_id": receipt_id})

    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    # Collect all IDs for ES scrub
    meta_id = str(receipt["_id"])
    internal_receipt_id = receipt.get("receipt_id")
    file_id = receipt.get("file_id")

    # 2. Elasticsearch Clean up (scrub all line items)
    # We pass all possible ID mappings to ensure everything is removed
    await es_service.scrub_receipt_data(user_id, meta_id, internal_receipt_id, file_id)
    
    # 3. MongoDB and GridFS Clean up (actual removal)
    await mongo_service.delete_receipt(user_id, receipt_id)
    
    return {"message": "Receipt and all associated data successfully removed from the system"}
