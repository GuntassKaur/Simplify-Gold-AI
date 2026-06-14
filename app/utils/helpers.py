import requests
import logging

logger = logging.getLogger(__name__)

# Constants
TROY_OUNCE_TO_GRAM = 31.1035
FALLBACK_GOLD_PRICE_INR = 9800.0  # fallback ₹ per gram


def get_live_usd_to_inr() -> float:
    """Fetch live USD to INR conversion rate from a free public API."""
    try:
        response = requests.get(
            "https://open.er-api.com/v6/latest/USD",
            timeout=5
        )
        data = response.json()
        if data.get("result") == "success":
            return float(data["rates"]["INR"])
    except Exception as e:
        logger.warning(f"USD/INR fetch failed: {e}")
    return 83.5  # fallback rate


def get_current_gold_price() -> float:
    """
    Fetch live gold price in INR per gram using Yahoo Finance (no API key needed).
    Gold futures ticker: GC=F (USD per troy ounce)
    Converts: USD/oz → INR/gram
    Falls back to ₹9800/gram if any error occurs.
    """
    try:
        import yfinance as yf
        ticker = yf.Ticker("GC=F")
        hist = ticker.history(period="1d")
        if not hist.empty:
            gold_usd_per_oz = float(hist["Close"].iloc[-1])
            usd_to_inr = get_live_usd_to_inr()
            gold_inr_per_gram = (gold_usd_per_oz / TROY_OUNCE_TO_GRAM) * usd_to_inr
            price = round(gold_inr_per_gram, 2)
            logger.info(f"Live gold price fetched: ₹{price}/gram (${gold_usd_per_oz}/oz × {usd_to_inr} INR/USD)")
            return price
    except Exception as e:
        logger.warning(f"Live gold price fetch failed, using fallback: {e}")
    return FALLBACK_GOLD_PRICE_INR


def calculate_gold_quantity(amount: float, gold_price: float) -> float:
    if gold_price <= 0:
        return 0.0
    return round(amount / gold_price, 4)
