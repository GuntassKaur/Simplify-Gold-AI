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

def process_sell(request: schemas.PurchaseRequest, db: Session) -> dict:
    gold_price = get_current_gold_price()
    # Calculate quantity of gold corresponding to the sale amount
    gold_to_sell = round(request.amount / gold_price, 4) if gold_price > 0 else 0.0
    
    # Verify user has sufficient gold balance
    txns = db.query(models.Transaction).filter(models.Transaction.user_id == request.user_id).all()
    current_gold_balance = sum(t.gold_quantity for t in txns)
    
    if current_gold_balance < gold_to_sell:
        raise ValueError("Insufficient gold balance to complete this sale")
        
    # Generate Transaction ID
    transaction_id = f"TXN-SELL-{uuid.uuid4().hex[:8].upper()}"
    
    # Store Transaction (negative values to represent sale)
    new_txn = models.Transaction(
        transaction_id=transaction_id,
        user_id=request.user_id,
        amount=-request.amount,
        gold_price=gold_price,
        gold_quantity=-gold_to_sell
    )
    
    db.add(new_txn)
    db.commit()
    db.refresh(new_txn)
    
    return {
        "transaction_id": transaction_id,
        "amount": request.amount,
        "gold_quantity": gold_to_sell,
        "status": "SUCCESS"
    }
