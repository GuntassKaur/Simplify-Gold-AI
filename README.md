# Simplify Gold AI 🪙

A **premium fintech-grade Digital Gold Investment platform** powered by **Gemini 2.5 Flash AI**. Built with FastAPI backend and React + Tailwind CSS + Framer Motion frontend.

---

## 🚀 Live Features

- **AI Chat Assistant** — Powered by Google Gemini 2.5 Flash, answers gold investment queries intelligently
- **Portfolio Dashboard** — Track gold balance, portfolio value, and returns in real time
- **Buy Digital Gold** — Seamless purchase flow with live gold price calculator and DB-backed transactions
- **Premium UI** — React + Tailwind CSS + Framer Motion (CRED/Groww-grade design)
- **Full Database Integration** — SQLite via SQLAlchemy, stores users, purchases, and transaction history

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | FastAPI, SQLAlchemy, SQLite, Pydantic |
| **AI** | Google Gemini 2.5 Flash |
| **Frontend** | React 19, TypeScript, Tailwind CSS v3, Framer Motion, Lucide Icons |
| **Build** | Vite 8 |

---

## ⚙️ Setup Instructions

### 1. Clone the repo
```bash
git clone https://github.com/GuntassKaur/Simplify-Gold-AI.git
cd Simplify-Gold-AI
```

### 2. Set up Python backend
```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
```

### 3. Create your `.env` file
```bash
cp .env.example .env
```
Edit `.env` and add your **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey):
```
GEMINI_API_KEY=AIzaSy...your_key_here
GOLD_PRICE_PER_GRAM=9800
```

### 4. Run the backend server
```bash
uvicorn app.main:app --reload
```

### 5. (Optional) Rebuild the frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

### 6. Open the app
Visit **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/users` | Create a new user profile |
| `POST` | `/api/chat` | Send a query to Gemini AI |
| `POST` | `/api/purchase` | Buy digital gold (saves to DB) |
| `GET` | `/api/transactions/{user_id}` | Fetch all transactions |
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Swagger API Documentation |

---

## 🔐 Security

- API Keys are stored in `.env` which is **excluded from git via `.gitignore`**
- Never commit your `.env` file

---

## 📄 License

MIT License — feel free to fork and build on this!
