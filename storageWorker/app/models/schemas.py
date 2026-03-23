from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any

class Receipt(BaseModel):
    model_config = ConfigDict(extra='allow')
    receipt_id: str
    items: List[Dict[str, Any]] = []
