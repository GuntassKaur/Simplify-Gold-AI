import unittest
import os
import shutil
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set environment variables for testing
os.environ["DATABASE_URL"] = "sqlite:///./test_temp.db"
os.environ["GEMINI_API_KEY"] = ""  # Force fallback mechanism for testing

from app.database import Base, get_db
from app.main import app
from app.models import User, Transaction

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_temp.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

class TestSimplifyGoldBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create the tables
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        # Drop the tables and clean up the database file
        cls.client.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
        if os.path.exists("./test_temp.db"):
            import time
            time.sleep(0.2)
            try:
                os.remove("./test_temp.db")
            except Exception:
                pass

    def setUp(self):
        # Clear database tables before each test to ensure isolation
        db = TestingSessionLocal()
        db.query(Transaction).delete()
        db.query(User).delete()
        db.commit()
        db.close()

    def test_registration_and_login(self):
        # Test Registration
        register_payload = {
            "name": "Guntass Kaur",
            "email": "guntass@example.com",
            "password": "securepassword123"
        }
        response = self.client.post("/api/auth/register", json=register_payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["email"], "guntass@example.com")
        self.assertEqual(data["name"], "Guntass Kaur")
        user_id = data["user_id"]

        # Test Registration Duplicate Email
        response_dup = self.client.post("/api/auth/register", json=register_payload)
        self.assertEqual(response_dup.status_code, 400)
        self.assertEqual(response_dup.json()["detail"], "Email already registered")

        # Test Login Successful
        login_payload = {
            "email": "guntass@example.com",
            "password": "securepassword123"
        }
        response_login = self.client.post("/api/auth/login", json=login_payload)
        self.assertEqual(response_login.status_code, 200)
        login_data = response_login.json()
        self.assertIn("access_token", login_data)
        self.assertEqual(login_data["user_id"], user_id)

        # Test Login Failed (wrong password)
        failed_payload = {
            "email": "guntass@example.com",
            "password": "wrongpassword"
        }
        response_failed = self.client.post("/api/auth/login", json=failed_payload)
        self.assertEqual(response_failed.status_code, 401)

    def test_gold_question_detection(self):
        # Register a user first to have a valid user_id
        register_payload = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "password"
        }
        reg_res = self.client.post("/api/auth/register", json=register_payload)
        user_id = reg_res.json()["user_id"]

        # Test query related to gold (should trigger gold detection and nudge)
        gold_payload = {
            "user_id": user_id,
            "query": "Is digital gold a good hedge against inflation?"
        }
        response = self.client.post("/api/chat", json=gold_payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["is_gold_related"])
        self.assertIn("nudge", data)
        self.assertNotEqual(data["nudge"], "")

        # Test query NOT related to gold
        non_gold_payload = {
            "user_id": user_id,
            "query": "What is the capital of France?"
        }
        response_non = self.client.post("/api/chat", json=non_gold_payload)
        self.assertEqual(response_non.status_code, 200)
        data_non = response_non.json()
        self.assertFalse(data_non["is_gold_related"])

    def test_purchase_flow_and_auth_protection(self):
        # Register a user
        register_payload = {
            "name": "Buyer User",
            "email": "buyer@example.com",
            "password": "buyerpassword"
        }
        reg_res = self.client.post("/api/auth/register", json=register_payload)
        user_id = reg_res.json()["user_id"]
        token = reg_res.json()["access_token"]

        purchase_payload = {
            "user_id": user_id,
            "amount": 1000.0
        }

        # 1. Test Purchase WITHOUT auth token (should fail)
        response_no_auth = self.client.post("/api/purchase", json=purchase_payload)
        self.assertEqual(response_no_auth.status_code, 401)

        # 2. Test Purchase WITH auth token (should succeed)
        headers = {"Authorization": f"Bearer {token}"}
        response_auth = self.client.post("/api/purchase", json=purchase_payload, headers=headers)
        self.assertEqual(response_auth.status_code, 200)
        p_data = response_auth.json()
        self.assertIn("transaction_id", p_data)
        self.assertEqual(p_data["amount"], 1000.0)
        self.assertEqual(p_data["status"], "SUCCESS")
        self.assertTrue(p_data["gold_quantity"] > 0)

        # 3. Test Purchase for another user_id (should return 403 Forbidden)
        forbidden_payload = {
            "user_id": 99999,  # different user_id
            "amount": 1000.0
        }
        response_forbidden = self.client.post("/api/purchase", json=forbidden_payload, headers=headers)
        self.assertEqual(response_forbidden.status_code, 403)

    def test_portfolio_retrieval_and_transactions_history(self):
        # Register user and buy gold
        register_payload = {
            "name": "Portfolio User",
            "email": "portfolio_user@example.com",
            "password": "portfoliopassword"
        }
        reg_res = self.client.post("/api/auth/register", json=register_payload)
        user_id = reg_res.json()["user_id"]
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Buy gold once: ₹1500
        self.client.post("/api/purchase", json={"user_id": user_id, "amount": 1500.0}, headers=headers)
        # Buy gold twice: ₹2500
        self.client.post("/api/purchase", json={"user_id": user_id, "amount": 2500.0}, headers=headers)

        # Test Portfolio retrieval API (GET /api/portfolio/{user_id})
        portfolio_res = self.client.get(f"/api/portfolio/{user_id}", headers=headers)
        self.assertEqual(portfolio_res.status_code, 200)
        p_data = portfolio_res.json()
        self.assertEqual(p_data["total_invested"], 4000.0)
        self.assertTrue(p_data["total_gold_quantity"] > 0)
        self.assertTrue(p_data["portfolio_value"] > 0)
        self.assertEqual(len(p_data["transactions"]), 2)

        # Test Transaction history API (GET /api/transactions/{user_id})
        tx_res = self.client.get(f"/api/transactions/{user_id}", headers=headers)
        self.assertEqual(tx_res.status_code, 200)
        tx_data = tx_res.json()
        self.assertEqual(len(tx_data), 2)
        self.assertEqual(tx_data[0]["amount"] + tx_data[1]["amount"], 4000.0)

        # Test Transaction history user API (GET /api/transactions/user/{user_id})
        tx_user_res = self.client.get(f"/api/transactions/user/{user_id}", headers=headers)
        self.assertEqual(tx_user_res.status_code, 200)
        self.assertEqual(len(tx_user_res.json()), 2)

        # Test Portfolio/Transactions with no authorization header (should fail)
        self.assertEqual(self.client.get(f"/api/portfolio/{user_id}").status_code, 401)
        self.assertEqual(self.client.get(f"/api/transactions/{user_id}").status_code, 401)

if __name__ == "__main__":
    unittest.main()
