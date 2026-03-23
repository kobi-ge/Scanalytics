from pydantic import BaseModel, ConfigDict
from typing import List

class Item(BaseModel):
    name: str
    quantity: int
    price: float
    category: str

class Receipt(BaseModel):
    model_config = ConfigDict(extra='allow')
    payment_method: str
    receipt_id: str
    store: str
    purchase_date: str
    total_price: float
    items: List[Item] = []
