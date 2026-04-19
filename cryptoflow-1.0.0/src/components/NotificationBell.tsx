import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, TrendingUp, ArrowDownToLine, ArrowUpRight, Shield, Gift, Megaphone, Info } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { getUserNotifications, markAllRead, Notification, NotifType } from '@/lib/userDb';

const typeIcon = (type: NotifType) => {
  if (type === 'investment')  return <TrendingUp size={13} className="text-purple-400" />;
  if (type === 'withdrawal')  return <ArrowUpRight size={13} className="text-yellow-400" />;
  if (type === 'deposit')     return <ArrowDownToLine size={13} className="text-green-400" />;
  if (type === 'kyc')         return <Shield size={13} className="text-blue-400" />;
  if (type === 'referral')    return <Gift size={13} className="text-pink-400" />;
  if (type === 'broadcast')   return <Megaphone size={13} className="text-orange-400" />;
  return <Info size={13} className="text-gray-400" />;
};

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const NotificationBell = () => {
  const { user, isLoggedIn } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = () => {
    if (user) setNotifications(getUserNotifications(user.id));
  };

  useEffect(() => { refresh(); }, [user]);

  // Poll every 10 seconds for new notifications (broadcasts, etc.)
  useEffect(() => {
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isLoggedIn || !user) return null;

  const unread = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    markAllRead(user.id);
    refresh();
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => { setOpen(!open); if (!open) refresh(); }}
        className="relative text-gray-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Notifications">
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-[#1a1f2c] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-white font-semibold text-sm">Notifications</h3>
            {unread > 0 && (
              <button onClick={handleMarkAllRead}
                className="text-crypto-purple text-xs hover:underline flex items-center gap-1">
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-8">No notifications</p>
            ) : notifications.map(n => (
              <div key={n.id}
                className={`flex items-start gap-3 px-4 py-3 transition-colors ${n.read ? 'hover:bg-white/5' : 'bg-white/5 hover:bg-white/10'}`}>
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  {typeIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-relaxed ${n.read ? 'text-gray-400' : 'text-white'}`}>{n.message}</p>
                  <p className="text-gray-600 text-xs mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-crypto-purple shrink-0 mt-1.5" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
