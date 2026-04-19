import { collection, doc, getDoc, setDoc, updateDoc, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp, writeBatch, runTransaction, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User as AuthUser, sendPasswordResetEmail } from 'firebase/auth';
import type { UserCredential } from 'firebase/auth';

export interface User {
  uid: string;
  name: string;
  email: string;
  createdAt: string;
  referralCode: string;
  referredBy?: string;
  frozen?: boolean;
  kycStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  kycData?: { fullName: string; country: string; submittedAt: string };
  twoFAEnabled?: boolean;
  twoFACode?: string;
}

export interface UserBalances { BTC: number; USDT: number; ETH: number; }

export interface ActiveInvestment {
  id: string;
  planId: string;
  planName: string;
  coin: keyof UserBalances;
  amount: number;
  dailyRate: number;
  durationDays: number;
  startedAt: string;
  maturesAt: string;
  status: 'active' | 'completed';
  earnedSoFar: number;
}

export interface WithdrawalRequest {
  id: string;
  uid: string;
  userName: string;
  userEmail: string;
  coin: keyof UserBalances;
  amount: number;
  address: string;
  network: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  note?: string;
}

export type TxType =
  | 'signup'
  | 'deposit'
  | 'withdrawal_pending'
  | 'withdrawal_approved'
  | 'withdrawal_rejected'
  | 'investment_start'
  | 'investment_claim'
  | 'referral_bonus'
  | 'admin_credit'
  | 'admin_debit';

export interface Transaction {
  id: string;
  type: TxType;
  coin: keyof UserBalances;
  amount: number;
  note: string;
  createdAt: string;
}

export type NotifType = 'investment' | 'withdrawal' | 'deposit' | 'kyc' | 'referral' | 'broadcast' | 'general';

export interface Notification {
  id: string;
  type: NotifType;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface BroadcastMessage {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  active: boolean;
  createdAt: string;
}

// Helper
const makeReferralCode = (name: string): string => {
  const base = name.replace(/\s+/g, '').toUpperCase().slice(0, 4);
  return base + Math.random().toString(36).slice(2, 6).toUpperCase();
};

// Auth
export const registerUser = async (
  name: string,
  email: string,
  password: string,
  referralCode?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const emailLower = email.toLowerCase().trim();
    const { user }: UserCredential = await createUserWithEmailAndPassword(auth, emailLower, password);
    
    let referredBy: string | undefined;
    if (referralCode) {
      const referrer = await findUserByReferralCode(referralCode.trim().toUpperCase());
      if (referrer) {
        referredBy = referrer.uid;
      }
    }

    const userData: Omit<User, 'uid'> = {
      name: name.trim(),
      email: emailLower,
      createdAt: new Date().toISOString(),
      referralCode: makeReferralCode(name),
      frozen: false,
      kycStatus: 'none',
      twoFAEnabled: false,
    };
    if (referredBy) userData.referredBy = referredBy;

    const batch = writeBatch(db);
    batch.set(doc(db, 'users', user.uid), userData);
    batch.set(doc(db, `users/${user.uid}/balances`, 'main'), { BTC: 0, USDT: 0, ETH: 0 });
    await batch.commit();

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const loginUser = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = () => signOut(auth);

export const sendPasswordReset = (email: string) => sendPasswordResetEmail(auth, email);

// User profile
export const getUser = async (uid: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() as Omit<User, 'uid'> };
};

export const findUserByReferralCode = async (code: string): Promise<User | null> => {
  const q = query(collection(db, 'users'), where('referralCode', '==', code));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  return { uid: snap.docs[0].id, ...data as Omit<User, 'uid'> };
};

export const updateUser = async (uid: string, updates: Partial<Omit<User, 'uid'>>): Promise<{ success: boolean; error?: string }> => {
  try {
    await updateDoc(doc(db, 'users', uid), updates);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  const snap = await getDocs(query(collection(db, 'users')));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() as Omit<User, 'uid'> }));
};

// Balances
export const getUserBalances = async (uid: string): Promise<UserBalances> => {
  const snap = await getDoc(doc(db, `users/${uid}/balances`, 'main'));
  return snap.exists() ? snap.data() as UserBalances : { BTC: 0, USDT: 0, ETH: 0 };
};

