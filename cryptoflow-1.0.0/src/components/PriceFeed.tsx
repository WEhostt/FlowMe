import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  sparkline?: number[];
}

const COIN_IDS = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'chainlink', 'uniswap'];

const formatPrice = (price: number) =>
  price >= 1
    ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${price.toFixed(6)}`;

const formatMcap = (num: number) => {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
};

const CoinRow = ({ coin }: { coin: CoinPrice }) => {
  const isPositive = coin.price_change_percentage_24h >= 0;
  return (
    <div className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3 w-40">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-crypto-purple to-blue-500 flex items-center justify-center text-white text-xs font-bold">
          {coin.symbol.toUpperCase().slice(0, 2)}
        </div>
        <div>
          <p className="text-white font-medium text-sm">{coin.name}</p>
          <p className="text-gray-500 text-xs uppercase">{coin.symbol}</p>
        </div>
      </div>
      <div className="text-right w-32">
        <p className="text-white font-mono text-sm">{formatPrice(coin.current_price)}</p>
      </div>
      <div className={`flex items-center gap-1 w-24 justify-end text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {isPositive ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
      </div>
      <div className="text-right w-32 hidden md:block">
        <p className="text-gray-300 text-sm">{formatMcap(coin.market_cap)}</p>
        <p className="text-gray-500 text-xs">Vol: {formatMcap(coin.total_volume)}</p>
      </div>
    </div>
  );
};

const SkeletonRow = () => (
  <div className="flex items-center justify-between px-6 py-4">
    <div className="flex items-center gap-3 w-40">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-2 w-10" />
      </div>
    </div>
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-4 w-16" />
    <Skeleton className="h-4 w-28 hidden md:block" />
  </div>
);

const PriceFeed = () => {
  const [coins, setCoins] = useState<CoinPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPrices = async () => {
    try {
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COIN_IDS.join(',')}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setCoins(data);
      setLastUpdated(new Date());
      setLoading(false);
      setLive(true);
    } catch {
      // On error, use mock data so UI still renders
      setCoins([
        { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 65240, price_change_percentage_24h: -1.2, market_cap: 1.28e12, total_volume: 32e9 },
        { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 3080, price_change_percentage_24h: 2.4, market_cap: 370e9, total_volume: 18e9 },
        { id: 'binancecoin', symbol: 'bnb', name: 'BNB', current_price: 580, price_change_percentage_24h: 0.8, market_cap: 84e9, total_volume: 2.1e9 },
        { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 145, price_change_percentage_24h: 5.1, market_cap: 66e9, total_volume: 4.5e9 },
        { id: 'chainlink', symbol: 'link', name: 'Chainlink', current_price: 16.0, price_change_percentage_24h: 5.7, market_cap: 9.5e9, total_volume: 450e6 },
        { id: 'uniswap', symbol: 'uni', name: 'Uniswap', current_price: 8.5, price_change_percentage_24h: 3.2, market_cap: 5.1e9, total_volume: 180e6 },
      ]);
      setLastUpdated(new Date());
      setLoading(false);
      setLive(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    // Poll every 30s (CoinGecko free tier rate limit)
    intervalRef.current = setInterval(fetchPrices, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          {live ? (
            <Wifi size={18} className="text-green-400" />
          ) : (
            <WifiOff size={18} className="text-yellow-400" />
          )}
          Live Prices
          <span className={`text-xs font-normal px-2 py-0.5 rounded-full ${live ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
            {live ? 'LIVE' : 'DEMO'}
          </span>
        </h2>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-gray-500 text-xs">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchPrices}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
            aria-label="Refresh prices"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-white/5">
        <span className="text-gray-500 text-xs w-40">Asset</span>
        <span className="text-gray-500 text-xs w-32 text-right">Price</span>
        <span className="text-gray-500 text-xs w-24 text-right">24h</span>
        <span className="text-gray-500 text-xs w-32 text-right hidden md:block">Mkt Cap / Vol</span>
      </div>

      <div className="divide-y divide-white/5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          : coins.map((coin) => <CoinRow key={coin.id} coin={coin} />)
        }
      </div>
    </div>
  );
};

export default PriceFeed;
