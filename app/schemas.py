from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: Optional[str] = None  # Optional for backward compatibility with old POST /api/users

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    name: str

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

# Portfolio Schemas
class PortfolioResponse(BaseModel):
    total_invested: float
    total_gold_quantity: float
    current_gold_price: float
    portfolio_value: float
    transactions: List[TransactionResponse]
