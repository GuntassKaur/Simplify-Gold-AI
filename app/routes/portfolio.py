from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..utils.auth import get_current_user
from ..services.gold_price_service import get_current_gold_price

router = APIRouter()

@router.get("/portfolio/{user_id}", response_model=schemas.PortfolioResponse)
def get_portfolio(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Enforce database integrity: only authenticated user can view their own portfolio
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot view another user's portfolio"
        )
        
    # Get all transactions for the user
    transactions = db.query(models.Transaction).filter(
        models.Transaction.user_id == user_id
    ).order_by(models.Transaction.created_at.desc()).all()
    
    total_invested = sum(t.amount for t in transactions)
    total_gold_quantity = sum(t.gold_quantity for t in transactions)
    
    current_price = get_current_gold_price()
    portfolio_value = round(total_gold_quantity * current_price, 2)
    
    return {
        "total_invested": round(total_invested, 2),
        "total_gold_quantity": round(total_gold_quantity, 4),
        "current_gold_price": current_price,
        "portfolio_value": portfolio_value,
        "transactions": transactions
    }
