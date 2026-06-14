from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, models
from ..database import get_db
from ..utils.auth import get_current_user

router = APIRouter()

@router.get("/transactions/{user_id}", response_model=List[schemas.TransactionResponse])
def get_transactions(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Enforce database integrity: only authenticated user can access their own transactions
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot view another user's transactions"
        )
        
    transactions = db.query(models.Transaction).filter(
        models.Transaction.user_id == user_id
    ).order_by(models.Transaction.created_at.desc()).all()
    return transactions

@router.get("/transactions/user/{user_id}", response_model=List[schemas.TransactionResponse])
def get_transactions_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Enforce database integrity: only authenticated user can access their own transactions
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot view another user's transactions"
        )
        
    transactions = db.query(models.Transaction).filter(
        models.Transaction.user_id == user_id
    ).order_by(models.Transaction.created_at.desc()).all()
    return transactions