export const adjustBalance = async (
  uid: string,
  coin: keyof UserBalances,
  amount: number
): Promise<{ success: boolean; error?: string }> => {
  return await runTransaction(db, async (transaction) => {
    const balRef = doc(db, `users/${uid}/balances`, 'main');
    const balSnap = await transaction.get(balRef);
    const current: UserBalances = balSnap.exists() ? balSnap.data() as UserBalances : { BTC: 0, USDT: 0, ETH: 0 };
    const newVal = parseFloat((current[coin] + amount).toFixed(8));
    if (newVal < 0) throw new Error('Insufficient balance.');
    transaction.set(balRef, { ...current, [coin]: newVal });
  }).then(() => ({ success: true })).catch((e: any) => ({ success: false, error: e.message }));
};

// Investments
export const getUserInvestments = async (uid: string): Promise<ActiveInvestment[]> => {
  const snap = await getDocs(collection(db, `users/${uid}/investments`));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() as Omit<ActiveInvestment, 'id'> }));
};

export const calcEarnings = (inv: ActiveInvestment): number => {
  const now = Date.now();
  const start = new Date(inv.startedAt).getTime();
  const end = new Date(inv.maturesAt).getTime();
  const elapsedDays = Math.min((now - start) / 86400000, inv.durationDays);
  return parseFloat((inv.amount * inv.dailyRate * elapsedDays).toFixed(8));
};


export const claimInvestment = async (uid: string, investmentId: string): Promise<{ success: boolean; error?: string }> => {
  return await runTransaction(db, async (transaction) => {
    const invRef = doc(db, `users/${uid}/investments`, investmentId);
    const invSnap = await transaction.get(invRef);
    if (!invSnap.exists()) throw new Error('Investment not found.');
    const inv = invSnap.data() as ActiveInvestment;
    if (inv.status === 'completed') throw new Error('Already claimed.');
    if (new Date() < new Date(inv.maturesAt)) throw new Error('Not matured yet.');
    
    const earnings = calcEarnings(inv);
    const payout = parseFloat((inv.amount + earnings).toFixed(8));
    await adjustBalance(uid, inv.coin, payout);
    transaction.update(invRef, { status: 'completed' as const, earnedSoFar: earnings });
  }).then(() => ({ success: true })).catch((e: any) => ({ success: false, error: e.message }));
};

export const createInvestment = async (
  uid: string,
  plan: { id: string; name: string; dailyRate: number; durationDays: number },
  coin: keyof UserBalances,
  amount: number
): Promise<{ success: boolean; error?: string }> => {
  const deduct = await adjustBalance(uid, coin, -amount);
  if (!deduct.success) return deduct;

  const now = new Date();
  const investment: Omit<ActiveInvestment, 'id'> = {
    planId: plan.id,
    planName: plan.name,
    coin,
    amount,
    dailyRate: plan.dailyRate,
    durationDays: plan.durationDays,
    startedAt: now.toISOString(),
    maturesAt: new Date(now.getTime() + plan.durationDays * 86400000).toISOString(),
    status: 'active',
    earnedSoFar: 0,
  };

  await addDoc(collection(db, `users/${uid}/investments`), investment);
  await addTransaction(uid, { type: 'investment_start', coin, amount, note: `Started ${plan.name} plan` });
  return { success: true };
};

// Transactions
export const addTransaction = async (uid: string, tx: Omit<Transaction, 'id' | 'createdAt'>) => {
  await addDoc(collection(db, `users/${uid}/transactions`), {
    ...tx,
    createdAt: serverTimestamp(),
  });
};

export const getUserTransactions = async (uid: string): Promise<Transaction[]> => {
  const q = query(collection(db, `users/${uid}/transactions`), orderBy('createdAt', 'desc'), limit(200)) as any;
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as any;
    return { id: d.id, ...data, createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString() } as Transaction;
  });
};

// Notifications (add these)
export const getUserNotifications = async (uid: string): Promise<Notification[]> => {
  const snap = await getDocs(query(collection(db, `users/${uid}/notifications`), orderBy('createdAt', 'desc'), limit(100)) as any);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() as Omit<Notification, 'id'> }));
};

export const markAllNotificationsRead = async (uid: string): Promise<void> => {
  const notificationsRef = collection(db, `users/${uid}/notifications`);
  const snap = await getDocs(notificationsRef);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
};

