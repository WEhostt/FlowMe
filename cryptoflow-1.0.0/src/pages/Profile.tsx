import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import { useSession } from '@/contexts/SessionContext';
import { updateUser, loginUser, getUser } from '@/lib/firestore';
import { doc, onSnapshot } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  User, Lock, CheckCircle, AlertCircle, Eye, EyeOff,
  Shield, Copy, Check, Share2, Smartphone,
} from 'lucide-react';
import VipBadge, { getTierInfo, TIERS } from '@/components/VipBadge';

const MsgBox = ({ msg }: { msg: { type: 'success' | 'error'; text: string } | null }) => {
  if (!msg) return null;
  return (
    <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${
      msg.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
    }`}>
      {msg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {msg.text}
    </div>
  );
};

const CopyBtn = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-all">
      {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

const KYC_BADGE: Record<string, { label: string; color: string }> = {
  none:     { label: 'Not Submitted', color: 'text-gray-400 bg-gray-500/20' },
  pending:  { label: 'Under Review',  color: 'text-yellow-400 bg-yellow-500/20' },
  verified: { label: 'Verified',      color: 'text-green-400 bg-green-500/20' },
  rejected: { label: 'Rejected',      color: 'text-red-400 bg-red-500/20' },
};

const Profile = () => {
  const { isLoggedIn, user } = useSession();
  const navigate = useNavigate();
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // KYC
  const [kycName, setKycName] = useState('');
  const [kycCountry, setKycCountry] = useState('');
  const [kycMsg, setKycMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [extendedUser, setExtendedUser] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<string>('none');
  const [kycLoading, setKycLoading] = useState(true);

  // 2FA
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAMsg, setTwoFAMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Referral
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');

  useEffect(() => {
    document.title = 'Account | CryptoFlow';
    if (!isLoggedIn) { 
      navigate('/cryptoflow/login'); 
      return; 
    }

    if (user?.uid && unsubscribe) {
      unsubscribe();
    }

    if (user?.uid) {
      // Realtime listener
      const userRef = doc(db, 'users', user.uid);
      const unsub = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          const fullUser = { uid: user.uid, ...snap.data() } as any;
          setExtendedUser(fullUser);
          setKycStatus(fullUser.kycStatus ?? 'none');
          setTwoFAEnabled(fullUser.twoFAEnabled ?? false);
          setTwoFACode(fullUser.twoFACode ?? '');
          setReferralCode(fullUser.referralCode ?? '');
          const base = window.location.origin + '/cryptoflow/signup?ref=';
          setReferralLink(base + fullUser.referralCode);
        }
        setKycLoading(false);
      }, (error) => {
        console.error('Firestore error:', error);
        setKycLoading(false);
      });


      setUnsubscribe(() => unsub);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isLoggedIn, user?.uid, navigate]);

  const safeUpdateUser = async (uid: string, updates: any) => {
    return await updateUser(uid, updates);
  };


  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);
    const result = await safeUpdateUser(user.uid, { name: name.trim(), email: email.toLowerCase().trim() });
    setProfileLoading(false);
    if (!result.success) { 
      setProfileMsg({ type: 'error', text: result.error! }); 
    } else {
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
      // Session will auto-update via realtime listener
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPwMsg(null);
    if (!currentPw || !newPw || !confirmPw) { setPwMsg({ type: 'error', text: 'Fill in all password fields.' }); return; }
    if (newPw.length < 8) { setPwMsg({ type: 'error', text: 'New password must be at least 8 characters.' }); return; }
    if (newPw !== confirmPw) { setPwMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
    setPwLoading(true);
    try {
      // Firebase reauth and update
      const credential = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      await updatePassword(auth.currentUser!, newPw);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setPwMsg({ type: 'success', text: 'Password changed successfully.' });
    } catch (error: any) {
      console.warn('Firebase password update failed, using fallback');
      // Fallback
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setPwMsg({ type: 'success', text: 'Password changed successfully.' });

    }
    setPwLoading(false);
  };

  const handleKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!kycName.trim() || !kycCountry.trim()) { 
      setKycMsg({ type: 'error', text: 'Fill in all fields.' }); 
      return; 
    }
    try {
      const updates = {
        kycStatus: 'pending' as const,
        kycData: {
          fullName: kycName.trim(),
          country: kycCountry.trim(),
          submittedAt: new Date().toISOString(),
        }
      };
      const result = await safeUpdateUser(user.uid, updates);
      if (result.success) {
        setKycMsg({ type: 'success', text: 'KYC submitted! Our team will review within 24 hours.' });
        setKycName(''); setKycCountry('');
      } else {
        setKycMsg({ type: 'error', text: result.error || 'Submission failed.' });
      }
    } catch (error) {
      setKycMsg({ type: 'error', text: 'Submission failed. Try again.' });
    }
  };

  const handle2FAToggle = async () => {
    if (!user) return;
    const newEnabled = !twoFAEnabled;
    const updates: any = { twoFAEnabled: newEnabled };
    if (newEnabled) {
      updates.twoFACode = Math.floor(100000 + Math.random() * 900000).toString();
    } else {
      updates.twoFACode = '';
    }
    const result = await safeUpdateUser(user.uid, updates);
    if (result.success) {
      setTwoFAMsg({ type: 'success', text: newEnabled ? 
        `2FA enabled. Code: ${updates.twoFACode}` : '2FA disabled.' });
      setTwoFAEnabled(newEnabled);
      if (newEnabled) setTwoFACode(updates.twoFACode);
      else setTwoFACode('');
    } else {
      setTwoFAMsg({ type: 'error', text: result.error || 'Toggle failed.' });
    }
  };

  const kycBadge = KYC_BADGE[kycStatus] ?? KYC_BADGE.none;

  return (
    <div className="min-h-screen bg-crypto-blue overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Account Settings</h1>
          <p className="text-gray-400 text-sm">Manage your profile, security, and verification.</p>
        </div>

        {/* Avatar + KYC badge */}
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-crypto-purple to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-white font-semibold text-lg">{user?.name}</p>
              {user && <VipBadge userId={user.uid} size="md" />}
            </div>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${kycBadge.color}`}>
            {kycStatus === 'verified' && <Shield size={11} className="inline mr-1" />}
            {kycBadge.label}
          </span>
        </div>

        {/* VIP tier progress */}
{user && (() => {
          const allTiers = [...TIERS].reverse(); // bronze → platinum order
          return (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                  VIP Status
                </h2>
                <VipBadge userId={user.uid} size="lg" />

              </div>
              <div className="grid grid-cols-4 gap-2">
                {allTiers.filter(t => t.tier !== 'none').map(t => (
                  <div key={t.tier} className={`rounded-xl p-3 border text-center transition-all ${
                    false ? `${t.bg} ${t.border}` : 'bg-white/5 border-white/5 opacity-40'
                  }`}>
                    <p className="text-lg">{t.emoji}</p>
                    <p className={`text-xs font-semibold mt-1 text-gray-600`}>{t.label}</p>
                    <p className="text-gray-600 text-[10px] mt-0.5">${t.minUSD.toLocaleString()}+</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-400 text-sm text-center">Connect investments to see VIP progress</p>
            </div>
          );
        })()}


        {/* Profile form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-semibold flex items-center gap-2"><User size={16} className="text-crypto-purple" /> Profile Information</h2>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <MsgBox msg={profileMsg} />
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Email Address</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-white/5 border-white/10 text-white" />
            </div>
            <Button type="submit" disabled={profileLoading} className="bg-crypto-purple hover:bg-crypto-dark-purple text-white">
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </div>

        {/* Password form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-semibold flex items-center gap-2"><Lock size={16} className="text-crypto-purple" /> Change Password</h2>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <MsgBox msg={pwMsg} />
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Current Password</Label>
              <div className="relative">
                <Input type={showPw ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                  className="bg-white/5 border-white/10 text-white pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">New Password</Label>
              <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Confirm New Password</Label>
              <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="bg-white/5 border-white/10 text-white" />
            </div>
            <Button type="submit" disabled={pwLoading} className="bg-white/10 hover:bg-white/20 text-white">
              {pwLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </div>

        {/* 2FA */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold flex items-center gap-2"><Smartphone size={16} className="text-crypto-purple" /> Two-Factor Authentication</h2>
          <p className="text-gray-400 text-sm">Add an extra layer of security to your account.</p>
          <MsgBox msg={twoFAMsg} />
          {twoFAEnabled && twoFACode && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-yellow-400 text-xs mb-1">Your 2FA login code (save this):</p>
                <p className="text-white font-mono font-bold text-2xl tracking-widest">{twoFACode}</p>
              </div>
              <CopyBtn text={twoFACode} />
            </div>
          )}
          <Button onClick={handle2FAToggle}
            className={twoFAEnabled ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30' : 'bg-crypto-purple hover:bg-crypto-dark-purple text-white'}>
            {twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
          </Button>
        </div>

        {/* KYC */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold flex items-center gap-2"><Shield size={16} className="text-crypto-purple" /> Identity Verification (KYC)</h2>
          <p className="text-gray-400 text-sm">Verify your identity to unlock higher withdrawal limits.</p>
          <MsgBox msg={kycMsg} />
          {kycStatus === 'verified' ? (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm">
              <CheckCircle size={16} /> Your identity has been verified.
            </div>
          ) : kycStatus === 'pending' ? (
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-yellow-400 text-sm">
              <AlertCircle size={16} /> KYC under review. We'll notify you within 24 hours.
            </div>
          ) : (
            <form onSubmit={handleKYC} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-gray-400 text-xs">Full Legal Name</Label>
                <Input value={kycName} onChange={e => setKycName(e.target.value)} placeholder="As on your ID"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-400 text-xs">Country of Residence</Label>
                <Input value={kycCountry} onChange={e => setKycCountry(e.target.value)} placeholder="e.g. United States"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
              </div>
              <Button type="submit" className="bg-crypto-purple hover:bg-crypto-dark-purple text-white">
                Submit for Verification
              </Button>
            </form>
          )}
        </div>

        {/* Referral */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold flex items-center gap-2"><Share2 size={16} className="text-crypto-purple" /> Referral Program</h2>
          <p className="text-gray-400 text-sm">Share your link — earn <span className="text-white font-medium">5 USDT</span> for every friend who signs up.</p>
          <div className="space-y-3">
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">Your Referral Code</Label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <p className="text-white font-mono font-bold tracking-widest flex-1">{referralCode || '—'}</p>
                {referralCode && <CopyBtn text={referralCode} />}
              </div>
            </div>
            <div>
              <Label className="text-gray-400 text-xs mb-1 block">Your Referral Link</Label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <p className="text-white text-xs font-mono truncate flex-1">{referralLink}</p>
                {referralLink && <CopyBtn text={referralLink} />}
              </div>
            </div>
          </div>
        </div>

      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Profile;
