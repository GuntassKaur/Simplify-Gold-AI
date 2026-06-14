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
  Gift
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

export default function App() {
  // Navigation & User State
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'chat'>('home');
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('simplify_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Modals & Flows
  const [showRegModal, setShowRegModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Form Inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [buyAmount, setBuyAmount] = useState('500');

  // Loading States
  const [regLoading, setRegLoading] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Data States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [latestTxn, setLatestTxn] = useState<any | null>(null);
  const [goldPrice] = useState(9800); // Current gold price per gram

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

  // Fetch Transactions when User is available
  useEffect(() => {
    if (user) {
      fetchTransactions(user.id);
    }
  }, [user]);

  const fetchTransactions = async (userId: number) => {
    try {
      const res = await fetch(`/api/transactions/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  // Handlers
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) return;

    setRegLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail })
      });
      const data = await res.json();
      if (res.ok && data.id) {
        const profile: UserProfile = { id: data.id, name: data.name, email: data.email };
        setUser(profile);
        localStorage.setItem('simplify_user', JSON.stringify(profile));
        setShowRegModal(false);
        setActiveTab('dashboard');
      } else {
        alert(data.detail || "Failed to create profile. Email might be already registered.");
      }
    } catch (err) {
      alert("Error connecting to server.");
    } finally {
      setRegLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('simplify_user');
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
        setTimeout(() => {
          setShowBuyModal(true);
        }, 1200);
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
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount: amountVal })
      });
      const data = await res.json();

      if (data.status === 'SUCCESS') {
        setLatestTxn(data);
        setShowBuyModal(false);
        setShowSuccessModal(true);
        fetchTransactions(user.id);
      } else {
        alert("Purchase failed. Please try again.");
      }
    } catch (err) {
      alert("Error completing purchase.");
    } finally {
      setBuyLoading(false);
    }
  };

  // Calculations
  const totalGoldOwned = transactions.reduce((acc, curr) => acc + curr.gold_quantity, 0);
  const totalAmountInvested = transactions.reduce((acc, curr) => acc + curr.amount, 0);
  const currentPortfolioValue = totalGoldOwned * goldPrice;
  const netReturn = currentPortfolioValue - totalAmountInvested;
  const returnPercentage = totalAmountInvested > 0 ? (netReturn / totalAmountInvested) * 100 : 0;

  // Suggested prompts
  const suggestedPrompts = [
    "Should I invest in gold?",
    "Gold ETF vs Digital Gold",
    "Is now a good time to buy gold?"
  ];

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
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <button 
              onClick={() => setActiveTab('home')}
              className={`hover:text-accentGold transition-colors duration-200 ${activeTab === 'home' ? 'text-accentGold font-bold' : 'text-muted'}`}
            >
              Home
            </button>
            <button 
              onClick={() => {
                if (!user) setShowRegModal(true);
                else setActiveTab('dashboard');
              }}
              className={`hover:text-accentGold transition-colors duration-200 ${activeTab === 'dashboard' ? 'text-accentGold font-bold' : 'text-muted'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => {
                if (!user) setShowRegModal(true);
                else setActiveTab('chat');
              }}
              className={`hover:text-accentGold transition-colors duration-200 ${activeTab === 'chat' ? 'text-accentGold font-bold' : 'text-muted'}`}
            >
              AI Assistant
            </button>
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 md:px-12 flex flex-col">
        <AnimatePresence mode="wait">
          {/* TAB 1: LANDING PAGE */}
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
                  
                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <button 
                      onClick={() => {
                        if (!user) setShowRegModal(true);
                        else setActiveTab('chat');
                      }}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-accentGold to-accentLightGold text-primary font-bold py-3.5 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-accentGold/10 hover:shadow-accentGold/25 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Ask AI Assistant
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        if (!user) setShowRegModal(true);
                        else setActiveTab('dashboard');
                      }}
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
                    {/* Rotating Rings */}
                    <div className="absolute inset-0 rounded-full border border-white/5 animate-[spin_12s_linear_infinite]" />
                    <div className="absolute inset-6 rounded-full border border-dashed border-accentGold/20 animate-[spin_8s_linear_infinite_reverse]" />
                    
                    {/* Glowing backdrop */}
                    <div className="absolute w-48 h-48 bg-accentGold/10 rounded-full blur-[40px]" />

                    {/* Floating Gold Coin */}
                    <motion.div 
                      animate={{ 
                        y: [0, -15, 0],
                        rotateY: [0, 180, 360]
                      }}
                      transition={{ 
                        y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                        rotateY: { duration: 15, repeat: Infinity, ease: "linear" }
                      }}
                      className="w-44 h-44 rounded-full bg-gradient-to-br from-yellow-300 via-accentGold to-amber-600 shadow-2xl shadow-accentGold/40 flex items-center justify-center relative cursor-pointer border-4 border-yellow-200/50"
                    >
                      <Coins className="w-20 h-20 text-white/90 drop-shadow-lg" />
                      <div className="absolute inset-2 rounded-full border border-yellow-200/20" />
                    </motion.div>
                    
                    {/* Mini floating elements */}
                    <div className="absolute top-10 left-10 animate-float-slow bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-lg">
                      <TrendingUp className="w-5 h-5 text-accentLightGold" />
                    </div>
                    <div className="absolute bottom-12 right-6 animate-float-medium bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-lg">
                      <Lock className="w-5 h-5 text-green-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Features section */}
              <div className="mt-24 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 text-left">
                  <div className="w-12 h-12 rounded-xl bg-accentGold/10 border border-accentGold/25 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-accentLightGold" />
                  </div>
                  <h3 className="font-bold text-lg">AI-Powered Advice</h3>
                  <p className="text-muted text-sm leading-relaxed">
                    Ask intelligent questions about gold prices, markets, and investment strategy directly from our custom assistant.
                  </p>
                </div>
                <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 text-left">
                  <div className="w-12 h-12 rounded-xl bg-accentGold/10 border border-accentGold/25 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-accentLightGold" />
                  </div>
                  <h3 className="font-bold text-lg">Instant Purity</h3>
                  <p className="text-muted text-sm leading-relaxed">
                    Invest in 24K pure 99.9% hallmarked digital gold instantly without handling fees or lockers.
                  </p>
                </div>
                <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 text-left">
                  <div className="w-12 h-12 rounded-xl bg-accentGold/10 border border-accentGold/25 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-accentLightGold" />
                  </div>
                  <h3 className="font-bold text-lg">100% Safe Vaults</h3>
                  <p className="text-muted text-sm leading-relaxed">
                    Your digital assets are secured in institutional-grade vaults and insured for ultimate peace of mind.
                  </p>
                </div>
                <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 text-left">
                  <div className="w-12 h-12 rounded-xl bg-accentGold/10 border border-accentGold/25 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-accentLightGold" />
                  </div>
                  <h3 className="font-bold text-lg">Live Updates</h3>
                  <p className="text-muted text-sm leading-relaxed">
                    Track live gold price fluctuations per gram, review transaction history, and buy instantly.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: PORTFOLIO DASHBOARD */}
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
                <button
                  onClick={() => setShowBuyModal(true)}
                  className="bg-gradient-to-r from-accentGold to-accentLightGold text-primary font-extrabold py-3 px-6 rounded-xl shadow-lg shadow-accentGold/15 hover:shadow-accentGold/25 flex items-center justify-center gap-2 self-start md:self-auto hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Buy Digital Gold
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              {/* Grid Dashboard Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Gold Price Card */}
                <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-muted text-xs font-semibold">
                    <span>Live Gold Price</span>
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-black">₹{goldPrice.toLocaleString()}</span>
                    <span className="text-muted text-xs block mt-1">per gram (24K, 99.9% pure)</span>
                  </div>
                  <div className="mt-4 bg-green-500/10 border border-green-500/20 py-1 px-3 rounded-lg text-[10px] font-bold text-green-400 w-fit">
                    +1.2% Today
                  </div>
                </div>

                {/* Portfolio Value Card */}
                <div className="glass-card p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accentGold/5 rounded-full blur-2xl" />
                  <div className="flex items-center justify-between text-muted text-xs font-semibold">
                    <span>Portfolio Value</span>
                    <Wallet className="w-4 h-4 text-accentGold" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-black text-accentLightGold">
                      ₹{currentPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-muted text-xs block mt-1">Based on live gold price</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    {returnPercentage >= 0 ? (
                      <span className="text-green-400 text-xs font-bold flex items-center gap-0.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{returnPercentage.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-red-400 text-xs font-bold flex items-center gap-0.5">
                        <TrendingDown className="w-3.5 h-3.5" />
                        {returnPercentage.toFixed(2)}%
                      </span>
                    )}
                    <span className="text-muted text-xs">Total Returns</span>
                  </div>
                </div>

                {/* Total Gold Purchased */}
                <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-muted text-xs font-semibold">
                    <span>Total Gold Balance</span>
                    <Coins className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-black">{totalGoldOwned.toFixed(4)} <small className="text-sm">g</small></span>
                    <span className="text-muted text-xs block mt-1">Secured in digital vault</span>
                  </div>
                  <div className="mt-4 text-muted text-xs">
                    Invested Amount: <span className="font-bold text-white">₹{totalAmountInvested}</span>
                  </div>
                </div>

                {/* Investment Insights */}
                <div className="glass-card p-6 rounded-2xl flex flex-col justify-between bg-gradient-to-br from-white/5 to-transparent border-white/5">
                  <div className="flex items-center justify-between text-muted text-xs font-semibold">
                    <span>AI Gold Insights</span>
                    <Sparkles className="w-4 h-4 text-accentGold" />
                  </div>
                  <div className="mt-2 text-xs text-gray-300 leading-relaxed">
                    "Gold acts as a key shield against inflation. A 10% asset allocation in gold is recommended to reduce risk during periods of high volatility."
                  </div>
                  <button 
                    onClick={() => setActiveTab('chat')}
                    className="mt-3 text-xs text-accentLightGold font-bold hover:underline flex items-center gap-1"
                  >
                    Ask AI details <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Graphic Chart + Transactions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Mock Chart Area */}
                <div className="lg:col-span-8 glass-card p-6 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base">Gold Price Performance</h3>
                    <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 text-xs">
                      <button className="py-1 px-2.5 rounded-md text-muted hover:text-white">1W</button>
                      <button className="py-1 px-2.5 rounded-md text-muted hover:text-white">1M</button>
                      <button className="py-1 px-2.5 rounded-md bg-accentGold text-primary font-bold">ALL</button>
                    </div>
                  </div>

                  {/* SVG Line Graph */}
                  <div className="w-full h-[220px] bg-white/[0.01] border border-white/5 rounded-xl relative overflow-hidden flex items-end">
                    <svg className="w-full h-[180px] p-2" viewBox="0 0 400 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Grid Lines */}
                      <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                      <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                      <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                      
                      {/* Glow Area */}
                      <path 
                        d="M0 100 Q100 80 200 40 T400 15 L400 100 Z" 
                        fill="url(#chartGlow)" 
                      />
                      {/* Performance Line */}
                      <path 
                        d="M0 100 Q100 80 200 40 T400 15" 
                        fill="none" 
                        stroke="#D4AF37" 
                        strokeWidth="2.5" 
                        strokeLinecap="round"
                      />
                    </svg>
                    
                    {/* Tooltip Overlay */}
                    <div className="absolute top-4 left-6 flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted font-semibold uppercase tracking-wider">Historical Trend</span>
                      <span className="text-xl font-bold text-accentLightGold">₹9,800 <small className="text-xs text-green-400 font-normal">+14.6% (1 Year)</small></span>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions List */}
                <div className="lg:col-span-4 glass-card p-6 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <History className="w-4.5 h-4.5 text-accentGold" />
                      Activity Log
                    </h3>
                    <span className="text-xs text-muted font-bold">{transactions.length} orders</span>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[220px] flex flex-col gap-3 pr-1">
                    {transactions.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                        <Info className="w-8 h-8 text-muted mb-2" />
                        <p className="text-xs text-muted font-semibold">No transactions recorded yet.</p>
                        <button 
                          onClick={() => setShowBuyModal(true)} 
                          className="mt-3 text-xs text-accentGold font-bold hover:underline"
                        >
                          Buy your first Gold gram
                        </button>
                      </div>
                    ) : (
                      transactions.map((txn) => (
                        <div 
                          key={txn.id} 
                          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-white">{txn.transaction_id}</span>
                            <span className="text-[10px] text-muted">
                              {new Date(txn.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-right flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-accentLightGold">+{txn.gold_quantity.toFixed(4)} g</span>
                            <span className="text-[10px] text-muted">₹{txn.amount}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: AI CHAT INTERFACE */}
          {activeTab === 'chat' && user && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-8 py-2 text-left h-[calc(100vh-120px)] max-h-[680px]"
            >
              {/* Sidebar Help */}
              <div className="hidden lg:flex lg:col-span-3 flex-col gap-4 h-full">
                <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-accentGold font-bold text-sm">
                    <Sparkles className="w-4 h-4" />
                    AI Core Expertise
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Simplify Gold AI is trained specifically to answer queries related to:
                  </p>
                  <ul className="text-xs text-gray-300 flex flex-col gap-2.5 list-disc pl-4">
                    <li>Digital Gold Benefits & Risks</li>
                    <li>Sovereign Gold Bonds (SGB)</li>
                    <li>Gold ETFs vs Physical Gold</li>
                    <li>Inflation hedging & Gold wealth strategies</li>
                  </ul>
                </div>

                <div className="glass-card p-5 rounded-2xl flex flex-col gap-3 bg-gradient-to-tr from-accentGold/5 to-transparent border-white/5">
                  <div className="flex items-center gap-2 text-accentLightGold font-bold text-xs">
                    <Gift className="w-4 h-4" />
                    Promo Offer
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Start investing today with as little as ₹1. Build your savings bit by bit!
                  </p>
                  <button 
                    onClick={() => setShowBuyModal(true)}
                    className="mt-1 text-[11px] font-bold text-accentGold hover:underline text-left"
                  >
                    Buy digital gold now &rarr;
                  </button>
                </div>
              </div>

              {/* Chat Panel */}
              <div className="lg:col-span-9 glass-card rounded-2xl flex flex-col overflow-hidden h-full">
                {/* Chat Header */}
                <div className="border-b border-white/5 py-4 px-6 flex items-center justify-between bg-white/[0.01]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accentGold/10 flex items-center justify-center border border-accentGold/20">
                      <Sparkles className="w-4.5 h-4.5 text-accentLightGold" />
                    </div>
                    <div>
                      <span className="font-extrabold text-sm block">Simplify Gold AI</span>
                      <span className="text-[10px] text-green-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages Box */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 max-h-[420px] min-h-[300px]">
                  {chatMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${msg.sender === 'user' ? 'bg-accentGold text-primary font-bold' : 'bg-white/5 border border-white/10'}`}>
                        {msg.sender === 'user' ? 'U' : <Sparkles className="w-3.5 h-3.5 text-accentLightGold" />}
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

                {/* Suggested Prompts (If chat is empty or just started) */}
                {chatMessages.length === 1 && !chatLoading && (
                  <div className="px-6 py-2 flex flex-wrap gap-2">
                    {suggestedPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setChatInput(p);
                        }}
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
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 px-6 text-center text-xs text-muted">
        <p>&copy; 2026 Simplify Gold AI. Powered by Gemini 2.5 Flash. All rights reserved.</p>
      </footer>

      {/* MODAL 1: PROFILE REGISTRATION */}
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
                onClick={() => setShowRegModal(false)}
                className="absolute top-6 right-6 text-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col gap-1.5">
                <h3 className="text-xl font-bold">Create Your Profile</h3>
                <p className="text-muted text-xs">Enter your details to initiate smart gold investing.</p>
              </div>

              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-muted font-bold uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Guntass Kaur"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="bg-white/5 border border-white/10 focus:border-accentGold/30 focus:outline-none rounded-xl py-3.5 px-4 text-xs text-white placeholder-gray-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-muted font-bold uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. guntass@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="bg-white/5 border border-white/10 focus:border-accentGold/30 focus:outline-none rounded-xl py-3.5 px-4 text-xs text-white placeholder-gray-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="bg-gradient-to-r from-accentGold to-accentLightGold text-primary font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-accentGold/10 hover:shadow-accentGold/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {regLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {regLoading ? "Creating Profile..." : "Start Investing"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: BUY DIGITAL GOLD */}
      <AnimatePresence>
        {showBuyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBuyModal(false)}
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
                onClick={() => setShowBuyModal(false)}
                className="absolute top-6 right-6 text-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Coins className="w-5 h-5 text-accentGold" />
                  Buy Digital Gold
                </h3>
                <p className="text-muted text-xs">Accumulate 24K pure physical gold assets in your safe vaults.</p>
              </div>

              {/* Price Banner */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted font-bold block uppercase tracking-wider">Current Market Price</span>
                  <span className="text-xl font-black text-white">₹{goldPrice.toLocaleString()} <small className="text-xs text-muted font-normal">/gram</small></span>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 py-1 px-3 rounded-lg text-[10px] font-bold text-green-400">
                  Live Rate
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-muted font-bold uppercase tracking-wider">Investment Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">₹</span>
                    <input
                      type="number"
                      required
                      placeholder="Enter amount"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-accentGold/30 focus:outline-none rounded-xl py-3.5 pl-8 pr-4 text-xs font-bold text-white placeholder-gray-500"
                    />
                  </div>
                </div>

                {/* Live quantity calculator */}
                <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 py-3 px-4 rounded-xl text-xs">
                  <span className="text-muted">Estimated gold to receive:</span>
                  <span className="font-black text-accentLightGold text-sm">
                    {((parseFloat(buyAmount) || 0) / goldPrice).toFixed(4)} grams
                  </span>
                </div>

                <button
                  onClick={handlePurchase}
                  disabled={buyLoading || !buyAmount || parseFloat(buyAmount) <= 0}
                  className="w-full bg-gradient-to-r from-accentGold to-accentLightGold text-primary font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-accentGold/10 hover:shadow-accentGold/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {buyLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {buyLoading ? "Authorizing Payment..." : "Confirm Purchase"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: SUCCESS CELEBRATION */}
      <AnimatePresence>
        {showSuccessModal && latestTxn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary/90 backdrop-blur-md" 
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 15 }}
              className="glass-card border-accentGold/20 w-full max-w-md p-8 rounded-3xl relative z-10 text-center flex flex-col items-center gap-6"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div className="flex flex-col gap-1.5">
                <h3 className="text-2xl font-black text-white">Purchase Successful</h3>
                <p className="text-muted text-xs">Your gold assets have been added to your vault.</p>
              </div>

              {/* Receipt info */}
              <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col gap-3 text-left text-xs">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-muted">Transaction ID</span>
                  <span className="font-mono font-bold text-white">{latestTxn.transaction_id}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-muted">Amount Paid</span>
                  <span className="font-bold text-white">₹{latestTxn.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Gold Quantity</span>
                  <span className="font-extrabold text-accentLightGold">{latestTxn.gold_quantity} grams</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setActiveTab('dashboard');
                }}
                className="w-full bg-gradient-to-r from-accentGold to-accentLightGold text-primary font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-accentGold/10 hover:shadow-accentGold/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                Go to Dashboard
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
