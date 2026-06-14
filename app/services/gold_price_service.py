import requests
import logging
import time

logger = logging.getLogger(__name__)

TROY_OUNCE_TO_GRAM = 31.1035
FALLBACK_GOLD_PRICE_INR = 9800.0

# Memory Cache
_cached_price: float = None
_last_fetched_time: float = 0.0
CACHE_EXPIRY_SECONDS = 300  # 5 minutes cache expiry

def get_live_usd_to_inr() -> float:
    """Fetch live USD to INR conversion rate from a free public API."""
    try:
        response = requests.get(
            "https://open.er-api.com/v6/latest/USD",
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("result") == "success":
                return float(data["rates"]["INR"])
    except Exception as e:
        logger.warning(f"USD/INR fetch failed: {e}")
    return 83.5  # fallback rate

def fetch_live_gold_price_from_api() -> float:
    """Fetches spot gold price in USD/oz and converts to INR/g."""
    response = requests.get("https://api.gold-api.com/price/XAU", timeout=5)
    if response.status_code == 200:
        data = response.json()
        gold_usd_per_oz = float(data["price"])
        usd_to_inr = get_live_usd_to_inr()
        gold_inr_per_gram = (gold_usd_per_oz / TROY_OUNCE_TO_GRAM) * usd_to_inr
        return round(gold_inr_per_gram, 2)
    raise Exception(f"API returned status code {response.status_code}")

def get_current_gold_price() -> float:
    """
    Fetch gold price with fallback hierarchy:
    1. Try live API
    2. If API fails, try cache
    3. If cache is empty/unavailable, return fallback (9800.0)
    """
    global _cached_price, _last_fetched_time
    current_time = time.time()
    
    # Check if cache expired or not populated
    if _cached_price is None or (current_time - _last_fetched_time) > CACHE_EXPIRY_SECONDS:
        try:
            live_price = fetch_live_gold_price_from_api()
            _cached_price = live_price
            _last_fetched_time = current_time
            logger.info(f"Live gold price fetched and cached: ₹{live_price}/g")
            return live_price
        except Exception as e:
            logger.warning(f"Live gold price fetch failed, trying cache. Error: {e}")
            
    # Cache lookup
    if _cached_price is not None:
        logger.info(f"Using cached gold price: ₹{_cached_price}/g")
        return _cached_price
        
    # Fallback lookup
    logger.warning(f"Cache unavailable. Using fallback gold price: ₹{FALLBACK_GOLD_PRICE_INR}/g")
    return FALLBACK_GOLD_PRICE_INR
