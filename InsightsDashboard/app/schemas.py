from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class CategoryStats(BaseModel):
    category: str
    total_price: float

class MonthlyTrend(BaseModel):
    month: str
    total_spending: float

class StoreStats(BaseModel):
    store: str
    total_spending: float
    visit_count: int
    product_count: int

class PaymentMethodStats(BaseModel):
    payment_method: str
    total_spending: float

class SearchItemBase(BaseModel):
    receipt_id: str
    store: str
    purchase_date: str
    payment_method: str
    total_price: float
    name: str
    price: float
    category: str

class SearchResponse(BaseModel):
    items: List[SearchItemBase]

class StoreMonthSpending(BaseModel):
    store: str
    total: float

class SpendingByMonthStore(BaseModel):
    month: str
    stores: List[StoreMonthSpending]

class UserBenchmarkResponse(BaseModel):
    user_avg_item_price: float
    global_avg_item_price: float
    diff_percent: float
    status: str
    percentile_rank: int
    user_total_spending: Optional[float] = None
    top_category: Optional[str] = None
    user_top_category_avg: Optional[float] = None
    global_top_category_avg: Optional[float] = None


class ReceiptCountResponse(BaseModel):
    count: int


class ReceiptSummary(BaseModel):
    id: str
    receipt_id: Optional[str] = None
    file_id: Optional[str] = None
    store: Optional[str] = None
    purchase_date: Optional[str] = None
    total_price: Optional[float] = None
    payment_method: Optional[str] = None
    item_count: int = 0
    created_at: str
    has_image: bool = False


class ReceiptListResponse(BaseModel):
    items: List[ReceiptSummary]
    next_cursor: Optional[str] = None
    has_more: bool = False


class ReceiptDetail(ReceiptSummary):
    items: List[dict] = Field(default_factory=list)
