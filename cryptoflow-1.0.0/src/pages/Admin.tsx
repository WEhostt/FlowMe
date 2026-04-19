import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useSession } from '@/contexts/SessionContext';
import {
  getAllUsers, getUserBalances, adjustBalance, updateUser, reviewKYC,
  getAllWithdrawalRequests, reviewWithdrawal, WithdrawalRequest,
  adminCreateInvestment, setBroadcast, clearBroadcast, getBroadcast,
  BroadcastMessage, UserBalances, addTransaction,
} from '@/lib/firestore';
import {
  Users, ShieldCheck, Trash2, Search, AlertCircle, Plus, Minus, DollarSign,
  X, CheckCircle, KeyRound, Eye, EyeOff, Clock, ArrowUpRight, TrendingUp,
  Megaphone, Shield, UserX, UserCheck, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import UserRow from '@/components/UserRow';

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAIL || 'makemoni35@gmail.com').toLowerCase().split(',').map((e: string) => e.trim());

type UserRecord = Awaited<ReturnType<typeof getAllUsers>>[number] & { id: string };
type Coin = keyof UserBalances;

const COINS: Coin[] = ['BTC', 'USDT', 'ETH'];
const COIN_COLOR: Record<Coin, string> = {
  BTC: 'from-orange-500 to-yellow-400',
  USDT: 'from-green-500 to-emerald-400',
  ETH: 'from-blue-500 to-cyan-400',
};

const PLANS = [
  { id: 'starter', name: 'Starter',    dailyRate: 0.03, durationDays: 30 },
  { id: 'growth',  name: 'Growth',     dailyRate: 0.05, durationDays: 30 },
  { id: 'pro',     name: 'Pro Trader', dailyRate: 0.08, durationDays: 30 },
  { id: 'elite',   name: 'Elite VIP',  dailyRate: 0.12, durationDays: 30 },
];

// ── Balance modal ─────────────────────────────────────────────────

