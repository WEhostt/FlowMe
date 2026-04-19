import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import { useSession } from '@/contexts/SessionContext';
import { getAllUsers } from '@/lib/firestore';
import type { UserBalances } from '@/lib/firestore';

import VipBadge, { getTierInfo } from '@/components/VipBadge';
import { Trophy, TrendingUp, Medal } from 'lucide-react';
import { getUserInvestments as fetchUserInvestments } from '@/lib/firestore';

const APPROX: Record<keyof UserBalances, number> = { BTC: 65000, USDT: 1, ETH: 3200 };

const anonymize = (name: string): string => {
  const parts = name.trim().split(' ');
  const first = parts[0];
  const masked = first.slice(0, 2) + '***';
  return parts.length > 1 ? `${masked} ${parts[parts.length - 1].charAt(0)}.` : masked;
};

const rankMedal = (rank: number) => {
  if (rank === 1) return <span className="text-yellow-400 text-lg">🥇</span>;
  if (rank === 2) return <span className="text-gray-300 text-lg">🥈</span>;
  if (rank === 3) return <span className="text-orange-400 text-lg">🥉</span>;
  return <span className="text-gray-500 text-sm font-bold">#{rank}</span>;
};

interface LeaderEntry {
  id: string;
  display: string;
  totalUSD: number;
  totalInvested: number;
  isMe: boolean;
  tier: ReturnType<typeof getTierInfo>;
}

const Leaderboard = () => {
  const { user } = useSession();
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Leaderboard | CryptoFlow';

    const fetchUsers = async () => {
      const users = await getAllUsers();
      const scored: LeaderEntry[] = await Promise.all(users.map(async u => {
        const balances = getUserBalances(u.uid);
        const investments = await getUserInvestments(u.uid);
        const balanceUSD = (Object.keys(balances) as (keyof UserBalances)[])
          .reduce((s, c) => s + balances[c] * APPROX[c], 0);
        const totalInvested = investments.reduce((s, inv) => s + inv.amount * APPROX[inv.coin], 0);
        const totalUSD = Math.max(balanceUSD, totalInvested) + balanceUSD;
        return {
          id: u.uid,
          display: anonymize(u.name),
          totalUSD,
          totalInvested,
          isMe: user?.uid === u.uid,
          tier: getTierInfo(u.uid),
        };
      }));

      scored.sort((a, b) => b.totalUSD - a.totalUSD);

      const top = scored.slice(0, 10);
      setEntries(top);

      if (user) {
        const rank = scored.findIndex(e => e.id === user.uid) + 1;
        setMyRank(rank > 0 ? rank : null);
      }
    };

    fetchUsers();
  }, [user]);

  return (
    <div className="min-h-screen bg-crypto-blue overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
            <Trophy size={32} className="text-yellow-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Leaderboard</h1>
          <p className="text-gray-400">Top investors on the CryptoFlow platform. Names are anonymized for privacy.</p>
        </div>

        {/* My rank banner */}
        {myRank && (
          <div className="mb-6 bg-crypto-purple/20 border border-crypto-purple/30 rounded-2xl px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Medal size={18} className="text-crypto-purple" />
              <span className="text-white text-sm font-medium">Your rank</span>
            </div>
            <span className="text-crypto-purple font-bold text-lg">#{myRank}</span>
          </div>
        )}

        {/* Podium — top 3 */}
        {entries.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-8">
            {/* 2nd */}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 ${
                entries[1].isMe ? 'border-crypto-purple bg-crypto-purple/30' : 'border-gray-600 bg-white/10'
              }`}>
                {entries[1].display.charAt(0).toUpperCase()}
              </div>
              <VipBadge userId={entries[1].id} size="sm" showLabel={false} />
              <p className="text-gray-300 text-xs font-medium">{entries[1].display}</p>
              <p className="text-gray-400 text-xs">${entries[1].totalUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              <div className="w-20 h-16 bg-gray-500/30 border border-gray-500/30 rounded-t-xl flex items-center justify-center text-2xl">🥈</div>
            </div>
            {/* 1st */}
            <div className="flex flex-col items-center gap-2 -mb-2">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 ${
                entries[0].isMe ? 'border-crypto-purple bg-crypto-purple/30' : 'border-yellow-400 bg-yellow-500/20'
              }`}>
                {entries[0].display.charAt(0).toUpperCase()}
              </div>
              <VipBadge userId={entries[0].id} size="sm" showLabel={false} />
              <p className="text-white text-xs font-semibold">{entries[0].display}</p>
              <p className="text-gray-300 text-xs">${entries[0].totalUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              <div className="w-20 h-24 bg-yellow-500/20 border border-yellow-500/30 rounded-t-xl flex items-center justify-center text-2xl">🥇</div>
            </div>
            {/* 3rd */}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 ${
                entries[2].isMe ? 'border-crypto-purple bg-crypto-purple/30' : 'border-orange-600 bg-orange-500/20'
              }`}>
                {entries[2].display.charAt(0).toUpperCase()}
              </div>
              <VipBadge userId={entries[2].id} size="sm" showLabel={false} />
              <p className="text-gray-300 text-xs font-medium">{entries[2].display}</p>
              <p className="text-gray-400 text-xs">${entries[2].totalUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              <div className="w-20 h-12 bg-orange-500/20 border border-orange-500/30 rounded-t-xl flex items-center justify-center text-2xl">🥉</div>
            </div>
          </div>
        )}

        {/* Full list */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
            <TrendingUp size={15} className="text-crypto-purple" />
            <span className="text-white font-semibold text-sm">Top 10 Investors</span>
          </div>
          <div className="divide-y divide-white/5">
            {entries.length === 0 ? (
              <p className="text-center text-gray-500 py-10 text-sm">No investors yet. Be the first!</p>
            ) : entries.map((e, i) => (
              <div key={e.id} className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                e.isMe ? 'bg-crypto-purple/10' : 'hover:bg-white/5'
              }`}>
                {/* Rank */}
                <div className="w-8 flex justify-center shrink-0">
                  {rankMedal(i + 1)}
                </div>

                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${
                  e.isMe
                    ? 'bg-gradient-to-br from-crypto-purple to-blue-500'
                    : 'bg-white/10'
                }`}>
                  {e.display.charAt(0).toUpperCase()}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${e.isMe ? 'text-white' : 'text-gray-300'}`}>
                      {e.display}
                      {e.isMe && <span className="text-crypto-purple text-xs ml-1">(you)</span>}
                    </p>
                    <VipBadge userId={e.id} size="sm" />
                  </div>
                </div>

                {/* Value */}
                <div className="text-right shrink-0">
                  <p className="text-white font-semibold text-sm">
                    ${e.totalUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-gray-500 text-xs">portfolio value</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Leaderboard updates in real-time. Names are anonymized to protect user privacy.
        </p>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Leaderboard;
function getUserBalances(id: string): UserBalances {
  // TODO: Replace with real data fetching logic
  return { BTC: 0, USDT: 0, ETH: 0 };
}
function getUserInvestments(uid: string) {
  // Fetch real investment data for the user from Firestore
  return fetchUserInvestments(uid);
}