export const addNotification = async (uid: string, type: NotifType, message: string) => {
  await addDoc(collection(db, `users/${uid}/notifications`), {
    type,
    message,
    read: false,
    createdAt: serverTimestamp(),
  });
};

// Withdrawals (add getAllWithdrawalRequests for admin)
export const getAllWithdrawalRequests = async (): Promise<WithdrawalRequest[]> => {
  const snap = await getDocs(query(collection(db, 'withdrawals'), orderBy('requestedAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() as Omit<WithdrawalRequest, 'id'> }));
};

export const getUserWithdrawalRequests = async (uid: string): Promise<WithdrawalRequest[]> => {
  const q = query(collection(db, 'withdrawals'), where('uid', '==', uid), orderBy('requestedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() as Omit<WithdrawalRequest, 'id'> }));
};

export const requestWithdrawal = async (
  uid: string,
  userName: string,
  userEmail: string,
  coin: keyof UserBalances,
  amount: number,
  address: string,
  network: string
): Promise<{ success: boolean; error?: string }> => {
  const deduct = await adjustBalance(uid, coin, -amount);
  if (!deduct.success) return deduct;

  const withdrawal = {
    uid,
    userName,
    userEmail,
    coin,
    amount,
    address,
    network,
    status: 'pending' as const,
    requestedAt: new Date().toISOString(),
  };


  await addDoc(collection(db, 'withdrawals'), withdrawal);
  await addTransaction(uid, { type: 'withdrawal_pending', coin, amount, note: `Withdrawal to ${address.slice(0,10)}...` });
  return { success: true };
};

// Admin functions
export const reviewKYC = async (uid: string, decision: 'verified' | 'rejected'): Promise<{ success: boolean }> => {
  try {
    await updateUser(uid, { kycStatus: decision });
    await addNotification(uid, 'kyc', decision === 'verified' ? 'KYC approved!' : 'KYC rejected. Resubmit.');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

export const adminCreateInvestment = async (
  uid: string,
  plan: { id: string; name: string; dailyRate: number; durationDays: number },
  coin: keyof UserBalances,
  amount: number
): Promise<{ success: boolean; error?: string }> => {
  const now = new Date();
  const investment: Omit<ActiveInvestment, 'id'> = {
    planId: plan.id,
    planName: plan.name,
    coin,
    amount,
    dailyRate: plan.dailyRate,
    durationDays: plan.durationDays,
    startedAt: now.toISOString(),
    maturesAt: new Date(now.getTime() + plan.durationDays * 86400000).toISOString(),
    status: 'active',
    earnedSoFar: 0,
  };

  await addDoc(collection(db, `users/${uid}/investments`), investment);
  await addTransaction(uid, { type: 'investment_start', coin, amount: amount, note: `Admin: Started ${plan.name} plan` });
  await addNotification(uid, 'investment', `Admin added ${plan.name} investment of ${amount} ${coin}.`);
  return { success: true };
};

export const setBroadcast = async (message: string, type: 'info' | 'warning' | 'success') => {
  const bc = {
    message,
    type,
    active: true,
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'admin/broadcast'), bc);
};

export const getBroadcast = async (): Promise<BroadcastMessage | null> => {
  const snap = await getDoc(doc(db, 'admin/broadcast'));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { id: 'broadcast', ...data as Omit<BroadcastMessage, 'id'> };
};

export const clearBroadcast = async () => {
  await updateDoc(doc(db, 'admin/broadcast'), { active: false });
};

export const reviewWithdrawal = async (
  withdrawalId: string,
  decision: 'approved' | 'rejected',
  note?: string
): Promise<{ success: boolean }> => {
  try {
    const wRef = doc(db, 'withdrawals', withdrawalId);
    const wSnap = await getDoc(wRef);
    if (!wSnap.exists()) return { success: false };
    const w = wSnap.data() as WithdrawalRequest;
    await updateDoc(wRef, {
      status: decision,
      reviewedAt: new Date().toISOString(),
      note,
    });
    if (decision === 'rejected') {
      await adjustBalance(w.uid, w.coin, w.amount); // refund
    }
    await addTransaction(w.uid, {
      type: decision === 'approved' ? 'withdrawal_approved' : 'withdrawal_rejected',
      coin: w.coin,
      amount: w.amount,
      note: decision === 'approved' ? 'Approved' : `Rejected: ${note || 'No reason'}`,
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};




