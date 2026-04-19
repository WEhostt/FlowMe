import { useState, useEffect } from 'react';
import { TrendingUp, Zap, Star, Crown, X, CheckCircle, AlertCircle, Clock, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession } from '@/contexts/SessionContext';
import {
  getUserBalances, createInvestment, getUserInvestments,
  claimInvestment, calcEarnings, ActiveInvestment, UserBalances,
} from '@/lib/firestore';

// ── Plan definitions ─────────────────────────────────────────────

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    icon: <TrendingUp size={22} />,
    dailyRate: 0.03,        // 3% daily
    durationDays: 30,
    minAmount: 460,
    color: 'from-blue-500 to-cyan-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    badge: null,
    desc: 'Perfect for beginners. 3% daily returns over 30 days.',
  },
  {
    id: 'growth',
    name: 'Growth',
    icon: <Zap size={22} />,
    dailyRate: 0.05,        // 5% daily
    durationDays: 30,
    minAmount: 1300,
    color: 'from-crypto-purple to-indigo-400',
    border: 'border-crypto-purple/30',
    bg: 'bg-crypto-purple/10',
    badge: 'Popular',
    desc: 'Balanced plan with 5% daily returns over 30 days.',
  },
  {
    id: 'pro',
    name: 'Pro Trader',
    icon: <Star size={22} />,
    dailyRate: 0.08,        // 8% daily
    durationDays: 30,
    minAmount: 4000,
    color: 'from-yellow-400 to-orange-500',
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/10',
    badge: 'High Yield',
    desc: 'For serious investors. 8% daily returns over 30 days.',
  },
  {
    id: 'elite',
    name: 'Elite VIP',
    icon: <Crown size={22} />,
    dailyRate: 0.12,        // 12% daily
    durationDays: 30,
    minAmount: 10000,
    color: 'from-pink-500 to-rose-500',
    border: 'border-pink-500/30',
    bg: 'bg-pink-500/10',
    badge: 'VIP',
    desc: 'Maximum returns. 12% daily for 30 days.',
  },
];

const COINS: (keyof UserBalances)[] = ['USDT', 'BTC', 'ETH'];

const APPROX_PRICE: Record<keyof UserBalances, number> = {
  BTC:  65000,
  USDT: 1,
  ETH:  3200,
};

// ── Invest Modal ─────────────────────────────────────────────────

