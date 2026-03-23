from pydantic import BaseModel

class ManualEntryRequest(BaseModel):
    data: dict
