from pydantic import BaseModel
from typing import List, Optional

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
