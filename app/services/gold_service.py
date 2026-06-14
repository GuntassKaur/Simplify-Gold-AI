import uuid
from sqlalchemy.orm import Session
from .. import models, schemas
from ..utils.helpers import get_current_gold_price, calculate_gold_quantity

def process_purchase(request: schemas.PurchaseRequest, db: Session) -> dict:
    gold_price = get_current_gold_price()
    gold_quantity = calculate_gold_quantity(request.amount, gold_price)
    
    # Generate Transaction ID
    transaction_id = f"TXN-{uuid.uuid4().hex[:8].upper()}"
    
    # Store Transaction
    new_txn = models.Transaction(
        transaction_id=transaction_id,
        user_id=request.user_id,
        amount=request.amount,
        gold_price=gold_price,
        gold_quantity=gold_quantity
    )
    
    db.add(new_txn)
    db.commit()
    db.refresh(new_txn)
    
    return {
        "transaction_id": transaction_id,
        "amount": request.amount,
        "gold_quantity": gold_quantity,
        "status": "SUCCESS"
    }
