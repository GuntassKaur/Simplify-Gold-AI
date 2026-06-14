import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Coins,
  TrendingUp,
  Wallet,
  History,
  User,
  ArrowRight,
  ChevronRight,
  X,
  CheckCircle,
  Send,
  Info,
  Lock,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  LogOut,
  Loader2,
  TrendingDown,
  Gift,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface UserProfile {
  id: number;
  name: string;
  email: string;
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  showCTA?: boolean;
}

interface Transaction {
  id: number;
  transaction_id: string;
  amount: number;
  gold_price: number;
  gold_quantity: number;
  created_at: string;
}

// ─── SVG Chart: Cumulative Investment Growth ──────────────────────────────────
function InvestmentChart({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="w-full h-[200px] flex flex-col items-center justify-center text-center">
        <BarChart3 className="w-8 h-8 text-muted mb-2 opacity-40" />
        <p className="text-xs text-muted">Make your first purchase to see your growth chart.</p>
      </div>
    );
  }

  // Sort by date ascending
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Build cumulative data
  let cumAmount = 0;
  const points = sorted.map((t) => {
    cumAmount += t.amount;
    return { date: new Date(t.created_at), value: cumAmount };
  });

  const maxVal = Math.max(...points.map((p) => p.value));
  const W = 400;
  const H = 100;
  const pad = { left: 5, right: 5, top: 10, bottom: 5 };

  const toX = (i: number) =>
    points.length === 1
      ? W / 2
      : pad.left + (i / (points.length - 1)) * (W - pad.left - pad.right);
  const toY = (v: number) =>
    H - pad.bottom - ((v / maxVal) * (H - pad.top - pad.bottom));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.value)}`)
    .join(' ');

  const areaPath =
    linePath +
    ` L ${toX(points.length - 1)} ${H - pad.bottom} L ${toX(0)} ${H - pad.bottom} Z`;

  return (
    <svg className="w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={toX(i)} cy={toY(p.value)} r="3" fill="#D4AF37" />
      ))}
    </svg>
  );
}

// ─── SVG Chart: Gold Balance Over Time ───────────────────────────────────────
function GoldBalanceChart({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) return null;

  const sorted = [...transactions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  let cumGold = 0;
  const points = sorted.map((t) => {
    cumGold += t.gold_quantity;
    return { value: cumGold };
  });

  const maxVal = Math.max(...points.map((p) => p.value));
  const W = 400;
  const H = 80;

  const toX = (i: number) =>
    points.length === 1 ? W / 2 : 10 + (i / (points.length - 1)) * (W - 20);
  const toY = (v: number) => H - 5 - (v / maxVal) * (H - 15);

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.value)}`)
    .join(' ');
  const areaPath =
    linePath + ` L ${toX(points.length - 1)} ${H - 5} L ${toX(0)} ${H - 5} Z`;

  return (
    <svg className="w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#goldGrad)" />
      <path d={linePath} fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Bar Chart: Monthly Purchase Activity ────────────────────────────────────
function MonthlyBarChart({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) return null;

  // Group by month
  const monthMap: Record<string, number> = {};
  transactions.forEach((t) => {
    const d = new Date(t.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = (monthMap[key] || 0) + t.amount;
  });

  const months = Object.keys(monthMap).sort().slice(-6); // last 6 months
  const values = months.map((m) => monthMap[m]);
  const maxVal = Math.max(...values);

  const W = 400;
  const H = 80;
  const barW = Math.min(40, (W / months.length) * 0.6);
  const gap = W / months.length;

  const shortMonth = (key: string) => {
    const [, m] = key.split('-');
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
      parseInt(m) - 1
    ];
  };

  return (
    <svg className="w-full" viewBox={`0 0 ${W} ${H + 15}`} preserveAspectRatio="none">
      {months.map((m, i) => {
        const barH = (values[i] / maxVal) * (H - 10);
        const x = gap * i + gap / 2 - barW / 2;
        const y = H - barH;
        return (
          <g key={m}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx="4"
              fill="#D4AF37"
              opacity="0.7"
            />
            <text
              x={x + barW / 2}
              y={H + 12}
              textAnchor="middle"
              fontSize="9"
              fill="#9CA3AF"
            >
              {shortMonth(m)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  // Navigation & User State
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'chat' | 'history' | 'analytics'>('home');
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('simplify_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Modals & Flows
  const [showRegModal, setShowRegModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Auth Modal State (Registration / Login)
  const [isLogin, setIsLogin] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [buyAmount, setBuyAmount] = useState('500');

  // Loading States
  const [regLoading, setRegLoading] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [txnLoading, setTxnLoading] = useState(false);

  // Data States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [latestTxn, setLatestTxn] = useState<any | null>(null);
  const [goldPrice, setGoldPrice] = useState<number | null>(null);
  const [goldPriceLoading, setGoldPriceLoading] = useState(true);

  // Error State
  const [authError, setAuthError] = useState('');

  // Fetch Gold Price from backend
  const fetchGoldPrice = async () => {
    try {
      const res = await fetch('/api/gold-price');
      if (res.ok) {
        const data = await res.json();
        if (data.gold_price_inr_per_gram) {
          setGoldPrice(data.gold_price_inr_per_gram);
        }
      }
    } catch (err) {
      console.error("Error fetching live gold price:", err);
    } finally {
      setGoldPriceLoading(false);
    }
  };

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: "Hello! I am Simplify Gold AI, your digital gold investment assistant. How can I help you grow your wealth today?"
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto Scroll Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Initial mount: fetch price & setup polling
  useEffect(() => {
    fetchGoldPrice();
    const interval = setInterval(fetchGoldPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Transactions when User is available
  useEffect(() => {
    if (user) {
      fetchTransactions(user.id);
    }
  }, [user]);

  const fetchTransactions = async (userId: number) => {
    setTxnLoading(true);
    try {
      const token = localStorage.getItem('simplify_token');
      const res = await fetch(`/api/transactions/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setTxnLoading(false);
    }
  };

  // Handlers
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!regEmail.trim() || !regPassword.trim()) return;
    if (!isLogin && !regName.trim()) return;

    setRegLoading(true);
    try {
      const url = isLogin ? '/api/auth/login' : '/api/auth/register';
      const bodyObj = isLogin
        ? { email: regEmail, password: regPassword }
        : { name: regName, email: regEmail, password: regPassword };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyObj)
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        const profile: UserProfile = { id: data.user_id, name: data.name, email: data.email };
        setUser(profile);
        localStorage.setItem('simplify_user', JSON.stringify(profile));
        localStorage.setItem('simplify_token', data.access_token);
        setShowRegModal(false);
        setRegName('');
        setRegEmail('');
        setRegPassword('');
        setActiveTab('dashboard');
      } else {
        setAuthError(data.detail || "Authentication failed. Please check your inputs.");
      }
    } catch (err) {
      setAuthError("Error connecting to server.");
    } finally {
      setRegLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('simplify_user');
    localStorage.removeItem('simplify_token');
    setUser(null);
    setTransactions([]);
    setActiveTab('home');
  };

  const handleChatSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    if (!user) {
      setShowRegModal(true);
      return;
    }

    const userQuery = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, query: userQuery })
      });
      const data = await res.json();

      let answerText = data.answer;
      if (data.nudge && data.is_gold_related) {
        answerText += `\n\n_${data.nudge}_`;
      }

      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: answerText,
          showCTA: data.action === 'purchase_offer' || data.is_gold_related
        }
      ]);

      if (data.action === 'purchase_offer') {
        setTimeout(() => { setShowBuyModal(true); }, 1200);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: "I'm having trouble connecting to the network right now. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handlePurchase = async () => {
    const amountVal = parseFloat(buyAmount);
    if (!amountVal || amountVal <= 0) return;

    if (!user) {
      setShowBuyModal(false);
      setShowRegModal(true);
      return;
    }

    setBuyLoading(true);
    try {
      const token = localStorage.getItem('simplify_token');
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: user.id, amount: amountVal })
      });
      const data = await res.json();

      if (res.ok && data.status === 'SUCCESS') {
        setLatestTxn(data);
        setShowBuyModal(false);
        await fetchTransactions(user.id); // refresh first, then show modal
        setShowSuccessModal(true);
      } else {
        alert(data.detail || "Purchase failed. Please try again.");
      }
    } catch (err) {
      alert("Error completing purchase.");
    } finally {
      setBuyLoading(false);
    }
  };

  // Calculations — derived from real DB data
  const totalGoldOwned = transactions.reduce((acc, curr) => acc + curr.gold_quantity, 0);
  const totalAmountInvested = transactions.reduce((acc, curr) => acc + curr.amount, 0);
  const currentPortfolioValue = totalGoldOwned * (goldPrice ?? 0);
  const netReturn = currentPortfolioValue - totalAmountInvested;
  const returnPercentage = totalAmountInvested > 0 ? (netReturn / totalAmountInvested) * 100 : 0;
  const avgBuyPrice = transactions.length > 0
    ? transactions.reduce((acc, t) => acc + t.gold_price, 0) / transactions.length
    : 0;

  // Gold price display helper
  const goldPriceDisplay = goldPrice
    ? `₹${goldPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    : '—';

  const estimatedGrams = goldPrice && parseFloat(buyAmount) > 0
    ? (parseFloat(buyAmount) / goldPrice).toFixed(4)
    : '0.0000';

  // Suggested prompts
  const suggestedPrompts = [
    "Should I invest in gold?",
    "Gold ETF vs Digital Gold",
    "Is now a good time to buy gold?"
  ];

  // Navigation tabs config
  const navTabs = [
    { id: 'home', label: 'Home', Icon: Sparkles },
    { id: 'dashboard', label: 'Portfolio', Icon: Wallet, protected: true },
    { id: 'chat', label: 'AI Chat', Icon: Activity, protected: true },
    { id: 'history', label: 'History', Icon: History, protected: true },
    { id: 'analytics', label: 'Analytics', Icon: BarChart3, protected: true },
  ] as const;

  const handleNav = (tab: typeof activeTab) => {
    const cfg = navTabs.find(n => n.id === tab);
    if (cfg && (cfg as any).protected && !user) {
      setShowRegModal(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-accentGold/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[20%] left-[-10%] w-[350px] h-[350px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between">
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accentGold to-accentLightGold flex items-center justify-center shadow-lg shadow-accentGold/20 group-hover:scale-105 transition-transform duration-300">
            <Coins className="text-primary w-5.5 h-5.5" />
          </div>
          <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Simplify <span className="text-accentGold">Gold AI</span>
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold">
            {navTabs.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleNav(id as typeof activeTab)}
                className={`hover:text-accentGold transition-colors duration-200 ${activeTab === id ? 'text-accentGold font-bold' : 'text-muted'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="glass-card flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold border-white/10">
                  <User className="w-3.5 h-3.5 text-accentLightGold" />
                  <span>{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="glass-card hover:bg-red-500/10 hover:border-red-500/30 p-2 rounded-lg transition-colors group"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-red-400 group-hover:scale-105 transition-transform" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowRegModal(true)}
                className="bg-gradient-to-r from-accentGold to-accentLightGold hover:from-accentLightGold hover:to-accentGold text-primary font-bold text-xs py-2.5 px-5 rounded-xl transition-all duration-300 shadow-md shadow-accentGold/10 hover:shadow-accentGold/20 active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 md:px-12 flex flex-col pb-20 md:pb-8">
        <AnimatePresence mode="wait">

          {/* ══════════════════ TAB: LANDING PAGE ══════════════════ */}
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col justify-center py-8"
            >
              {/* Hero Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 flex flex-col gap-6 text-left">
                  <div className="inline-flex items-center gap-2 bg-accentGold/10 border border-accentGold/20 py-1.5 px-4 rounded-full text-xs font-bold text-accentLightGold w-fit">
                    <Sparkles className="w-3.5 h-3.5" />
                    FinTech Gold Wealth Management
                  </div>
                  <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                    Invest Smarter in <br />
                    <span className="gold-shimmer">Digital Gold</span>
                  </h1>
                  <p className="text-muted text-base md:text-lg max-w-lg leading-relaxed">
                    Experience pure 24K gold investment backed by state-of-the-art AI. No lockers, no storage costs, 100% secure.
                  </p>

                  {/* Live Gold Price Ticker */}
                  <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 py-2.5 px-5 rounded-2xl w-fit">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-muted font-semibold">Live Gold Price:</span>
                    {goldPriceLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-accentGold" />
                    ) : (
                      <span className="text-sm font-black text-accentLightGold">{goldPriceDisplay}/gram</span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mt-2">
                    <button
                      onClick={() => { if (!user) setShowRegModal(true); else setActiveTab('chat'); }}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-accentGold to-accentLightGold text-primary font-bold py-3.5 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-accentGold/10 hover:shadow-accentGold/25 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Ask AI Assistant
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { if (!user) setShowRegModal(true); else setActiveTab('dashboard'); }}
                      className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 font-bold py-3.5 px-8 rounded-xl transition-all duration-300 hover:border-accentGold/30"
                    >
                      Start Investing
                      <ArrowRight className="w-4 h-4 text-accentGold" />
                    </button>
                  </div>
                </div>

                {/* Animated Gold Graphic Card */}
                <div className="lg:col-span-5 flex justify-center relative py-12 lg:py-0">
                  <div className="w-[300px] h-[300px] md:w-[380px] md:h-[380px] relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border border-white/5 animate-[spin_12s_linear_infinite]" />
                    <div className="absolute inset-6 rounded-full border border-dashed border-accentGold/20 animate-[spin_8s_linear_infinite_reverse]" />
                    <div className="absolute w-48 h-48 bg-accentGold/10 rounded-full blur-[40px]" />
                    <motion.div
                      animate={{ y: [0, -15, 0], rotateY: [0, 180, 360] }}
                      transition={{
                        y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                        rotateY: { duration: 15, repeat: Infinity, ease: "linear" }
                      }}
                      className="w-44 h-44 rounded-full bg-gradient-to-br from-yellow-300 via-accentGold to-amber-600 shadow-2xl shadow-accentGold/40 flex items-center justify-center relative cursor-pointer border-4 border-yellow-200/50"
                    >
                      <Coins className="w-20 h-20 text-white/90 drop-shadow-lg" />
                      <div className="absolute inset-2 rounded-full border border-yellow-200/20" />
                    </motion.div>
                    <div className="absolute top-10 left-10 animate-float-slow bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-lg">
                      <TrendingUp className="w-5 h-5 text-accentLightGold" />
                    </div>
                    <div className="absolute bottom-12 right-6 animate-float-medium bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-lg">
                      <Lock className="w-5 h-5 text-green-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mt-24 grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { Icon: Sparkles, title: 'AI-Powered Advice', desc: 'Ask intelligent questions about gold prices, markets, and investment strategy directly from our custom assistant.' },
                  { Icon: Coins, title: 'Instant Purity', desc: 'Invest in 24K pure 99.9% hallmarked digital gold instantly without handling fees or lockers.' },
                  { Icon: ShieldCheck, title: '100% Safe Vaults', desc: 'Your digital assets are secured in institutional-grade vaults and insured for ultimate peace of mind.' },
                  { Icon: Activity, title: 'Live Updates', desc: 'Track live gold price fluctuations per gram, review transaction history, and buy instantly.' },
                ].map(({ Icon, title, desc }) => (
                  <div key={title} className="glass-card p-6 rounded-2xl flex flex-col gap-4 text-left">
                    <div className="w-12 h-12 rounded-xl bg-accentGold/10 border border-accentGold/25 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-accentLightGold" />
                    </div>
                    <h3 className="font-bold text-lg">{title}</h3>
                    <p className="text-muted text-sm leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ══════════════════ TAB: PORTFOLIO DASHBOARD ══════════════════ */}
          {activeTab === 'dashboard' && user && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col gap-8 py-4 text-left"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold">Your Gold Portfolio</h2>
                  <p className="text-muted text-sm mt-1">Manage, analyze, and track your active investments.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchTransactions(user.id)}
                    className="glass-card p-2.5 rounded-xl hover:border-white/20 transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-4 h-4 text-muted ${txnLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShowBuyModal(true)}
                    className="bg-gradient-to-r from-accentGold to-accentLightGold text-primary font-extrabold py-3 px-6 rounded-xl shadow-lg shadow-accentGold/15 hover:shadow-accentGold/25 flex items-center justify-center gap-2 self-start md:self-auto hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Buy Digital Gold
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {/* Live Gold Price */}
                <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-muted text-xs font-semibold">
                    <span>Live Gold Price</span>
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="mt-3">
                    {goldPriceLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-accentGold" />
                    ) : (
                      <span className="text-2xl font-black">{goldPriceDisplay}</span>
                    )}
                    <span className="text-muted text-[10px] block mt-1">per gram (24K, 99.9% pure)</span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-green-400 font-semibold">Live Market Rate</span>
                  </div>
                </div>

                {/* Portfolio Value */}
                <div className="glass-card p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-accentGold/5 rounded-full blur-2xl" />
                  <div className="flex items-center justify-between text-muted text-xs font-semibold">
                    <span>Portfolio Value</span>
                    <Wallet className="w-4 h-4 text-accentGold" />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-accentLightGold">
                      ₹{currentPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-muted text-[10px] block mt-1">Based on live price</span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    {returnPercentage >= 0 ? (
                      <span className="text-green-400 text-[10px] font-bold flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" />+{returnPercentage.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-red-400 text-[10px] font-bold flex items-center gap-0.5">
                        <TrendingDown className="w-3 h-3" />{returnPercentage.toFixed(2)}%
                      </span>
                    )}
                    <span className="text-muted text-[10px]">vs invested</span>
                  </div>
                </div>

                {/* Gold Balance */}
                <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-muted text-xs font-semibold">
                    <span>Gold Balance</span>
                    <Coins className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black">{totalGoldOwned.toFixed(4)} <small className="text-sm">g</small></span>
                    <span className="text-muted text-[10px] block mt-1">Secured in digital vault</span>
                  </div>
                  <div className="mt-3 text-[10px] text-muted">
                    Invested: <span className="font-bold text-white">₹{totalAmountInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

                {/* Transactions Count */}
                <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-muted text-xs font-semibold">
                    <span>Total Orders</span>
                    <History className="w-4 h-4 text-muted" />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black">{transactions.length}</span>
                    <span className="text-muted text-[10px] block mt-1">Successful purchases</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="mt-3 text-[10px] text-accentLightGold font-bold hover:underline flex items-center gap-0.5 text-left"
                  >
                    View all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Chart + Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Investment Growth Chart */}
                <div className="lg:col-span-8 glass-card p-6 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base">Cumulative Investment Growth</h3>
                      <p className="text-muted text-[10px] mt-0.5">Based on your actual purchase history</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-accentLightGold">
                        ₹{currentPortfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-[10px] text-muted">Current Value</p>
                    </div>
                  </div>
                  <div className="w-full h-[200px] bg-white/[0.01] border border-white/5 rounded-xl overflow-hidden flex items-end p-2">
                    <InvestmentChart transactions={transactions} />
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-4 glass-card p-6 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <History className="w-4 h-4 text-accentGold" />
                      Recent Activity
                    </h3>
                    <span className="text-[10px] text-muted font-bold">{transactions.length} orders</span>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[220px] flex flex-col gap-3 pr-1">
                    {transactions.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                        <Info className="w-7 h-7 text-muted mb-2 opacity-50" />
                        <p className="text-xs text-muted font-semibold">No transactions yet.</p>
                        <button
                          onClick={() => setShowBuyModal(true)}
                          className="mt-2 text-xs text-accentGold font-bold hover:underline"
                        >
                          Buy your first Gold →
                        </button>
                      </div>
                    ) : (
                      transactions.slice(0, 6).map((txn) => (
                        <div key={txn.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-white font-mono">{txn.transaction_id.slice(0, 12)}…</span>
                            <span className="text-[9px] text-muted">
                              {new Date(txn.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-right flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-accentLightGold">+{txn.gold_quantity.toFixed(4)} g</span>
                            <span className="text-[9px] text-muted">₹{txn.amount.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {transactions.length > 6 && (
                    <button
                      onClick={() => setActiveTab('history')}
                      className="text-xs text-accentGold font-bold hover:underline flex items-center gap-1 justify-center"
                    >
                      View all {transactions.length} transactions <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* AI Insight Card */}
              <div className="glass-card p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-4 bg-gradient-to-r from-accentGold/5 to-transparent border-accentGold/10">
                <div className="w-10 h-10 rounded-xl bg-accentGold/10 border border-accentGold/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-accentLightGold" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-accentLightGold mb-1">AI Gold Insight</p>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Gold acts as a key shield against inflation. A 10% asset allocation in gold is recommended to reduce risk during periods of high volatility. Start a Gold SIP from as little as ₹100/month.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="shrink-0 text-xs text-accentGold font-bold hover:underline flex items-center gap-1 whitespace-nowrap"
                >
                  Ask AI <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════ TAB: AI CHAT ══════════════════ */}
          {activeTab === 'chat' && user && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-8 py-2 text-left h-[calc(100vh-120px)] max-h-[700px]"
            >
              {/* Sidebar */}
              <div className="hidden lg:flex lg:col-span-3 flex-col gap-4 h-full">
                <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-accentGold font-bold text-sm">
                    <Sparkles className="w-4 h-4" />
                    AI Core Expertise
                  </div>
                  <p className="text-xs text-muted leading-relaxed">Simplify Gold AI is trained specifically to answer queries related to:</p>
                  <ul className="text-xs text-gray-300 flex flex-col gap-2.5 list-disc pl-4">
                    <li>Digital Gold Benefits &amp; Risks</li>
                    <li>Sovereign Gold Bonds (SGB)</li>
                    <li>Gold ETFs vs Physical Gold</li>
                    <li>Inflation hedging &amp; Gold wealth strategies</li>
                  </ul>
                </div>

                <div className="glass-card p-5 rounded-2xl flex flex-col gap-3 bg-gradient-to-tr from-accentGold/5 to-transparent border-white/5">
                  <div className="flex items-center gap-2 text-accentLightGold font-bold text-xs">
                    <Gift className="w-4 h-4" />
                    Your Gold Holdings
                  </div>
                  {transactions.length > 0 ? (
                    <>
                      <p className="text-[11px] text-muted">You own <span className="text-white font-bold">{totalGoldOwned.toFixed(4)}g</span> of digital gold worth <span className="text-accentLightGold font-bold">₹{currentPortfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>.</p>
                      <button
                        onClick={() => setShowBuyModal(true)}
                        className="mt-1 text-[11px] font-bold text-accentGold hover:underline text-left"
                      >
                        Add more gold →
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-[11px] text-muted leading-relaxed">Start investing today with as little as ₹1. Build your savings bit by bit!</p>
                      <button
                        onClick={() => setShowBuyModal(true)}
                        className="mt-1 text-[11px] font-bold text-accentGold hover:underline text-left"
                      >
                        Buy digital gold now →
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Chat Panel */}
              <div className="lg:col-span-9 glass-card rounded-2xl flex flex-col overflow-hidden h-full">
                {/* Chat Header */}
                <div className="border-b border-white/5 py-4 px-6 flex items-center justify-between bg-white/[0.01]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accentGold/10 flex items-center justify-center border border-accentGold/20">
                      <Sparkles className="w-4 h-4 text-accentLightGold" />
                    </div>
                    <div>
                      <span className="font-extrabold text-sm block">Simplify Gold AI</span>
                      <span className="text-[10px] text-green-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Active
                      </span>
                    </div>
                  </div>
                  {goldPrice && (
                    <div className="hidden sm:flex items-center gap-2 text-xs text-muted">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span>Gold: <span className="text-accentLightGold font-bold">{goldPriceDisplay}/g</span></span>
                    </div>
                  )}
                </div>

                {/* Messages Box */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 max-h-[460px] min-h-[300px]">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${msg.sender === 'user' ? 'bg-accentGold text-primary font-bold' : 'bg-white/5 border border-white/10'}`}>
                        {msg.sender === 'user' ? user.name.charAt(0).toUpperCase() : <Sparkles className="w-3.5 h-3.5 text-accentLightGold" />}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${msg.sender === 'user' ? 'bg-accentGold/10 text-white rounded-tr-none border border-accentGold/20' : 'bg-white/[0.02] text-gray-200 border border-white/5 rounded-tl-none'}`}>
                          {msg.text}
                        </div>
                        {msg.showCTA && (
                          <button
                            onClick={() => setShowBuyModal(true)}
                            className="w-fit self-start bg-gradient-to-r from-accentGold to-accentLightGold text-primary font-bold text-[10px] py-2 px-4 rounded-lg shadow shadow-accentGold/15 hover:shadow-accentGold/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1 mt-1"
                          >
                            Buy Digital Gold Now
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="flex gap-3 self-start">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-accentLightGold" />
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl rounded-tl-none flex items-center justify-center">
                        <div className="flex items-center gap-1 py-1 px-2">
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Suggested Prompts */}
                {chatMessages.length === 1 && !chatLoading && (
                  <div className="px-6 py-2 flex flex-wrap gap-2">
                    {suggestedPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setChatInput(p); }}
                        className="text-[10px] font-semibold text-muted bg-white/5 border border-white/10 hover:border-accentGold/30 hover:text-white py-1.5 px-3 rounded-lg transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                {/* Chat Form */}
                <form
                  onSubmit={handleChatSend}
                  className="border-t border-white/5 p-4 bg-white/[0.01] flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask Simplify Gold AI about digital gold investing..."
                    className="flex-1 bg-white/5 border border-white/10 focus:border-accentGold/30 focus:outline-none rounded-xl py-3 px-4 text-xs text-white placeholder-gray-500"
                    disabled={chatLoading}
                  />
                  <button
                    type="submit"
                    className="w-10 h-10 rounded-xl bg-gradient-to-r from-accentGold to-accentLightGold hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center text-primary transition-transform disabled:opacity-50"
                    disabled={chatLoading || !chatInput.trim()}
                  >
                    {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ══════════════════ TAB: TRANSACTION HISTORY ══════════════════ */}
          {activeTab === 'history' && user && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col gap-6 py-4 text-left"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold">Transaction History</h2>
                  <p className="text-muted text-sm mt-1">{transactions.length} purchase{transactions.length !== 1 ? 's' : ''} recorded in your account.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => fetchTransactions(user.id)}
                    className="glass-card p-2.5 rounded-xl hover:border-white/20 transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-4 h-4 text-muted ${txnLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShowBuyModal(true)}
                    className="bg-gradient-to-r from-accentGold to-accentLightGold text-primary font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Coins className="w-3.5 h-3.5" /> Buy Gold
                  </button>
                </div>
              </div>

              {/* Summary bar */}
              {transactions.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Invested', value: `₹${totalAmountInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
                    { label: 'Gold Accumulated', value: `${totalGoldOwned.toFixed(4)}g` },
                    { label: 'Avg Buy Price', value: `₹${avgBuyPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/g` },
                    { label: 'Current Value', value: `₹${currentPortfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="glass-card p-4 rounded-xl">
                      <p className="text-[10px] text-muted font-semibold mb-1">{label}</p>
                      <p className="text-sm font-black text-white">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Table */}
              {txnLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-accentGold" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                  <Info className="w-10 h-10 text-muted mb-3 opacity-40" />
                  <p className="font-bold text-white mb-1">No transactions yet</p>
                  <p className="text-xs text-muted mb-4">Make your first purchase to see your history.</p>
                  <button
                    onClick={() => setShowBuyModal(true)}
                    className="bg-gradient-to-r from-accentGold to-accentLightGold text-primary font-bold py-2.5 px-6 rounded-xl text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Buy Digital Gold
                  </button>
                </div>
              ) : (
                <div className="glass-card rounded-2xl overflow-hidden">
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/5 text-muted text-[10px] uppercase tracking-wider">
                          <th className="text-left py-4 px-5 font-semibold">#</th>
                          <th className="text-left py-4 px-5 font-semibold">Transaction ID</th>
                          <th className="text-left py-4 px-5 font-semibold">Date &amp; Time</th>
                          <th className="text-right py-4 px-5 font-semibold">Amount Paid</th>
                          <th className="text-right py-4 px-5 font-semibold">Gold Price</th>
                          <th className="text-right py-4 px-5 font-semibold">Gold Qty</th>
                          <th className="text-center py-4 px-5 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((txn, idx) => (
                          <tr key={txn.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-5 text-muted">{idx + 1}</td>
                            <td className="py-4 px-5">
                              <span className="font-mono text-white text-[11px]">{txn.transaction_id}</span>
                            </td>
                            <td className="py-4 px-5 text-muted">
                              {new Date(txn.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric'
                              })}
                              <span className="block text-[9px]">
                                {new Date(txn.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right font-bold text-white">₹{txn.amount.toLocaleString('en-IN')}</td>
                            <td className="py-4 px-5 text-right text-muted">₹{txn.gold_price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/g</td>
                            <td className="py-4 px-5 text-right font-extrabold text-accentLightGold">{txn.gold_quantity.toFixed(4)}g</td>
                            <td className="py-4 px-5 text-center">
                              <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-bold py-1 px-2.5 rounded-full">
                                SUCCESS
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden flex flex-col divide-y divide-white/5">
                    {transactions.map((txn, idx) => (
                      <div key={txn.id} className="p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-muted">#{idx + 1}</span>
                          <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-bold py-0.5 px-2 rounded-full">SUCCESS</span>
                        </div>
                        <span className="font-mono text-[10px] text-white">{txn.transaction_id}</span>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted">{new Date(txn.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                          <span className="font-bold text-white">₹{txn.amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted">@ ₹{txn.gold_price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/g</span>
                          <span className="font-extrabold text-accentLightGold">+{txn.gold_quantity.toFixed(4)}g</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════════════ TAB: ANALYTICS ══════════════════ */}
          {activeTab === 'analytics' && user && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col gap-6 py-4 text-left"
            >
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold">Investment Analytics</h2>
                <p className="text-muted text-sm mt-1">Visual insights derived from your real purchase data.</p>
              </div>

              {transactions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                  <BarChart3 className="w-10 h-10 text-muted mb-3 opacity-40" />
                  <p className="font-bold text-white mb-1">No data to visualize</p>
                  <p className="text-xs text-muted mb-4">Make your first purchase to unlock analytics.</p>
                  <button
                    onClick={() => setShowBuyModal(true)}
                    className="bg-gradient-to-r from-accentGold to-accentLightGold text-primary font-bold py-2.5 px-6 rounded-xl text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Buy Digital Gold
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 1: Cumulative Investment */}
                  <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
                    <div>
                      <h3 className="font-bold text-base">Investment Growth</h3>
                      <p className="text-[10px] text-muted mt-0.5">Cumulative amount invested over time</p>
                    </div>
                    <div className="w-full h-[160px] bg-white/[0.01] border border-white/5 rounded-xl overflow-hidden p-2">
                      <InvestmentChart transactions={transactions} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Total Invested</span>
                      <span className="font-bold text-white">₹{totalAmountInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>

                  {/* Chart 2: Gold Accumulated */}
                  <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
                    <div>
                      <h3 className="font-bold text-base">Gold Accumulation</h3>
                      <p className="text-[10px] text-muted mt-0.5">Cumulative gold grams over time</p>
                    </div>
                    <div className="w-full h-[160px] bg-white/[0.01] border border-white/5 rounded-xl overflow-hidden flex items-end p-2">
                      <GoldBalanceChart transactions={transactions} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">Total Gold</span>
                      <span className="font-bold text-accentLightGold">{totalGoldOwned.toFixed(4)}g</span>
                    </div>
                  </div>

                  {/* Chart 3: Monthly Activity */}
                  <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
                    <div>
                      <h3 className="font-bold text-base">Monthly Purchase Activity</h3>
                      <p className="text-[10px] text-muted mt-0.5">Amount invested per month (last 6 months)</p>
                    </div>
                    <div className="w-full h-[120px] bg-white/[0.01] border border-white/5 rounded-xl overflow-hidden p-2">
                      <MonthlyBarChart transactions={transactions} />
                    </div>
                  </div>

                  {/* Portfolio Allocation */}
                  <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
                    <div>
                      <h3 className="font-bold text-base">Portfolio Snapshot</h3>
                      <p className="text-[10px] text-muted mt-0.5">Your wealth allocation summary</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      {[
                        { label: 'Cost of Gold', value: totalAmountInvested, color: '#D4AF37', total: currentPortfolioValue },
                        { label: 'Unrealized Gain/Loss', value: Math.abs(netReturn), color: netReturn >= 0 ? '#22c55e' : '#ef4444', total: currentPortfolioValue },
                      ].map(({ label, value, color, total }) => {
                        const pct = total > 0 ? (value / total) * 100 : 0;
                        return (
                          <div key={label} className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted">{label}</span>
                              <span className="font-bold text-white">₹{value.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({pct.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(pct, 100)}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                          <p className="text-[9px] text-muted mb-1">Avg Buy Price</p>
                          <p className="text-xs font-bold">₹{avgBuyPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/g</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                          <p className="text-[9px] text-muted mb-1">Current Price</p>
                          <p className="text-xs font-bold text-accentLightGold">{goldPriceDisplay}/g</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-white/5 flex items-center justify-around py-2 px-4">
        {navTabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => handleNav(id as typeof activeTab)}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-colors ${activeTab === id ? 'text-accentGold' : 'text-muted'}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-semibold">{label}</span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <footer className="hidden md:block border-t border-white/5 py-6 px-6 text-center text-xs text-muted">
        <p>&copy; 2026 Simplify Gold AI. Powered by Gemini 2.5 Flash. All rights reserved.</p>
      </footer>

      {/* ══════════ MODAL 1: AUTH (Register / Login) ══════════ */}
      <AnimatePresence>
        {showRegModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRegModal(false)}
              className="absolute inset-0 bg-primary/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="glass-card border-white/10 w-full max-w-md p-8 rounded-3xl relative z-10 text-left flex flex-col gap-6"
            >
              <button
                onClick={() => { setShowRegModal(false); setAuthError(''); }}
                className="absolute top-6 right-6 text-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-xl font-bold">{isLogin ? "Sign In to Your Profile" : "Create Your Profile"}</h3>
                <p className="text-muted text-xs">{isLogin ? "Enter your email and password to access your dashboard." : "Enter your details to initiate smart gold investing."}</p>
              </div>
              {authError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl py-2.5 px-4 text-xs text-red-400 font-semibold">
                  {authError}
                </div>
              )}
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                {!isLogin && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-muted font-bold uppercase tracking-wider">Full Name</label>
                    <input type="text" required placeholder="e.g. Guntass Kaur" value={regName} onChange={(e) => setRegName(e.target.value)} className="bg-white/5 border border-white/10 focus:border-accentGold/30 focus:outline-none rounded-xl py-3.5 px-4 text-xs text-white placeholder-gray-500" />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-muted font-bold uppercase tracking-wider">Email Address</label>
                  <input type="email" required placeholder="e.g. guntass@example.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="bg-white/5 border border-white/10 focus:border-accentGold/30 focus:outline-none rounded-xl py-3.5 px-4 text-xs text-white placeholder-gray-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-muted font-bold uppercase tracking-wider">Password</label>
                  <input type="password" required placeholder="Enter password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="bg-white/5 border border-white/10 focus:border-accentGold/30 focus:outline-none rounded-xl py-3.5 px-4 text-xs text-white placeholder-gray-500" />
                </div>
                <button type="submit" disabled={regLoading} className="bg-gradient-to-r from-accentGold to-accentLightGold text-primary font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-accentGold/10 hover:shadow-accentGold/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
                  {regLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {regLoading ? (isLogin ? "Signing In..." : "Creating Profile...") : (isLogin ? "Sign In" : "Start Investing")}
                </button>
                <div className="text-center text-xs text-muted mt-2">
                  {isLogin ? "New to Simplify Gold? " : "Already have an account? "}
                  <button type="button" onClick={() => { setIsLogin(!isLogin); setRegName(''); setRegEmail(''); setRegPassword(''); setAuthError(''); }} className="text-accentGold hover:underline font-semibold">
                    {isLogin ? "Register here" : "Sign in here"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════ MODAL 2: BUY DIGITAL GOLD ══════════ */}
      <AnimatePresence>
        {showBuyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBuyModal(false)} className="absolute inset-0 bg-primary/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }} className="glass-card border-white/10 w-full max-w-md p-8 rounded-3xl relative z-10 text-left flex flex-col gap-6">
              <button onClick={() => setShowBuyModal(false)} className="absolute top-6 right-6 text-muted hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Coins className="w-5 h-5 text-accentGold" />
                  Buy Digital Gold
                </h3>
                <p className="text-muted text-xs">Accumulate 24K pure physical gold assets in your safe vault.</p>
              </div>

              {/* Live Price Banner */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted font-bold block uppercase tracking-wider">Current Market Price</span>
                  {goldPriceLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-accentGold mt-1" />
                  ) : (
                    <span className="text-xl font-black text-white">{goldPriceDisplay} <small className="text-xs text-muted font-normal">/gram</small></span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="bg-green-500/10 border border-green-500/20 py-1 px-3 rounded-lg text-[10px] font-bold text-green-400">
                    Live Rate
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {/* Amount input with quick-select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-muted font-bold uppercase tracking-wider">Investment Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">₹</span>
                    <input type="number" required placeholder="Enter amount" value={buyAmount} onChange={(e) => setBuyAmount(e.target.value)} className="w-full bg-white/5 border border-white/10 focus:border-accentGold/30 focus:outline-none rounded-xl py-3.5 pl-8 pr-4 text-sm font-bold text-white placeholder-gray-500" />
                  </div>
                  {/* Quick amounts */}
                  <div className="flex gap-2 mt-1">
                    {[100, 500, 1000, 5000].map(amt => (
                      <button key={amt} onClick={() => setBuyAmount(String(amt))} className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg border transition-colors ${buyAmount === String(amt) ? 'border-accentGold/40 text-accentGold bg-accentGold/10' : 'border-white/10 text-muted hover:border-white/20 hover:text-white'}`}>
                        ₹{amt >= 1000 ? `${amt / 1000}K` : amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity Summary */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Estimated gold to receive:</span>
                    <span className="font-black text-accentLightGold text-sm">{estimatedGrams} grams</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Gold purity:</span>
                    <span className="font-semibold text-white">24K — 99.9% pure</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Transaction fees:</span>
                    <span className="font-semibold text-green-400">₹0 (Free)</span>
                  </div>
                  <div className="border-t border-white/5 pt-2 flex justify-between text-xs">
                    <span className="text-muted font-semibold">Total payable:</span>
                    <span className="font-black text-white">₹{(parseFloat(buyAmount) || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button onClick={handlePurchase} disabled={buyLoading || !buyAmount || parseFloat(buyAmount) <= 0} className="w-full bg-gradient-to-r from-accentGold to-accentLightGold text-primary font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-accentGold/10 hover:shadow-accentGold/20 flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]">
                  {buyLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {buyLoading ? "Authorizing Payment..." : "Confirm Purchase"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════ MODAL 3: SUCCESS CELEBRATION ══════════ */}
      <AnimatePresence>
        {showSuccessModal && latestTxn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/90 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 15 }}
              className="glass-card border-accentGold/20 w-full max-w-md p-8 rounded-3xl relative z-10 text-center flex flex-col items-center gap-5"
            >
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400"
              >
                <CheckCircle className="w-10 h-10" />
              </motion.div>

              <div className="flex flex-col gap-1.5">
                <h3 className="text-2xl font-black text-white">🎉 Congratulations!</h3>
                <p className="text-muted text-xs">Your gold has been added to your digital vault.</p>
              </div>

              {/* Transaction Receipt */}
              <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col gap-3 text-left text-xs">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-muted">Transaction ID</span>
                  <span className="font-mono font-bold text-white text-[10px]">{latestTxn.transaction_id}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-muted">Amount Paid</span>
                  <span className="font-bold text-white">₹{(latestTxn.amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-muted">Gold Received</span>
                  <span className="font-extrabold text-accentLightGold">{latestTxn.gold_quantity} grams</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Status</span>
                  <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-bold py-0.5 px-2 rounded-full">SUCCESS</span>
                </div>
              </div>

              {/* Cumulative Holdings */}
              {totalGoldOwned > 0 && (
                <div className="w-full bg-accentGold/5 border border-accentGold/15 rounded-2xl p-4 flex flex-col gap-1 text-center">
                  <p className="text-[10px] text-accentLightGold font-bold uppercase tracking-wider">Your Total Gold Holdings</p>
                  <p className="text-2xl font-black text-white">{totalGoldOwned.toFixed(4)} <span className="text-sm">grams</span></p>
                  <p className="text-[10px] text-muted">
                    Current value: <span className="text-accentLightGold font-bold">₹{currentPortfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </p>
                </div>
              )}

              <div className="w-full flex gap-3">
                <button
                  onClick={() => { setShowSuccessModal(false); setActiveTab('history'); }}
                  className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3 rounded-xl text-xs transition-all"
                >
                  View History
                </button>
                <button
                  onClick={() => { setShowSuccessModal(false); setActiveTab('dashboard'); }}
                  className="flex-1 bg-gradient-to-r from-accentGold to-accentLightGold text-primary font-bold py-3 rounded-xl text-xs transition-all shadow-lg shadow-accentGold/10 hover:shadow-accentGold/25 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
