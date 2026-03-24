from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class Item(BaseModel):
    name: Optional[str] = None
    quantity: Optional[int] = None
    price: Optional[float] = None
    category: Optional[str] = None

class Receipt(BaseModel):
    model_config = ConfigDict(extra='allow')
    user_id: str
    file_id: Optional[str] = None
    payment_method: Optional[str] = None
    receipt_id: Optional[str] = None
    store: Optional[str] = None
    purchase_date: Optional[str] = None
    total_price: Optional[float] = None
    items: List[Item] = []
