from ..services.gold_price_service import get_current_gold_price

def calculate_gold_quantity(amount: float, gold_price: float) -> float:
    if gold_price <= 0:
        return 0.0
    return round(amount / gold_price, 4)
