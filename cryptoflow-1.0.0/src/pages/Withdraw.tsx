import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import { useSession } from '@/contexts/SessionContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  AlertCircle, ArrowUpRight, CheckCircle, Clock, XCircle, Wallet,
} from 'lucide-react';
import {
  getUserBalances, getUserWithdrawalRequests, requestWithdrawal,
  WithdrawalRequest, UserBalances,
} from '@/lib/firestore';


const COINS = [
  { symbol: 'BTC' as keyof UserBalances,  name: 'Bitcoin',   network: 'Bitcoin Network',    color: 'from-orange-500 to-yellow-400', minWithdraw: 0.0005, fee: 0.0001 },
  { symbol: 'USDT' as keyof UserBalances, name: 'Tether',    network: 'TRC-20 (TRON)',      color: 'from-green-500 to-emerald-400', minWithdraw: 10,     fee: 1 },
  { symbol: 'ETH' as keyof UserBalances,  name: 'Ethereum',  network: 'ERC-20 (Ethereum)',  color: 'from-blue-500 to-cyan-400',     minWithdraw: 0.01,   fee: 0.003 },
];

const statusBadge = (status: WithdrawalRequest['status']) => {
  if (status === 'pending')  return <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400"><Clock size={11}/> Pending</span>;
  if (status === 'approved') return <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400"><CheckCircle size={11}/> Approved</span>;
  return <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400"><XCircle size={11}/> Rejected</span>;
};

const Withdraw = () => {
  const { isLoggedIn, user } = useSession();
  const navigate = useNavigate();
  const [active, setActive] = useState<keyof UserBalances>('BTC');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<WithdrawalRequest[]>([]);
  const [balances, setBalances] = useState<UserBalances>({ BTC: 0, USDT: 0, ETH: 0 });

  useEffect(() => {
    document.title = 'Withdraw | CryptoFlow';
    if (!isLoggedIn) { navigate('/cryptoflow/login'); return; }
    if (user?.uid) {
      getUserBalances(user.uid).then(setBalances);
      getUserWithdrawalRequests(user.uid).then(setHistory);
    }

  }, [isLoggedIn, user?.uid]);

  const coin = COINS.find(c => c.symbol === active)!;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!address.trim()) { setError('Please enter a withdrawal address.'); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError('Please enter a valid amount.'); return; }
    if (amt < coin.minWithdraw) { setError(`Minimum withdrawal is ${coin.minWithdraw} ${coin.symbol}.`); return; }
    if (amt > balances[active]) { setError(`Insufficient ${active} balance.`); return; }
    if (!user) return;

    setLoading(true);
    requestWithdrawal(user.uid, user.name, user.email, active, amt, address, coin.network)
      .then(result => {
        setLoading(false);
        if (!result.success) { setError(result.error!); return; }
        getUserBalances(user.uid).then(setBalances);
        getUserWithdrawalRequests(user.uid).then(setHistory);
        setSubmitted(true);
      })
      .catch(err => {
        setLoading(false);
        setError('An error occurred. Please try again.');
      });

  };

  return (
    <div className="min-h-screen bg-crypto-blue overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Withdraw Funds</h1>
          <p className="text-gray-400 text-sm">Request a withdrawal to your external wallet.</p>
        </div>

        {/* Coin tabs */}
        <div className="flex gap-3 mb-8">
          {COINS.map(c => (
            <button key={c.symbol} onClick={() => { setActive(c.symbol); setSubmitted(false); setError(''); }}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
                active === c.symbol
                  ? 'bg-crypto-purple border-crypto-purple text-white shadow-lg shadow-crypto-purple/20'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}>
              {c.symbol}
              <span className="block text-xs font-normal mt-0.5 text-gray-500">
                {c.symbol === 'USDT' ? balances[c.symbol].toFixed(2) : balances[c.symbol].toFixed(6)}
              </span>
            </button>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${coin.color} flex items-center justify-center text-white font-bold text-lg`}>
              {coin.symbol.slice(0, 2)}
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">{coin.name}</h2>
              <p className="text-gray-400 text-sm">{coin.network}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-gray-400 text-xs">Available</p>
              <p className="text-white font-semibold font-mono">
                {active === 'USDT' ? balances[active].toFixed(2) : balances[active].toFixed(6)} {active}
              </p>
            </div>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center py-8 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h3 className="text-white text-xl font-semibold">Withdrawal Submitted</h3>
              <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
                Your withdrawal of <span className="text-white font-medium">{amount} {coin.symbol}</span> is pending admin review.
                Funds are held until processed.
              </p>
              <p className="text-gray-500 text-xs">Processing time: 1–24 hours</p>
              <Button onClick={() => { setSubmitted(false); setAddress(''); setAmount(''); }}
                className="bg-white/10 hover:bg-white/20 text-white mt-2">
                New Withdrawal
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                  <AlertCircle size={15} /> {error}
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Withdrawal Address ({coin.network})</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)}
                  placeholder={`Enter your ${coin.symbol} address`}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Amount ({coin.symbol})</Label>
                <div className="flex gap-2">
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder={`Min. ${coin.minWithdraw}`} step="any" min="0"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 flex-1" />
                  <button type="button"
                    onClick={() => setAmount((balances[active] - coin.fee).toFixed(active === 'USDT' ? 2 : 8))}
                    className="px-3 py-2 text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg border border-white/10 transition-all">
                    MAX
                  </button>
                </div>
                <p className="text-gray-500 text-xs">Network fee: {coin.fee} {coin.symbol}</p>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
                <AlertCircle size={15} className="text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-yellow-400 text-xs">Double-check the address. Withdrawals cannot be reversed once processed.</p>
              </div>
              <Button type="submit" disabled={loading}
                className="w-full bg-crypto-purple hover:bg-crypto-dark-purple text-white h-11 flex items-center justify-center gap-2">
                {loading ? 'Submitting...' : <><ArrowUpRight size={16} /> Request Withdrawal</>}
              </Button>
            </form>
          )}
        </div>

        {/* Withdrawal history */}
        {history.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Wallet size={18} className="text-crypto-purple" /> Withdrawal History
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
              {history.map(w => (
                <div key={w.id} className="flex items-center justify-between px-5 py-4 gap-4 flex-wrap">
                  <div>
                    <p className="text-white text-sm font-semibold">{w.amount} {w.coin}</p>
                    <p className="text-gray-500 text-xs font-mono">{w.address.slice(0, 14)}...{w.address.slice(-6)}</p>
                  </div>
                  <div className="text-right">
                    {statusBadge(w.status)}
                    <p className="text-gray-500 text-xs mt-1">{new Date(w.requestedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Withdraw;