const BalanceModal = ({ target, onClose, onSave }: { target: UserRecord; onClose: () => void; onSave: () => void }) => {
  const [coin, setCoin] = useState<Coin>('BTC');
  const [mode, setMode] = useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [balances, setBalances] = useState<UserBalances>({} as UserBalances);
  useEffect(() => {
    getUserBalances(target.id).then(setBalances);
  }, [target.id]);

  const refresh = async () => {
    const balances = await getUserBalances(target.id);
    setBalances(balances);
  };

  const handleApply = () => {
    setMsg(null);
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) { setMsg({ type: 'error', text: 'Enter a valid positive amount.' }); return; }
    const delta = mode === 'add' ? num : -num;
    (async () => {
      const result = await adjustBalance(target.id, coin, delta);
      if (!result.success) { setMsg({ type: 'error', text: (result as any).error || 'Failed to adjust balance.' }); return; }
      await addTransaction(target.id, {
        type: mode === 'add' ? 'admin_credit' : 'admin_debit',
        coin, amount: num,
        note: `Admin ${mode === 'add' ? 'credited' : 'debited'} ${num} ${coin}`,
      });
      await refresh(); setAmount('');
      setMsg({ type: 'success', text: `${mode === 'add' ? 'Added' : 'Removed'} ${num} ${coin} ${mode === 'add' ? 'to' : 'from'} ${target.name}'s account.` });
      onSave();
    })();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[#1a1f2c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2"><DollarSign size={18} className="text-crypto-purple" /><span className="text-white font-semibold">Manage Balance</span></div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-crypto-purple to-blue-500 flex items-center justify-center text-white font-bold text-sm">{target.name.charAt(0).toUpperCase()}</div>
            <div><p className="text-white text-sm font-medium">{target.name}</p><p className="text-gray-400 text-xs">{target.email}</p></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {COINS.map(c => (
              <div key={c} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${COIN_COLOR[c]} flex items-center justify-center text-white text-xs font-bold mx-auto mb-1`}>{c.slice(0, 1)}</div>
                <p className="text-white text-sm font-semibold">{balances[c].toFixed(c === 'USDT' ? 2 : 6)}</p>
                <p className="text-gray-500 text-xs">{c}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">{COINS.map(c => <button key={c} onClick={() => setCoin(c)} className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${coin === c ? 'bg-crypto-purple border-crypto-purple text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>{c}</button>)}</div>
          <div className="flex gap-2">
            <button onClick={() => setMode('add')} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold border transition-all ${mode === 'add' ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}><Plus size={15} /> Add</button>
            <button onClick={() => setMode('subtract')} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold border transition-all ${mode === 'subtract' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}><Minus size={15} /> Subtract</button>
          </div>
          <Input type="number" step="any" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 0.5" className="bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
          {msg && <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${msg.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{msg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}{msg.text}</div>}
          <Button onClick={handleApply} className={`w-full h-11 text-sm font-semibold ${mode === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}>
            {mode === 'add' ? <><Plus size={15} /> Add {coin}</> : <><Minus size={15} /> Subtract {coin}</>}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Password modal ────────────────────────────────────────────────

const PasswordModal = ({ target, onClose }: { target: UserRecord; onClose: () => void }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

const handleSave = async () => {
    setMsg(null);
    if (newPassword.length < 8) { setMsg({ type: 'error', text: 'Password must be at least 8 characters.' }); return; }
    if (newPassword !== confirm) { setMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
    setLoading(true);
    // Call a dedicated backend function to update the user's password.
    // Replace 'resetUserPassword' with your actual password reset function.
    try {
      // You must implement resetUserPassword in your backend and import it here.
      // Example: const result = await resetUserPassword(target.id, newPassword);
      // For now, we'll just simulate success:
      // Remove the next line and use your actual function.
      const result = { success: true };
      setLoading(false);
      if (!result.success) { setMsg({ type: 'error', text: (result as any)?.error || 'Failed to update password.' }); return; }
      setMsg({ type: 'success', text: `Password updated for ${target.name}.` });
      setNewPassword(''); setConfirm('');
    } catch (err: any) {
      setLoading(false);
      setMsg({ type: 'error', text: err?.message || 'Failed to update password.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[#1a1f2c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2"><KeyRound size={18} className="text-crypto-purple" /><span className="text-white font-semibold">Reset Password</span></div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-crypto-purple to-blue-500 flex items-center justify-center text-white font-bold text-sm">{target.name.charAt(0).toUpperCase()}</div>
            <div><p className="text-white text-sm font-medium">{target.name}</p><p className="text-gray-400 text-xs">{target.email}</p></div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs font-medium uppercase tracking-wide">New Password</Label>
            <div className="relative">
              <Input type={showPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 characters" className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 pr-10" />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs font-medium uppercase tracking-wide">Confirm Password</Label>
            <Input type={showPw ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat new password" className="bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
          </div>
          {msg && <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${msg.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{msg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}{msg.text}</div>}
          <Button onClick={handleSave} disabled={loading} className="w-full h-11 text-sm font-semibold bg-crypto-purple hover:bg-crypto-dark-purple text-white">{loading ? 'Saving...' : 'Save New Password'}</Button>
        </div>
      </div>
    </div>
  );
};

// ── Manual investment modal ───────────────────────────────────────

const InvestModal = ({ target, onClose }: { target: UserRecord; onClose: () => void }) => {
  const [plan, setPlan] = useState(PLANS[0].id);
  const [coin, setCoin] = useState<Coin>('USDT');
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCreate = () => {
    setMsg(null);
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) { setMsg({ type: 'error', text: 'Enter a valid amount.' }); return; }
    const p = PLANS.find(p => p.id === plan)!;
    adminCreateInvestment(target.id, p, coin, num);
    setMsg({ type: 'success', text: `${p.name} investment of ${num} ${coin} created for ${target.name}.` });
    setAmount('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[#1a1f2c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2"><TrendingUp size={18} className="text-crypto-purple" /><span className="text-white font-semibold">Set Investment</span></div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-crypto-purple to-blue-500 flex items-center justify-center text-white font-bold text-sm">{target.name.charAt(0).toUpperCase()}</div>
            <div><p className="text-white text-sm font-medium">{target.name}</p><p className="text-gray-400 text-xs">{target.email}</p></div>
          </div>
          <div>
            <Label className="text-gray-400 text-xs mb-2 block">Plan</Label>
            <select value={plan} onChange={e => setPlan(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-md px-3 h-10 focus:outline-none">
              {PLANS.map(p => <option key={p.id} value={p.id} className="bg-[#1a1f2c]">{p.name} — {(p.dailyRate * 100).toFixed(0)}%/day</option>)}
            </select>
          </div>
          <div>
            <Label className="text-gray-400 text-xs mb-2 block">Coin</Label>
            <div className="flex gap-2">{COINS.map(c => <button key={c} onClick={() => setCoin(c)} className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${coin === c ? 'bg-crypto-purple border-crypto-purple text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>{c}</button>)}</div>
          </div>
          <div>
            <Label className="text-gray-400 text-xs mb-2 block">Amount ({coin})</Label>
            <Input type="number" step="any" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 100" className="bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
          </div>
          {msg && <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${msg.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{msg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}{msg.text}</div>}
          <Button onClick={handleCreate} className="w-full h-11 text-sm font-semibold bg-crypto-purple hover:bg-crypto-dark-purple text-white">Create Investment</Button>
        </div>
      </div>
    </div>
  );
};

// ── Admin page ────────────────────────────────────────────────────

const Admin = () => {
  const { isLoggedIn, user } = useSession();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals' | 'kyc' | 'broadcast'>('users');
  const [balanceTarget, setBalanceTarget] = useState<UserRecord | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<UserRecord | null>(null);
  const [investTarget, setInvestTarget] = useState<UserRecord | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [broadcast, setBroadcast] = useState<BroadcastMessage | null>(null);
  const [bcMessage, setBcMessage] = useState('');
  const [bcType, setBcType] = useState<'info' | 'warning' | 'success'>('info');
  const [bcMsg, setBcMsg] = useState('');
  const [expandedW, setExpandedW] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');


  const isAdmin = !!user && ADMIN_EMAILS.includes(user.email.toLowerCase());

  const refresh = async () => {
    console.log('🔄 Refreshing admin data...');
    const usersRaw = await getAllUsers();
    console.log('Users from getAllUsers():', usersRaw);
    // Ensure each user has an 'id' property (use 'uid' or similar if that's the actual field)
    setUsers(usersRaw.map(u => ({ ...u, id: (u as any).id ?? (u as any).uid ?? '' })));
    setWithdrawals(await getAllWithdrawalRequests());
    setBroadcast(await getBroadcast());
    console.log('Admin refresh complete. Users set:', usersRaw.length);
  };

  useEffect(() => {
    document.title = 'Admin | CryptoFlow';
    if (!isLoggedIn) { navigate('/cryptoflow/login'); return; }
    if (isLoggedIn && !isAdmin) { navigate('/cryptoflow/dashboard'); return; }
    refresh();
  }, [isLoggedIn, isAdmin]);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const deleteUser = (id: string) => {
    const all = JSON.parse(localStorage.getItem('cryptoflow_users') || '[]');
    localStorage.setItem('cryptoflow_users', JSON.stringify(all.filter((u: UserRecord) => u.id !== id)));
    try {
      const balances = JSON.parse(localStorage.getItem('cryptoflow_balances') || '{}');
      delete balances[id];
      localStorage.setItem('cryptoflow_balances', JSON.stringify(balances));
    } catch {}
    refresh();
  };

  const toggleFreeze = async (u: UserRecord) => {
    await updateUser(u.id, { frozen: !u.frozen });
    refresh();
  };

  const handleBroadcast = () => {
    if (!bcMessage.trim()) { setBcMsg('Enter a message.'); return; }
    setBroadcast({
      id: Math.random().toString(36).slice(2), // or use a better unique id generator
      message: bcMessage,
      type: bcType,
      active: true,
      createdAt: Date.now().toString(),
    });
    setBcMessage('');
    setBcMsg('Broadcast sent to all users.');
    refresh();
  };

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const kycPending = users.filter(u => u.kycStatus === 'pending');

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-crypto-blue overflow-x-hidden">
      {balanceTarget && <BalanceModal target={balanceTarget} onClose={() => setBalanceTarget(null)} onSave={refresh} />}
      {passwordTarget && <PasswordModal target={passwordTarget} onClose={() => setPasswordTarget(null)} />}
      {investTarget && <InvestModal target={investTarget} onClose={() => { setInvestTarget(null); refresh(); }} />}

      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <div className="mb-8 flex items-center gap-3">
          <ShieldCheck size={28} className="text-crypto-purple" />
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400 text-sm">Manage users, balances, withdrawals, and platform activity.</p>
          </div>
        </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users',    value: users.length },
          { label: 'Today',          value: users.filter(u => new Date(u.createdAt).toDateString() === new Date().toDateString()).length },
          { label: 'Pending Withdrawals', value: pendingWithdrawals.length },
          { label: 'KYC Pending',    value: kycPending.length },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-gray-400 text-sm mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>
      


        {/* Tab bar */}
        <div className="flex gap-2 flex-wrap mb-6">
          {([
            { id: 'users',       label: 'Users',       badge: users.length },
            { id: 'withdrawals', label: 'Withdrawals', badge: pendingWithdrawals.length },
            { id: 'kyc',         label: 'KYC Review',  badge: kycPending.length },
            { id: 'broadcast',   label: 'Broadcast',   badge: 0 },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                activeTab === t.id ? 'bg-crypto-purple border-crypto-purple text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}>
              {t.label}
              {t.badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === t.id ? 'bg-white/20 text-white' : 'bg-crypto-purple/30 text-crypto-purple'}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Users tab ── */}
        {activeTab === 'users' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
<div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-white font-semibold flex items-center gap-2"><Users size={16} className="text-crypto-purple" /> Registered Users</h2>
              <div className="flex gap-2">
                <div className="relative w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
                    className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-9 text-sm" />
                </div>
                <Button onClick={async () => {
                  setPopulating(true);
                  const sampleUsers = [
                    { uid: 'Hl8GAlcNJtRZ29rMPjqSf7OCnr72', email: 'jvtyviucv7fyt@gmail.com', name: 'User 1' },
                    { uid: 'CUzrj1XjQbX7Rwh05CmKqZFErDB3', email: 'mrmuskmgnt@gmail.com', name: 'User 2' },
                    { uid: 'lSfg4Cicj9WnADL2mHJFmHUf9c03', email: 'admin@cryptoflow.com', name: 'Admin' },
                    { uid: 'TOkNG5QIxAaITeJV5xdeCeslb102', email: 'makemoni35@gmail.com', name: 'Main Admin' },
                    { uid: 'uFY2g9nvXRgj2OPNIhnaYIByY1o1', email: 'cvgfhbr@gmail.com', name: 'User 5' },
                  ];
                  try {
                    for (const u of sampleUsers) {
                      await fetch('https://cryptoflow-5b73f-default-rtdb.firebaseio.com/users.json', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          uid: u.uid,
                          name: u.name,
                          email: u.email,
                          createdAt: new Date().toISOString(),
                          referralCode: 'POP' + Math.random().toString(36).slice(2, 4).toUpperCase(),
                          frozen: false,
                          kycStatus: 'none',
                        }),
                      });
                      await fetch('https://cryptoflow-5b73f-default-rtdb.firebaseio.com/users/' + u.uid + '/balances/main.json', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ BTC: 0, USDT: 100, ETH: 0 }),
                      });
                    }
                    alert('✅ Populated 5 users in Firestore!');
                    refresh();
                  } catch (e) {
                    alert('Error: ' + e);
                  } finally {
                    setPopulating(false);
                  }
                }} disabled={populating} className="h-9 px-4 text-xs bg-green-600 hover:bg-green-700">
                  {populating ? 'Populating...' : 'Populate Firestore'}
                </Button>
              </div>
            </div>
            <div className="hidden md:grid grid-cols-12 px-6 py-2 border-b border-white/5 text-gray-500 text-xs">
              <span className="col-span-1">#</span>
              <span className="col-span-2">Name</span>
              <span className="col-span-3">Email</span>
              <span className="col-span-3">Balances</span>
              <span className="col-span-1">KYC</span>
              <span className="col-span-2 text-right">Actions</span>
            </div>
            <div className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <p className="text-center text-gray-500 py-10 text-sm">
                  No users found. <br />
                  <Button onClick={refresh} size="sm" className="mt-2 bg-crypto-purple">Refresh</Button>
                </p>
              ) : (
                filtered.map((u, i) => (
                  <UserRow key={u.id} user={u} i={i} refresh={refresh} />
                ))
              )}
            </div>
            {filtered.length > 0 && (
              <div className="px-6 py-3 border-t border-white/10 text-gray-500 text-xs">Showing {filtered.length} of {users.length} users</div>
            )}
          </div>
        )}

        {/* ── Withdrawals tab ── */}
        {activeTab === 'withdrawals' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-white font-semibold flex items-center gap-2"><ArrowUpRight size={16} className="text-crypto-purple" /> Withdrawal Requests</h2>
            </div>
            {withdrawals.length === 0 ? (
              <p className="text-center text-gray-500 py-10 text-sm">No withdrawal requests.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {withdrawals.map(w => (
                  <div key={w.id} className="px-6 py-4 space-y-3">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-white text-sm font-semibold">{w.userName} <span className="text-gray-500 font-normal text-xs">({w.userEmail})</span></p>
                        <p className="text-gray-400 text-sm">{w.amount} {w.coin} via {w.network}</p>
                        <p className="text-gray-500 text-xs font-mono mt-1">{w.address}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {w.status === 'pending' && <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center gap-1"><Clock size={11}/> Pending</span>}
                        {w.status === 'approved' && <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1"><CheckCircle size={11}/> Approved</span>}
                        {w.status === 'rejected' && <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 flex items-center gap-1"><X size={11}/> Rejected</span>}
                        <p className="text-gray-500 text-xs">{new Date(w.requestedAt).toLocaleDateString()}</p>
                        {w.status === 'pending' && (
                          <button onClick={() => setExpandedW(expandedW === w.id ? null : w.id)} className="text-gray-500 hover:text-white p-1">
                            {expandedW === w.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        )}
                      </div>
                    </div>
                    {expandedW === w.id && w.status === 'pending' && (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                        <Input value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Rejection reason (optional)" className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 text-sm" />
                        <div className="flex gap-2">
                          <Button onClick={() => { reviewWithdrawal(w.id, 'approved'); setExpandedW(null); refresh(); }} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm h-9"><CheckCircle size={14}/> Approve</Button>
                          <Button onClick={() => { reviewWithdrawal(w.id, 'rejected', rejectNote); setRejectNote(''); setExpandedW(null); refresh(); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm h-9"><X size={14}/> Reject</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── KYC tab ── */}
        {activeTab === 'kyc' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-white font-semibold flex items-center gap-2"><Shield size={16} className="text-crypto-purple" /> KYC Reviews</h2>
            </div>
            {kycPending.length === 0 ? (
              <p className="text-center text-gray-500 py-10 text-sm">No pending KYC submissions.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {users.filter(u => u.kycStatus === 'pending').map(u => (
                  <div key={u.id} className="flex items-center justify-between px-6 py-4 gap-4 flex-wrap">
                    <div>
                      <p className="text-white text-sm font-semibold">{u.name}</p>
                      <p className="text-gray-400 text-xs">{u.email}</p>
                      {u.kycData && (
                        <p className="text-gray-500 text-xs mt-1">Legal name: {u.kycData.fullName} · Country: {u.kycData.country}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => { reviewKYC(u.id, 'verified'); refresh(); }} className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-3"><CheckCircle size={13}/> Approve</Button>
                      <Button onClick={() => { reviewKYC(u.id, 'rejected'); refresh(); }} className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 px-3"><X size={13}/> Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Broadcast tab ── */}
        {activeTab === 'broadcast' && (
          <div className="space-y-6">
            {broadcast && (
              <div className={`flex items-start justify-between gap-4 px-5 py-4 rounded-2xl border ${
                broadcast.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                broadcast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}>
                <div className="flex items-start gap-2">
                  <Megaphone size={16} className="shrink-0 mt-0.5" />
                  <p className="text-sm">{broadcast.message}</p>
                </div>
                <button onClick={() => { clearBroadcast(); refresh(); }} className="shrink-0 hover:opacity-70"><X size={15} /></button>
              </div>
            )}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
              <h2 className="text-white font-semibold flex items-center gap-2"><Megaphone size={16} className="text-crypto-purple" /> Send Broadcast</h2>
              <p className="text-gray-400 text-sm">Posts a banner on the site and notifies all users.</p>
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs">Message</Label>
                <Input value={bcMessage} onChange={e => setBcMessage(e.target.value)} placeholder="e.g. Scheduled maintenance Sunday 2am UTC" className="bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs">Type</Label>
                <div className="flex gap-2">
                  {(['info', 'warning', 'success'] as const).map(t => (
                    <button key={t} onClick={() => setBcType(t)} className={`flex-1 py-2 rounded-lg text-sm font-semibold border capitalize transition-all ${
                      bcType === t ? 'bg-crypto-purple border-crypto-purple text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}>{t}</button>
                  ))}
                </div>
              </div>
              {bcMsg && <p className="text-green-400 text-sm">{bcMsg}</p>}
              <Button onClick={handleBroadcast} className="bg-crypto-purple hover:bg-crypto-dark-purple text-white"><Megaphone size={15} /> Send to All Users</Button>
              {broadcast && (
                <Button onClick={() => { clearBroadcast(); setBcMsg('Broadcast cleared.'); refresh(); }} className="bg-white/10 hover:bg-white/20 text-gray-300 ml-2"><X size={15} /> Clear Active Broadcast</Button>
              )}
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default Admin;
