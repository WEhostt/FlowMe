import { useEffect, useRef, useState } from 'react';

const COUNTRIES = ['UK', 'US', 'Canada', 'Germany', 'Australia', 'France', 'UAE', 'Singapore', 'Japan', 'Brazil', 'Netherlands', 'Sweden'];
const COINS = ['BTC', 'ETH', 'USDT'];
const ACTIONS = ['just earned', 'just withdrew', 'just invested', 'just received'];

const random = (min: number, max: number) => Math.random() * (max - min) + min;

const generateTick = () => {
  const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
  const coin = COINS[Math.floor(Math.random() * COINS.length)];
  const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  const amount = coin === 'USDT'
    ? `$${(random(50, 8000)).toFixed(2)}`
    : coin === 'BTC'
    ? `${random(0.001, 0.12).toFixed(4)} BTC`
    : `${random(0.01, 2.5).toFixed(4)} ETH`;
  return `User from ${country} ${action} ${amount}`;
};

const INITIAL_TICKS = Array.from({ length: 12 }, generateTick);

const LiveTicker = () => {
  const [ticks, setTicks] = useState(INITIAL_TICKS);
  const trackRef = useRef<HTMLDivElement>(null);

  // Add a new tick every 4 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setTicks(prev => [...prev.slice(-20), generateTick()]);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const all = [...ticks, ...ticks]; // duplicate for seamless loop

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 overflow-hidden bg-[#0d1117]/90 backdrop-blur-sm border-t border-white/5 h-8">
      <div
        ref={trackRef}
        className="flex items-center gap-12 animate-ticker whitespace-nowrap h-full px-4"
        style={{ animationDuration: `${ticks.length * 4}s` }}>
        {all.map((t, i) => (
          <span key={i} className="text-xs text-gray-400 shrink-0">
            <span className="text-green-400 font-medium">●</span> {t}
          </span>
        ))}
      </div>
    </div>
  );
};

export default LiveTicker;
