import { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { getBroadcast, BroadcastMessage } from '@/lib/userDb';

const BroadcastBanner = () => {
  const [msg, setMsg] = useState<BroadcastMessage | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMsg(getBroadcast());
    const id = setInterval(() => setMsg(getBroadcast()), 15000);
    return () => clearInterval(id);
  }, []);

  if (!msg || dismissed) return null;

  const colors = {
    info:    'bg-blue-500/10 border-blue-500/30 text-blue-300',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
    success: 'bg-green-500/10 border-green-500/30 text-green-300',
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] border-b px-4 py-2 flex items-center justify-between gap-4 ${colors[msg.type]}`}>
      <div className="flex items-center gap-2 text-sm">
        <Megaphone size={14} className="shrink-0" />
        <span>{msg.message}</span>
      </div>
      <button onClick={() => setDismissed(true)} className="shrink-0 hover:opacity-70">
        <X size={14} />
      </button>
    </div>
  );
};

export default BroadcastBanner;
