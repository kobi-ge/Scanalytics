from pydantic import BaseModel
from typing import List

class ReceiptItem(BaseModel):
    name: str
    quantity: int
    price: float
    category: str

class ManualEntryRequest(BaseModel):
    user_id: int
    payment_method: str
    receipt_id: str
    store: str
    purchase_date: str
    total_price: float
    items: List[ReceiptItem]
