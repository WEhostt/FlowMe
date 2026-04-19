import { useEffect, useState, useMemo } from 'react';
import { useAuth, ConnectKitButton } from '@/contexts/AuthContext';
import { useAccount } from 'wagmi';
import { useSession } from '@/contexts/SessionContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import {
  ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Search, AlertCircle, ExternalLink,
  TrendingUp, Gift, UserPlus, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransactionHistory, MoralisTx } from '@/hooks/useMoralis';
import { getUserTransactions, Transaction, TxType } from '@/lib/userDb';

const API_KEY = import.meta.env.VITE_MORALIS_API_KEY as string;

// ── Helpers ──────────────────────────────────────────────────────

const weiToEth = (wei: string) => {
  try { return (Number(BigInt(wei)) / 1e18).toFixed(5); } catch { return '0.00000'; }
};

const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

const getTxType = (tx: MoralisTx, walletAddress: string): 'send' | 'receive' =>
  tx.from_address.toLowerCase() === walletAddress.toLowerCase() ? 'send' : 'receive';

const MOCK_TXS: MoralisTx[] = [
  { hash: '0xabc1', from_address: '0xDEAD000000000000000000000000000000000001', to_address: '0xBEEF000000000000000000000000000000000002', value: '500000000000000000',  block_timestamp: '2024-11-01T14:30:00.000Z', receipt_status: '1' },
  { hash: '0xabc2', from_address: '0xBEEF000000000000000000000000000000000002', to_address: '0xDEAD000000000000000000000000000000000001', value: '100000000000000000',  block_timestamp: '2024-10-30T10:15:00.000Z', receipt_status: '1' },
  { hash: '0xabc3', from_address: '0xDEAD000000000000000000000000000000000001', to_address: '0xCAFE000000000000000000000000000000000003', value: '250000000000000000',  block_timestamp: '2024-10-28T18:45:00.000Z', receipt_status: '0' },
  { hash: '0xabc4', from_address: '0xFACE000000000000000000000000000000000004', to_address: '0xBEEF000000000000000000000000000000000002', value: '1000000000000000000', block_timestamp: '2024-10-25T09:00:00.000Z', receipt_status: '1' },
  { hash: '0xabc5', from_address: '0xBEEF000000000000000000000000000000000002', to_address: '0xABCD000000000000000000000000000000000005', value: '50000000000000000',   block_timestamp: '2024-10-22T20:30:00.000Z', receipt_status: '1' },
];

// ── Sub-components ───────────────────────────────────────────────

const typeIcon = (type: 'send' | 'receive') =>
  type === 'send'
    ? <ArrowUpRight size={16} className="text-red-400" />
    : <ArrowDownLeft size={16} className="text-green-400" />;

const typeBg = (type: 'send' | 'receive') =>
  type === 'send' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400';

const SkeletonRow = () => (
  <div className="flex items-center gap-4 px-6 py-4">
    <Skeleton className="w-8 h-8 rounded-full" />
    <div className="flex-1 space-y-1">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-2 w-48" />
    </div>
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-5 w-20 rounded-full hidden sm:block" />
  </div>
);

// ── Platform TX meta ─────────────────────────────────────────────

const TX_META: Record<TxType, { label: string; icon: React.ReactNode; color: string; sign: string }> = {
  signup:              { label: 'Account Created',      icon: <UserPlus size={13}/>,        color: 'text-blue-400',   sign: '' },
  deposit:             { label: 'Deposit',               icon: <ArrowDownLeft size={13}/>,   color: 'text-green-400',  sign: '+' },
  withdrawal_pending:  { label: 'Withdrawal Pending',    icon: <Clock size={13}/>,           color: 'text-yellow-400', sign: '-' },
  withdrawal_approved: { label: 'Withdrawal Approved',   icon: <CheckCircle size={13}/>,     color: 'text-green-400',  sign: '-' },
  withdrawal_rejected: { label: 'Withdrawal Rejected',   icon: <XCircle size={13}/>,         color: 'text-red-400',    sign: '' },
  investment_start:    { label: 'Investment Started',    icon: <TrendingUp size={13}/>,      color: 'text-purple-400', sign: '-' },
  investment_claim:    { label: 'Investment Claimed',    icon: <ArrowDownLeft size={13}/>,   color: 'text-green-400',  sign: '+' },
  referral_bonus:      { label: 'Referral Bonus',        icon: <Gift size={13}/>,            color: 'text-pink-400',   sign: '+' },
  admin_credit:        { label: 'Admin Credit',          icon: <ArrowDownLeft size={13}/>,   color: 'text-green-400',  sign: '+' },
  admin_debit:         { label: 'Admin Debit',           icon: <ArrowUpRight size={13}/>,    color: 'text-red-400',    sign: '-' },
};

// ── Page ─────────────────────────────────────────────────────────

