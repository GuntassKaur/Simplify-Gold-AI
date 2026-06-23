from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import schemas, models
from ..database import get_db
from ..services.gold_service import process_purchase
from ..utils.auth import get_current_user

router = APIRouter()

@router.post("/purchase", response_model=schemas.PurchaseResponse)
def purchase_gold(
    request: schemas.PurchaseRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Enforce database integrity: only authenticated user can buy for themselves
    if current_user.id != request.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot make purchases for another user"
        )
        
    if request.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than 0"
        )
        
    # Process Purchase
    return process_purchase(request, db)

@router.post("/sell", response_model=schemas.PurchaseResponse)
def sell_gold(
    request: schemas.PurchaseRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Enforce database integrity: only authenticated user can sell for themselves
    if current_user.id != request.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot sell gold for another user"
        )
        
    if request.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than 0"
        )
        
    try:
        from ..services.gold_service import process_sell
        return process_sell(request, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
