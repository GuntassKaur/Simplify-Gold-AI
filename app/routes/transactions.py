from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, models
from ..database import get_db

router = APIRouter()

@router.get("/transactions/{user_id}", response_model=List[schemas.TransactionResponse])
def get_transactions(user_id: int, db: Session = Depends(get_db)):
    # Verify user exists
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    transactions = db.query(models.Transaction).filter(models.Transaction.user_id == user_id).order_by(models.Transaction.created_at.desc()).all()
    return transactions
