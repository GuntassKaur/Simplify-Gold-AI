from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas, models
from ..database import get_db
from ..services.gold_service import process_purchase

router = APIRouter()

@router.post("/purchase", response_model=schemas.PurchaseResponse)
def purchase_gold(request: schemas.PurchaseRequest, db: Session = Depends(get_db)):
    # Verify user exists
    user = db.query(models.User).filter(models.User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
        
    # Process Purchase
    return process_purchase(request, db)
