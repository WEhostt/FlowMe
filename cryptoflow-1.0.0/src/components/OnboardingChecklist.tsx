import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, X, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getUserBalances, getUserInvestments, getUserTransactions } from '@/lib/firestore';
import { useSession } from '@/contexts/SessionContext';


interface Step {
  id: string;
  label: string;
  description: string;
  cta: string;
  ctaLink: string;
  done: boolean;
}

const OnboardingChecklist = () => {
  const { user } = useSession();
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  const [hasBalance, setHasBalance] = useState(false);
  const [hasInvested, setHasInvested] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [hasDeposit, setHasDeposit] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    // Removed localStorage - always show unless all done
    if (hasBalance && hasInvested && hasClaimed) { 
      setDismissed(true); 
      return; 
    }

    Promise.all([
      getUserBalances(user.uid).then(b => setHasBalance(Object.values(b).some((v: any) => v > 0))),
      getUserInvestments(user.uid).then(inv => {
        setHasInvested(inv.length > 0);
        setHasClaimed(inv.some((i: any) => i.status === 'completed'));
      }),
      getUserTransactions(user.uid).then(txs => setHasDeposit(txs.some((t: any) => t.type === 'deposit' || t.type === 'admin_credit')))
    ]).catch(console.error);
  }, [user?.uid]);


  useEffect(() => {
    if (hasBalance === undefined || hasInvested === undefined) return;
    setSteps([
      {
        id: 'account',
        label: 'Create your account',
        description: "You're already in — welcome to CryptoFlow!",
        cta: 'Done',
        ctaLink: '#',
        done: true,
      },
      {
        id: 'deposit',
        label: 'Make your first deposit',
        description: 'Fund your account with BTC, USDT, ETH, or a credit card.',
        cta: 'Deposit Now',
        ctaLink: '/cryptoflow/deposit',
        done: hasBalance || hasDeposit,
      },
      {
        id: 'invest',
        label: 'Start an investment',
        description: 'Choose a plan and start earning daily returns.',
        cta: 'View Plans',
        ctaLink: '/cryptoflow/dashboard',
        done: hasInvested,
      },
      {
        id: 'earn',
        label: 'Claim your earnings',
        description: 'Wait for your investment to mature, then claim your profits.',
        cta: 'Go to Dashboard',
        ctaLink: '/cryptoflow/dashboard',
        done: hasClaimed,
      },
    ]);
  }, [hasBalance, hasInvested, hasClaimed, hasDeposit]);

  if (!user || dismissed || steps.length === 0) return null;

  const allDone = steps.every(s => s.done);
  const completedCount = steps.filter(s => s.done).length;
  const pct = Math.round((completedCount / steps.length) * 100);

  const dismiss = () => {
    setDismissed(true);
  };


  return (
    <div className="bg-gradient-to-br from-crypto-purple/20 to-blue-500/10 border border-crypto-purple/30 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm">
              {allDone ? '🎉 All steps complete!' : 'Getting Started'}
            </span>
            <span className="text-xs text-gray-400">{completedCount}/{steps.length}</span>
          </div>
          {/* Progress bar */}
          <div className="flex-1 max-w-32 h-1.5 bg-white/10 rounded-full">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-crypto-purple to-blue-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-crypto-purple font-semibold">{pct}%</span>
        </div>
        <div className="flex items-center gap-1 ml-3">
          <button
            onClick={() => setCollapsed(v => !v)}
            className="text-gray-500 hover:text-gray-300 p-1 transition-colors"
          >
            {collapsed ? <ChevronDown size= {15} /> : <ChevronUp size={15} />}
          </button>
          <button
            onClick={dismiss}
            className="text-gray-500 hover:text-gray-300 p-1 transition-colors"
            title="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={`rounded-xl p-4 border transition-all ${
                step.done
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="shrink-0 mt-0.5">
                  {step.done ? (
                    <CheckCircle size={18} className="text-green-400" />
                  ) : (
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-600 flex items-center justify-center">
                      <span className="text-[10px] text-gray-500 font-bold">{i + 1}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${step.done ? 'text-green-400 line-through opacity-70' : 'text-white'}`}>
                    {step.label}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{step.description}</p>
                </div>
              </div>
              {!step.done && (
                <Link
                  to={step.ctaLink}
                  className="flex items-center gap-1 text-xs text-crypto-purple hover:text-white transition-colors font-medium mt-1"
                >
                  {step.cta} <ArrowRight size={11} />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OnboardingChecklist;
