import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { getUserBalances } from '@/lib/firestore';
import type { UserBalances } from '@/lib/firestore';


const COIN_META: { symbol: keyof UserBalances; name: string; color: string }[] = [
  { symbol: 'BTC',  name: 'Bitcoin',   color: 'from-orange-500 to-yellow-400' },
  { symbol: 'USDT', name: 'Tether',    color: 'from-green-500 to-emerald-400' },
  { symbol: 'ETH',  name: 'Ethereum',  color: 'from-blue-500 to-cyan-400' },
];

// Approximate prices for display — not live, just for USD estimate
const APPROX_PRICE: Record<keyof UserBalances, number> = {
  BTC:  65000,
  USDT: 1,
  ETH:  3200,
};

const APPROX_CHANGE: Record<keyof UserBalances, number> = {
  BTC:  2.4,
  USDT: 0.0,
  ETH:  1.8,
};

const StatCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
    <p className="text-gray-400 text-sm mb-1">{label}</p>
    <p className="text-2xl font-bold text-white">{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
);

const Portfolio = () => {
const { address } = useAccount();
  const { user } = useSession();

  const [balances, setBalances] = useState<UserBalances>({ BTC: 0, USDT: 0, ETH: 0 });

  useEffect(() => {
    if (user?.uid) {
      getUserBalances(user.uid)
        .then(setBalances)
        .catch((error) => {
          console.error('Failed to load balances:', error);
        });
    }
  }, [user?.uid]);

  const totalValue = COIN_META.reduce(
(sum, c) => sum + (balances[c.symbol] ?? 0) * APPROX_PRICE[c.symbol], 0
  );
  const totalChange = COIN_META.reduce(
(sum, c) => sum + ((balances[c.symbol] ?? 0) * APPROX_PRICE[c.symbol] * APPROX_CHANGE[c.symbol] / 100), 0
  );
  const totalChangePct = totalValue > 0 ? (totalChange / totalValue) * 100 : 0;
  const assetCount = COIN_META.filter(c => balances[c.symbol] > 0).length;

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Value"
          value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          sub="Platform balance"
        />
        <StatCard
          label="24h Change"
          value={`${totalChangePct >= 0 ? '+' : ''}${totalChangePct.toFixed(2)}%`}
          sub={`${totalChange >= 0 ? '+' : ''}$${Math.abs(totalChange).toFixed(2)}`}
        />
        <StatCard
          label="Wallet"
          value={address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
          sub={address ? 'Connected' : 'Connect for on-chain'}
        />
        <StatCard
          label="Assets"
          value={String(assetCount)}
          sub="Holdings"
        />
      </div>

      {/* Holdings table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Wallet size={18} className="text-crypto-purple" /> Holdings
          </h2>
        </div>
        <div className="divide-y divide-white/5">
          {COIN_META.map(coin => {
const amount = balances[coin.symbol] ?? 0;
            const usdValue = amount * APPROX_PRICE[coin.symbol];
            const change = APPROX_CHANGE[coin.symbol];
            return (
              <div key={coin.symbol} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${coin.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {coin.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{coin.name}</p>
                    <p className="text-gray-400 text-sm">
                      {coin.symbol === 'USDT'
                        ? amount.toFixed(2)
                        : amount.toFixed(6)}{' '}
                      {coin.symbol}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">
                    ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className={`text-sm flex items-center justify-end gap-0.5 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {assetCount === 0 && (
          <p className="text-center text-gray-500 py-10 text-sm">
            No balance yet. Deposit funds to get started.
          </p>
        )}
      </div>
    </div>
  );
};

export default Portfolio;
