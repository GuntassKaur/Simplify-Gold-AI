from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Chat Schemas
class ChatRequest(BaseModel):
    user_id: int
    query: str

class ChatResponse(BaseModel):
    is_gold_related: bool
    answer: str
    nudge: Optional[str] = None
    action: Optional[str] = None

# Purchase Schemas
class PurchaseRequest(BaseModel):
    user_id: int
    amount: float

class PurchaseResponse(BaseModel):
    transaction_id: str
    amount: float
    gold_quantity: float
    status: str

# Transaction Schemas
class TransactionResponse(BaseModel):
    id: int
    transaction_id: str
    user_id: int
    amount: float
    gold_price: float
    gold_quantity: float
    created_at: datetime

    class Config:
        from_attributes = True