interface InvestModalProps {
  plan: typeof PLANS[0];
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

const InvestModal = ({ plan, onClose, onSuccess, userId }: InvestModalProps) => {
  const session = useSession();
  const userIdStr = userId || session.user?.uid || '';
  const balances = session.user?.balances || { BTC: 0, USDT: 0, ETH: 0 };
  const [coin, setCoin] = useState<keyof UserBalances>('USDT');
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  console.log('Modal balances:', balances, 'userId:', userIdStr);

  const amtNum = parseFloat(amount) || 0;
  const usdEquiv = amtNum * APPROX_PRICE[coin];
  const totalReturn = amtNum + amtNum * plan.dailyRate * plan.durationDays;
  const totalProfit = amtNum * plan.dailyRate * plan.durationDays;

  const handleInvest = async () => {
    setMsg(null);
    if (amtNum <= 0) { setMsg({ type: 'error', text: 'Enter a valid amount.' }); return; }

    // Check balance
    if (amtNum > balances[coin]) {
      setMsg({ type: 'error', text: `Insufficient balance. You have ${balances[coin].toFixed(coin === 'USDT' ? 2 : 5)} ${coin}.` });
      return;
    }

    // Convert min amount (USD) to coin units
    const minInCoin = plan.minAmount / APPROX_PRICE[coin];
    if (amtNum < minInCoin) {
      setMsg({ type: 'error', text: `Minimum investment is $${plan.minAmount} (~${minInCoin.toFixed(6)} ${coin}).` });
      return;
    }

    const result = await createInvestment(userId, plan, coin, amtNum);
    if (!result.success) { setMsg({ type: 'error', text: result.error! }); return; }

    setMsg({ type: 'success', text: `Investment started! You'll earn ${(plan.dailyRate * 100).toFixed(0)}% daily for ${plan.durationDays} days.` });
    setTimeout(() => { onSuccess(); onClose(); }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[#1a1f2c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 bg-gradient-to-r ${plan.color} flex items-center justify-between`}>
          <div className="flex items-center gap-2 text-white font-semibold text-lg">
            {plan.icon} {plan.name} Plan
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Plan summary */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-green-400 text-xl font-bold">{(plan.dailyRate * 100).toFixed(0)}%</p>
              <p className="text-gray-400 text-xs mt-0.5">Daily Return</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white text-xl font-bold">{plan.durationDays}d</p>
              <p className="text-gray-400 text-xs mt-0.5">Duration</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-yellow-400 text-xl font-bold">{(plan.dailyRate * plan.durationDays * 100).toFixed(0)}%</p>
              <p className="text-gray-400 text-xs mt-0.5">Total ROI</p>
            </div>
          </div>

          {/* Coin selector */}
          <div>
            <p className="text-gray-400 text-xs mb-2 font-medium uppercase tracking-wide">Pay with</p>
            <div className="flex gap-2">
              {COINS.map(c => (
                <button key={c} onClick={() => setCoin(c)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
                    coin === c ? 'bg-crypto-purple border-crypto-purple text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}>
                  {c}
                  <span className="block text-xs font-normal text-gray-500 mt-0.5">
                    {c === 'USDT' ? balances[c].toFixed(2) : balances[c].toFixed(5)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <p className="text-gray-400 text-xs mb-2 font-medium uppercase tracking-wide">Amount ({coin})</p>
            <Input
              type="number"
              step="any"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={`Min. $${plan.minAmount} equivalent`}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
            />
            {amtNum > 0 && (
              <p className="text-gray-500 text-xs mt-1">≈ ${usdEquiv.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD</p>
            )}
          </div>

          {/* Projection */}
          {amtNum > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Daily earnings</span>
                <span className="text-green-400 font-medium">+{(amtNum * plan.dailyRate).toFixed(6)} {coin}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total profit</span>
                <span className="text-green-400 font-medium">+{totalProfit.toFixed(6)} {coin}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-white/10 pt-2 mt-2">
                <span className="text-white">Total payout</span>
                <span className="text-white">{totalReturn.toFixed(6)} {coin}</span>
              </div>
            </div>
          )}

          {msg && (
            <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${
              msg.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {msg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {msg.text}
            </div>
          )}

          <Button
            onClick={handleInvest}
            className="w-full h-11 text-sm font-semibold bg-crypto-purple hover:bg-crypto-dark-purple text-white">
            Invest Now
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Active investment card ────────────────────────────────────────

const ActiveInvCard = ({ inv, onClaim }: { inv: ActiveInvestment; onClaim: (id: string) => void }) => {
  const [earnings, setEarnings] = useState(calcEarnings(inv));
  const matured = new Date() >= new Date(inv.maturesAt);
  const plan = PLANS.find(p => p.id === inv.planId);
  const progress = Math.min(
    ((Date.now() - new Date(inv.startedAt).getTime()) /
    (new Date(inv.maturesAt).getTime() - new Date(inv.startedAt).getTime())) * 100,
    100
  );

  // Tick earnings every second
  useEffect(() => {
    if (inv.status === 'completed') return;
    const id = setInterval(() => setEarnings(calcEarnings(inv)), 1000);
    return () => clearInterval(id);
  }, [inv]);

  const color = plan?.color ?? 'from-crypto-purple to-blue-500';

  return (
    <div className={`bg-white/5 border ${plan?.border ?? 'border-white/10'} rounded-2xl p-5 space-y-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white`}>
            {plan?.icon ?? <TrendingUp size={16} />}
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{inv.planName}</p>
            <p className="text-gray-400 text-xs">{inv.amount.toFixed(6)} {inv.coin} invested</p>
          </div>
        </div>
        {inv.status === 'completed' ? (
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">Claimed</span>
        ) : matured ? (
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 animate-pulse">Ready!</span>
        ) : (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 flex items-center gap-1">
            <Clock size={11} /> Active
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/10 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full bg-gradient-to-r ${color} transition-all duration-1000`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-gray-500">Earnings so far</p>
          <p className="text-green-400 font-mono font-semibold">+{earnings.toFixed(8)} {inv.coin}</p>
        </div>
        <div>
          <p className="text-gray-500">Matures</p>
          <p className="text-white font-medium">{new Date(inv.maturesAt).toLocaleDateString()}</p>
        </div>
      </div>

      {matured && inv.status === 'active' && (
        <Button
          onClick={() => onClaim(inv.id)}
          className="w-full h-9 text-sm bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1.5">
          <ArrowDownToLine size={14} /> Claim {(inv.amount + earnings).toFixed(6)} {inv.coin}
        </Button>
      )}
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────

const InvestmentPlans = () => {
  const { user } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null);
  const [investments, setInvestments] = useState<ActiveInvestment[]>([]);

  const [investmentsLoading, setInvestmentsLoading] = useState(true);
  const refresh = async () => {
    if (user?.uid) {
      try {
        const investments = await getUserInvestments(user.uid);
        setInvestments(investments);
      } catch (error) {
        console.error('Failed to load investments:', error);
      }
    }
    setInvestmentsLoading(false);
  };

  useEffect(() => { refresh(); }, [user]);

  const handleClaim = async (invId: string) => {
    if (!user) return;
    await claimInvestment(user.uid, invId);
    await refresh();
  };

  const activeInvestments = investments.filter(i => i.status === 'active');
  const completedInvestments = investments.filter(i => i.status === 'completed');

  if (!user) return null;

  return (
    <div className="space-y-8">
      {selectedPlan && (
        <InvestModal
          plan={selectedPlan}
          userId={user.uid}
          onClose={() => setSelectedPlan(null)}
          onSuccess={refresh}
        />
      )}

      {/* Plans grid */}
      <div>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white">Investment Plans</h2>
          <p className="text-gray-400 text-sm mt-1">Choose a plan, invest your balance, and earn daily returns.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {PLANS.map(plan => (
            <div key={plan.id}
              className={`relative bg-white/5 border ${plan.border} rounded-2xl p-5 flex flex-col gap-4 hover:border-opacity-60 transition-all`}>
              {plan.badge && (
                <span className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-semibold bg-gradient-to-r ${plan.color} text-white`}>
                  {plan.badge}
                </span>
              )}

              {/* Icon + name */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white`}>
                  {plan.icon}
                </div>
                <div>
                  <p className="text-white font-semibold">{plan.name}</p>
                  <p className="text-gray-400 text-xs">{plan.durationDays} days</p>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Daily return</span>
                  <span className="text-green-400 font-bold text-lg">{(plan.dailyRate * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Total ROI</span>
                  <span className="text-yellow-400 font-semibold">{(plan.dailyRate * plan.durationDays * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Min. invest</span>
                  <span className="text-white text-sm">${plan.minAmount}</span>
                </div>
              </div>

              <p className="text-gray-500 text-xs leading-relaxed">{plan.desc}</p>

              <Button
                onClick={() => setSelectedPlan(plan)}
                className={`w-full h-9 text-sm font-semibold bg-gradient-to-r ${plan.color} text-white border-0 hover:opacity-90 mt-auto`}>
                Invest Now
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Tier progress bar */}
      {(() => {
        const sessionUser = user as any;
        if (!sessionUser?.balances) return null;
        const balances = sessionUser.balances;
        const totalUSD = balances.BTC * APPROX_PRICE.BTC + balances.USDT * APPROX_PRICE.USDT + balances.ETH * APPROX_PRICE.ETH;
        const tiers = [
          { name: 'Starter',    min: 460,   color: 'from-blue-500 to-cyan-400' },
          { name: 'Growth',     min: 1300,  color: 'from-crypto-purple to-indigo-400' },
          { name: 'Pro Trader', min: 4000,  color: 'from-yellow-400 to-orange-500' },
          { name: 'Elite VIP',  min: 10000, color: 'from-pink-500 to-rose-500' },
        ];
        const nextTier = tiers.find(t => totalUSD < t.min);
        if (!nextTier || totalUSD === 0) return null;
        const prevMin = tiers[tiers.indexOf(nextTier) - 1]?.min ?? 0;
        const pct = Math.min(((totalUSD - prevMin) / (nextTier.min - prevMin)) * 100, 100);
        return (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white text-sm font-semibold">Progress to {nextTier.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">${totalUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })} / ${nextTier.min.toLocaleString()} needed</p>
              </div>
              <span className="text-xs font-bold text-white bg-white/10 px-3 py-1 rounded-full">{pct.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full">
              <div className={`h-2 rounded-full bg-gradient-to-r ${nextTier.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-gray-500 text-xs mt-2">${(nextTier.min - totalUSD).toLocaleString('en-US', { maximumFractionDigits: 0 })} more to unlock the {nextTier.name} plan</p>
          </div>
        );
      })()}

      {/* Active investments */}
      {activeInvestments.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock size={18} className="text-crypto-purple" /> Active Investments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeInvestments.map(inv => (
              <ActiveInvCard key={inv.id} inv={inv} onClaim={handleClaim} />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedInvestments.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400" /> Completed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {completedInvestments.map(inv => (
              <ActiveInvCard key={inv.id} inv={inv} onClaim={handleClaim} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentPlans;
