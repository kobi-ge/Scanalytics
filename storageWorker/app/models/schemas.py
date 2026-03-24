from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class Item(BaseModel):
    name: str
    quantity: int
    price: float
    category: str

class Receipt(BaseModel):
    model_config = ConfigDict(extra='allow')
    user_id: str
    file_id: Optional[str] = None
    payment_method: str
    receipt_id: str
    store: str
    purchase_date: str
    total_price: float
    items: List[Item] = []
