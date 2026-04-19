import { UserBalances, User } from '@/lib/firestore';
import { DollarSign, KeyRound, TrendingUp, UserCheck, UserX, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSession } from '@/contexts/SessionContext';

interface UserRowProps {
  user: User & { id: string; frozen?: boolean; kycStatus?: string };
  i: number;
  refresh: () => void;
}

const UserRow = ({ user, i, refresh }: UserRowProps) => {
  const [bal, setBal] = useState<UserBalances | null>(null);
  const { user: currentUser } = useSession();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { getUserBalances } = await import('@/lib/firestore');
        const b = await getUserBalances(user.id);
        if (mounted) setBal(b);
      } catch {
        if (mounted) setBal({ BTC: 0, USDT: 0, ETH: 0 });
      }
    })();
    return () => { mounted = false; };
  }, [user.id]);

  const toggleFreeze = async () => {
    import('@/lib/firestore').then(({ updateUser }) => {
      updateUser(user.id, { frozen: !user.frozen });
    });
    refresh();
  };

  const deleteUser = () => {
    // Mock delete
    refresh();
  };

  return (
    <div className={`grid grid-cols-12 items-center px-6 py-4 hover:bg-white/5 transition-colors gap-2 ${user.frozen ? 'opacity-50' : ''}`}>
      <span className="col-span-1 text-gray-500 text-sm">{i + 1}</span>
      <div className="col-span-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-crypto-purple to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{user.name.charAt(0).toUpperCase()}</div>
        <span className="text-white text-sm truncate">{user.name}</span>
      </div>
      <span className="col-span-3 text-gray-300 text-sm truncate">{user.email}</span>
      <div className="col-span-3 flex flex-col gap-0.5">
        <span className="text-orange-400 text-xs font-mono">{bal ? bal.BTC.toFixed(6) : '...'} BTC</span>
        <span className="text-green-400 text-xs font-mono">{bal ? bal.USDT.toFixed(2) : '...'} USDT</span>
        <span className="text-blue-400 text-xs font-mono">{bal ? bal.ETH.toFixed(6) : '...'} ETH</span>
      </div>
      <div className="col-span-1">
        {user.kycStatus === 'verified' && <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">KYC</span>}
        {user.kycStatus === 'pending' && <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">Pend</span>}
        {(!user.kycStatus || user.kycStatus === 'none') && <span className="text-xs text-gray-600">—</span>}
      </div>
      <div className="col-span-2 flex justify-end items-center gap-1">
        <button className="text-gray-500 hover:text-crypto-purple p-1" title="Manage balance"><DollarSign size={15} /></button>
        <button className="text-gray-500 hover:text-yellow-400 p-1" title="Reset password"><KeyRound size={15} /></button>
        <button className="text-gray-500 hover:text-green-400 p-1" title="Set investment"><TrendingUp size={15} /></button>
        <button onClick={toggleFreeze} className={`p-1 ${user.frozen ? 'text-blue-400 hover:text-blue-300' : 'text-gray-500 hover:text-red-400'}`} title={user.frozen ? 'Unfreeze' : 'Freeze'}>
          {user.frozen ? <UserCheck size={15} /> : <UserX size={15} />}
        </button>
        {user.email !== currentUser?.email && (
          <button onClick={deleteUser} className="text-gray-500 hover:text-red-400 p-1" title="Delete user"><Trash2 size={15} /></button>
        )}
      </div>
    </div>
  );
};

export default UserRow;

