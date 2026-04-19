import React from 'react';
import { getUserBalances, getUserInvestments } from '@/lib/firestore';
import type { UserBalances, ActiveInvestment } from '@/lib/firestore';


// Approximate USD prices for portfolio value calc
const APPROX: Record<keyof UserBalances, number> = { BTC: 65000, USDT: 1, ETH: 3200 };

export type VipTier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';

export interface TierInfo {
  tier: VipTier;
  label: string;
  emoji: string;
  color: string;        // text color
  bg: string;           // badge bg
  border: string;       // badge border
  minUSD: number;
  nextUSD: number | null;
  nextTier: string | null;
}

export const TIERS: TierInfo[] = [
  { tier: 'platinum', label: 'Platinum', emoji: '💎', color: 'text-cyan-300',   bg: 'bg-cyan-500/20',   border: 'border-cyan-400/40',   minUSD: 50000, nextUSD: null,  nextTier: null },
  { tier: 'gold',     label: 'Gold',     emoji: '🥇', color: 'text-yellow-300', bg: 'bg-yellow-500/20', border: 'border-yellow-400/40', minUSD: 15000, nextUSD: 50000, nextTier: 'Platinum' },
  { tier: 'silver',   label: 'Silver',   emoji: '🥈', color: 'text-gray-300',   bg: 'bg-gray-400/20',   border: 'border-gray-400/40',   minUSD: 4000,  nextUSD: 15000, nextTier: 'Gold' },
  { tier: 'bronze',   label: 'Bronze',   emoji: '🥉', color: 'text-orange-300', bg: 'bg-orange-500/20', border: 'border-orange-400/40', minUSD: 460,   nextUSD: 4000,  nextTier: 'Silver' },
  { tier: 'none',     label: 'Member',   emoji: '👤', color: 'text-gray-500',   bg: 'bg-white/5',       border: 'border-white/10',      minUSD: 0,     nextUSD: 460,   nextTier: 'Bronze' },
];

export const getTierInfo = async (userId: string): Promise<TierInfo & { totalUSD: number }> => {
  const [balances, investments] = await Promise.all([
    getUserBalances(userId),
    getUserInvestments(userId) as Promise<ActiveInvestment[]>
  ]);

  // Total USD = current balance + all-time invested principal (from completed + active)
  const balanceUSD = (Object.keys(balances) as (keyof UserBalances)[])
    .reduce((sum, c) => sum + balances[c] * APPROX[c], 0);

  const totalInvestedUSD = investments.reduce((sum, inv) => {
    return sum + inv.amount * APPROX[inv.coin];
  }, 0);

  const totalUSD = Math.max(balanceUSD, totalInvestedUSD);
  const info = TIERS.find(t => totalUSD >= t.minUSD) ?? TIERS[TIERS.length - 1];
  return { ...info, totalUSD };
};

interface VipBadgeProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const VipBadge = ({ userId, size = 'md', showLabel = true }: VipBadgeProps) => {
  const [info, setInfo] = React.useState<TierInfo & { totalUSD: number }>({ tier: 'none', label: '', emoji: '', color: '', bg: '', border: '', minUSD: 0, nextUSD: null, nextTier: null, totalUSD: 0 });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getTierInfo(userId).then(setInfo).finally(() => setLoading(false));
  }, [userId]);

  if (loading || info.tier === 'none') return null;

  const sizeClass = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  return (
    <span className={`inline-flex items-center rounded-full border font-semibold ${sizeClass} ${info.color} ${info.bg} ${info.border}`}>
      {info.emoji} {showLabel && info.label}
    </span>
  );
};

export default VipBadge;

