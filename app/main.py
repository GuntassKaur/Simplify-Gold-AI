from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes import users, chat, purchase, transactions, auth, portfolio
from .utils.helpers import get_current_gold_price
import os

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Simplify Gold AI API",
    description="AI-powered Digital Gold Assistant built with FastAPI, Gemini AI, SQLAlchemy and SQLite.",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(purchase.router, prefix="/api", tags=["Purchase"])
app.include_router(transactions.router, prefix="/api", tags=["Transactions"])
app.include_router(portfolio.router, prefix="/api", tags=["Portfolio"])

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Service is healthy"}

@app.get("/api/gold-price", tags=["Gold Price"])
def live_gold_price():
    """Returns the current live gold price in INR per gram fetched from Yahoo Finance."""
    price = get_current_gold_price()
    return {
        "gold_price_inr_per_gram": price,
        "source": "gold-api.com (XAU Spot Price)",
        "currency": "INR"
    }

# Mount the static files directory
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/", tags=["Frontend"])
async def serve_frontend():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Frontend not found."}