const History = () => {
  const { isConnected } = useAuth();
  const { address } = useAccount();
  const { user } = useSession();
  const { transactions, loading, error } = useTransactionHistory(address);

  const [tab, setTab] = useState<'platform' | 'onchain'>('platform');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformTxs, setPlatformTxs] = useState<Transaction[]>([]);

  useEffect(() => {
    document.title = "Transaction History | CryptoFlow";
    if (user) setPlatformTxs(getUserTransactions(user.id));
  }, [user]);

  const usingMock = !API_KEY || !!error;
  const rawTxs = usingMock ? MOCK_TXS : transactions;
  const walletAddr = address ?? '0xBEEF000000000000000000000000000000000002';

  const filtered = useMemo(() => rawTxs.filter((tx) => {
    const type = getTxType(tx, walletAddr);
    const status = tx.receipt_status === '1' ? 'confirmed' : 'failed';
    const matchSearch =
      search === '' ||
      tx.hash.toLowerCase().includes(search.toLowerCase()) ||
      tx.from_address.toLowerCase().includes(search.toLowerCase()) ||
      tx.to_address.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || type === typeFilter;
    const matchStatus = statusFilter === 'all' || status === statusFilter;
    return matchSearch && matchType && matchStatus;
  }), [rawTxs, search, typeFilter, statusFilter, walletAddr]);

  return (
    <div className="min-h-screen bg-crypto-blue overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Transaction History</h1>
          <p className="text-gray-400 text-sm">Your full platform and on-chain activity log.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-3 mb-8">
          <button onClick={() => setTab('platform')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
              tab === 'platform' ? 'bg-crypto-purple border-crypto-purple text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
            Platform Activity
          </button>
          <button onClick={() => setTab('onchain')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
              tab === 'onchain' ? 'bg-crypto-purple border-crypto-purple text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
            On-Chain (ETH)
          </button>
        </div>

        {/* ── Platform activity ── */}
        {tab === 'platform' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {platformTxs.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-gray-500 text-sm">No platform transactions yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {platformTxs.map(tx => {
                  const meta = TX_META[tx.type] ?? TX_META.signup;
                  return (
                    <div key={tx.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full bg-white/10 flex items-center justify-center ${meta.color}`}>
                          {meta.icon}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{meta.label}</p>
                          <p className="text-gray-500 text-xs">{tx.note}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {tx.amount > 0 && (
                          <p className={`text-sm font-semibold font-mono ${
                            meta.sign === '+' ? 'text-green-400' : meta.sign === '-' ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {meta.sign}{tx.amount.toFixed(tx.coin === 'USDT' ? 2 : 6)} {tx.coin}
                          </p>
                        )}
                        <p className="text-gray-500 text-xs mt-0.5">
                          {new Date(tx.createdAt).toLocaleDateString()}{' '}
                          {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── On-chain ── */}
        {tab === 'onchain' && (
        !isConnected ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-crypto-purple/20 flex items-center justify-center mb-6">
              <ArrowLeftRight size={36} className="text-crypto-purple" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-3">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8 max-w-md">
              Connect your wallet to view your on-chain transaction history.
            </p>
            <ConnectKitButton />
          </div>
        ) : (
          <>
            {usingMock && (
              <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                <AlertCircle size={15} className="shrink-0" />
                {error
                  ? `Moralis error: ${error}. Showing demo data.`
                  : 'Add VITE_MORALIS_API_KEY to .env to load your real transactions.'}
              </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              {/* Filters */}
              <div className="px-6 py-4 border-b border-white/10 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[180px]">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <Input
                    placeholder="Search by hash or address..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-9 text-sm"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-36 bg-white/5 border-white/10 text-gray-300 h-9 text-sm">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="send">Send</SelectItem>
                    <SelectItem value="receive">Receive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36 bg-white/5 border-white/10 text-gray-300 h-9 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Column headers */}
              <div className="hidden sm:flex items-center gap-4 px-6 py-2 border-b border-white/5">
                <span className="text-gray-500 text-xs w-8" />
                <span className="text-gray-500 text-xs flex-1">Transaction</span>
                <span className="text-gray-500 text-xs w-32 text-right">Amount (ETH)</span>
                <span className="text-gray-500 text-xs w-24 text-right">Status</span>
                <span className="text-gray-500 text-xs w-8" />
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/5">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  : filtered.length === 0
                    ? <div className="py-16 text-center text-gray-500">No transactions found.</div>
                    : filtered.map((tx) => {
                        const type = getTxType(tx, walletAddr);
                        const counterparty = type === 'send' ? tx.to_address : tx.from_address;
                        const date = new Date(tx.block_timestamp);
                        const eth = weiToEth(tx.value);
                        const confirmed = tx.receipt_status === '1';
                        return (
                          <div key={tx.hash} className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${typeBg(type)}`}>
                              {typeIcon(type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium capitalize">{type} ETH</p>
                              <p className="text-gray-500 text-xs truncate">
                                {type === 'send' ? 'To' : 'From'}: {shortAddr(counterparty)}
                                {' · '}
                                {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="text-right w-32">
                              <p className={`text-sm font-mono ${type === 'send' ? 'text-red-400' : 'text-green-400'}`}>
                                {type === 'send' ? '-' : '+'}{eth} ETH
                              </p>
                            </div>
                            <div className="text-right w-24">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${confirmed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {confirmed ? 'confirmed' : 'failed'}
                              </span>
                            </div>
                            <a
                              href={`https://etherscan.io/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-crypto-purple transition-colors w-8 flex justify-end"
                              title="View on Etherscan"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        );
                      })
                }
              </div>

              {/* Footer */}
              {!loading && filtered.length > 0 && (
                <div className="px-6 py-3 border-t border-white/10 text-gray-500 text-xs">
                  Showing {filtered.length} of {rawTxs.length} transactions
                </div>
              )}
            </div>
          </>
        ))}
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default History;
