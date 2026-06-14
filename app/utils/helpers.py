def get_current_gold_price() -> float:
    # In a real scenario, this would call an external API to get live gold prices.
    # For the assignment, we mock it.
    return 9800.0

def calculate_gold_quantity(amount: float, gold_price: float) -> float:
    if gold_price <= 0:
        return 0.0
    return round(amount / gold_price, 4)
