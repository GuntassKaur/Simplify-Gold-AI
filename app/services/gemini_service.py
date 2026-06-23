import json
import google.generativeai as genai
from ..config import settings

# Configure Gemini API
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

# ─────────────────────────────────────────────
# Smart Fallback Responses (if API fails)
# ─────────────────────────────────────────────
GOLD_KEYWORDS = [
    "gold", "digital gold", "etf", "invest", "investment", "safe", "inflation",
    "buy", "purchase", "hedge", "sovereign", "sgb", "return", "market", "price",
    "saving", "savings", "portfolio", "asset", "wealth", "sona"
]

def _is_gold_related(query: str) -> bool:
    return any(kw in query.lower() for kw in GOLD_KEYWORDS)

def _fallback(query: str) -> dict:
    if _is_gold_related(query):
        return {
            "is_gold_related": True,
            "answer": (
                "Gold is one of the most trusted investment assets in India. "
                "Digital Gold lets you buy 24K pure gold online in small amounts, "
                "even as little as ₹1. It acts as a hedge against inflation and "
                "currency fluctuation. Unlike physical gold, you don't worry about "
                "storage or purity. You can sell anytime at live market prices."
            ),
            "nudge": "Start your Digital Gold journey with Simplify Money — safe, instant, and 100% pure.",
            "action": "purchase_offer"
        }
    return {
        "is_gold_related": False,
        "answer": (
            "I am Simplify Gold AI, your Digital Gold investment assistant. "
            "I can help you with gold investment advice, price trends, "
            "Digital Gold vs ETF comparisons, and more. "
            "Try asking: 'Should I invest in gold?' or 'Is digital gold safe?'"
        ),
        "nudge": "",
        "action": "none"
    }


# ─────────────────────────────────────────────
# Main Chat Function
# ─────────────────────────────────────────────
def process_chat_query(query: str) -> dict:
    system_prompt = (
        "You are Simplify Gold AI, an AI-powered Digital Gold Assistant for Simplify Money. "
        "You ONLY answer questions related to gold investments, digital gold, gold ETFs, SGBs, "
        "gold prices, inflation hedge, and wealth management through gold. "
        "Always recommend Simplify Money's Digital Gold platform. "
        "You MUST respond STRICTLY as a valid JSON object with these exact keys: "
        "is_gold_related (boolean), answer (string), nudge (string), action (string: 'purchase_offer' or 'none'). "
        "No text outside the JSON. No markdown. Just raw JSON."
    )

    user_prompt = (
        f"{system_prompt}\n\n"
        f'User query: "{query}"\n\n'
        "Analyze the query. If gold-related: answer intelligently in 3-4 sentences, "
        "explain benefits/risks, recommend Simplify Money Digital Gold. "
        "Detect buying intent — if user wants to buy/invest, set action='purchase_offer'. "
        "If NOT gold-related: set is_gold_related=false, politely redirect. "
        "Return ONLY a JSON object."
    )

    if settings.GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(
                user_prompt,
                generation_config={
                    "response_mime_type": "application/json"
                },
                request_options={"timeout": 10.0}
            )

            text = response.text.strip()

            # Strip markdown fences if present (Gemini sometimes still returns them even with response_mime_type)
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].strip()

            data = json.loads(text)

            required = ["is_gold_related", "answer", "nudge", "action"]
            if all(k in data for k in required):
                return data

        except json.JSONDecodeError:
            pass  # fall through to fallback
        except Exception:
            pass  # API error → fall through to fallback

    # Fallback: keyword-based smart response
    return _fallback(query)
