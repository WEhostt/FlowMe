// User database stored in localStorage with SHA-256 hashed passwords

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  referralCode: string;
  referredBy?: string;       // userId of referrer
  frozen?: boolean;          // admin can freeze account
  kycStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  kycData?: { fullName: string; country: string; submittedAt: string };
  twoFAEnabled?: boolean;
  twoFACode?: string;        // 6-digit simulated code
}

const DB_KEY = 'cryptoflow_users';
const SESSION_KEY = 'cryptoflow_session_user';

// ── Hashing ──────────────────────────────────────────────────────

export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'cryptoflow_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// ── Storage helpers ───────────────────────────────────────────────

const getUsers = (): User[] => {
  try { return JSON.parse(localStorage.getItem(DB_KEY) || '[]'); } catch { return []; }
};

const saveUsers = (users: User[]) => {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
};

const makeReferralCode = (name: string): string => {
  const base = name.replace(/\s+/g, '').toUpperCase().slice(0, 4);
  return base + Math.random().toString(36).slice(2, 6).toUpperCase();
};

// ── Public API ────────────────────────────────────────────────────

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  referralCode?: string
): Promise<{ success: boolean; error?: string }> => {
  const users = getUsers();
  const emailLower = email.toLowerCase().trim();

  if (users.find(u => u.email === emailLower)) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  // Find referrer
  let referredBy: string | undefined;
  if (referralCode) {
    const referrer = users.find(u => u.referralCode === referralCode.trim().toUpperCase());
    if (referrer) {
      referredBy = referrer.id;
      // Give referrer 5 USDT bonus
      adjustBalance(referrer.id, 'USDT', 5);
      addNotification(referrer.id, 'referral', `Your referral ${name} just signed up! +5 USDT bonus credited.`);
    }
  }

  const passwordHash = await hashPassword(password);
  const newUser: User = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: emailLower,
    passwordHash,
    createdAt: new Date().toISOString(),
    referralCode: makeReferralCode(name),
    referredBy,
    frozen: false,
    kycStatus: 'none',
    twoFAEnabled: false,
  };

  saveUsers([...users, newUser]);
  addTransaction(newUser.id, { type: 'signup', coin: 'USDT', amount: 0, note: 'Account created' });
  return { success: true };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string; requires2FA?: boolean }> => {
  const users = getUsers();
  const emailLower = email.toLowerCase().trim();
  const user = users.find(u => u.email === emailLower);

  if (!user) return { success: false, error: 'No account found with this email.' };
  if (user.frozen) return { success: false, error: 'Your account has been suspended. Contact support.' };

  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash) return { success: false, error: 'Incorrect password.' };

  if (user.twoFAEnabled) {
    return { success: true, user, requires2FA: true };
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, name: user.name, email: user.email }));
  return { success: true, user };
};

export const complete2FA = (userId: string, code: string): { success: boolean; error?: string } => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, error: 'User not found.' };
  if (user.twoFACode !== code) return { success: false, error: 'Invalid code.' };
  localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, name: user.name, email: user.email }));
  return { success: true };
};

export const getSessionUser = (): Pick<User, 'id' | 'name' | 'email'> | null => {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
};

export const logoutUser = () => { localStorage.removeItem(SESSION_KEY); };

export const getUserCount = (): number => getUsers().length;

export const getAllUsers = (): Omit<User, 'passwordHash'>[] =>
  getUsers().map(({ passwordHash: _, ...u }) => u);

export const getFullUser = (userId: string): Omit<User, 'passwordHash'> | null => {
  const u = getUsers().find(u => u.id === userId);
  if (!u) return null;
  const { passwordHash: _, ...rest } = u;
  return rest;
};

export const updateUser = async (
  id: string,
  updates: { name?: string; email?: string; password?: string; frozen?: boolean; twoFAEnabled?: boolean; twoFACode?: string }
): Promise<{ success: boolean; error?: string }> => {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return { success: false, error: 'User not found.' };

  if (updates.email) {
    const emailLower = updates.email.toLowerCase().trim();
    if (users.find(u => u.email === emailLower && u.id !== id))
      return { success: false, error: 'Email already in use.' };
    users[idx].email = emailLower;
  }
  if (updates.name !== undefined) users[idx].name = updates.name.trim();
  if (updates.password) users[idx].passwordHash = await hashPassword(updates.password);
  if (updates.frozen !== undefined) users[idx].frozen = updates.frozen;
  if (updates.twoFAEnabled !== undefined) users[idx].twoFAEnabled = updates.twoFAEnabled;
  if (updates.twoFACode !== undefined) users[idx].twoFACode = updates.twoFACode;

  saveUsers(users);
  const session = getSessionUser();
  if (session && session.id === id) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      id: users[idx].id, name: users[idx].name, email: users[idx].email,
    }));
  }
  return { success: true };
};

// ── KYC ──────────────────────────────────────────────────────────

export const submitKYC = (
  userId: string,
  fullName: string,
  country: string
): { success: boolean; error?: string } => {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return { success: false, error: 'User not found.' };
  users[idx].kycStatus = 'pending';
  users[idx].kycData = { fullName, country, submittedAt: new Date().toISOString() };
  saveUsers(users);
  return { success: true };
};

export const reviewKYC = (
  userId: string,
  decision: 'verified' | 'rejected'
): { success: boolean } => {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return { success: false };
  users[idx].kycStatus = decision;
  saveUsers(users);
  addNotification(
    userId,
    'kyc',
    decision === 'verified'
      ? 'Your identity has been verified. KYC approved!'
      : 'Your KYC submission was rejected. Please resubmit with valid details.'
  );
  return { success: true };
};

// ── Balances ──────────────────────────────────────────────────────

export interface UserBalances { BTC: number; USDT: number; ETH: number; }

const BALANCES_KEY = 'cryptoflow_balances';

const getAllBalances = (): Record<string, UserBalances> => {
  try { return JSON.parse(localStorage.getItem(BALANCES_KEY) || '{}'); } catch { return {}; }
};

export const getUserBalances = (userId: string): UserBalances => {
  return getAllBalances()[userId] ?? { BTC: 0, USDT: 0, ETH: 0 };
};

export const adjustBalance = (
  userId: string,
  coin: keyof UserBalances,
  amount: number
): { success: boolean; error?: string } => {
  const all = getAllBalances();
  const current = all[userId] ?? { BTC: 0, USDT: 0, ETH: 0 };
  const newVal = parseFloat((current[coin] + amount).toFixed(8));
  if (newVal < 0) return { success: false, error: 'Insufficient balance.' };
  all[userId] = { ...current, [coin]: newVal };
  localStorage.setItem(BALANCES_KEY, JSON.stringify(all));
  return { success: true };
};

// ── Investments ────────────────────────────────────────────────────

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

const INVESTMENTS_KEY = 'cryptoflow_investments';

const getAllInvestments = (): Record<string, ActiveInvestment[]> => {
  try { return JSON.parse(localStorage.getItem(INVESTMENTS_KEY) || '{}'); } catch { return {}; }
};

export const getUserInvestments = (userId: string): ActiveInvestment[] =>
  getAllInvestments()[userId] ?? [];

export const createInvestment = (
  userId: string,
  plan: { id: string; name: string; dailyRate: number; durationDays: number },
  coin: keyof UserBalances,
  amount: number
): { success: boolean; error?: string } => {
  const deduct = adjustBalance(userId, coin, -amount);
  if (!deduct.success) return deduct;

  const now = new Date();
  const matures = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
  const investment: ActiveInvestment = {
    id: crypto.randomUUID(),
    planId: plan.id,
    planName: plan.name,
    coin,
    amount,
    dailyRate: plan.dailyRate,
    durationDays: plan.durationDays,
    startedAt: now.toISOString(),
    maturesAt: matures.toISOString(),
    status: 'active',
    earnedSoFar: 0,
  };

  const all = getAllInvestments();
  all[userId] = [...(all[userId] ?? []), investment];
  localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(all));

  addTransaction(userId, {
    type: 'investment_start',
    coin,
    amount,
    note: `Started ${plan.name} plan`,
  });
  addNotification(userId, 'investment',
    `Your ${plan.name} investment of ${amount} ${coin} has started. Earning ${(plan.dailyRate * 100).toFixed(0)}% daily.`
  );
  return { success: true };
};

export const calcEarnings = (inv: ActiveInvestment): number => {
  const now = Date.now();
  const start = new Date(inv.startedAt).getTime();
  const end = new Date(inv.maturesAt).getTime();
  const elapsed = Math.min(now - start, end - start);
  return parseFloat((inv.amount * inv.dailyRate * (elapsed / (24 * 60 * 60 * 1000))).toFixed(8));
};

export const claimInvestment = (
  userId: string,
  investmentId: string
): { success: boolean; error?: string } => {
  const all = getAllInvestments();
  const list = all[userId] ?? [];
  const idx = list.findIndex(i => i.id === investmentId);
  if (idx === -1) return { success: false, error: 'Investment not found.' };

  const inv = list[idx];
  if (inv.status === 'completed') return { success: false, error: 'Already claimed.' };
  if (new Date() < new Date(inv.maturesAt)) return { success: false, error: 'Not matured yet.' };

  const totalEarnings = calcEarnings(inv);
  const payout = parseFloat((inv.amount + totalEarnings).toFixed(8));

  adjustBalance(userId, inv.coin, payout);
  list[idx] = { ...inv, status: 'completed', earnedSoFar: totalEarnings };
  all[userId] = list;
  localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(all));

  addTransaction(userId, {
    type: 'investment_claim',
    coin: inv.coin,
    amount: payout,
    note: `Claimed ${inv.planName} — principal + earnings`,
  });
  addNotification(userId, 'investment',
    `Your ${inv.planName} investment matured! ${payout.toFixed(6)} ${inv.coin} credited to your balance.`
  );
  return { success: true };
};

// Admin: create investment on behalf of user (no balance deduction)
export const adminCreateInvestment = (
  userId: string,
  plan: { id: string; name: string; dailyRate: number; durationDays: number },
  coin: keyof UserBalances,
  amount: number
): { success: boolean; error?: string } => {
  const now = new Date();
  const matures = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
  const investment: ActiveInvestment = {
    id: crypto.randomUUID(),
    planId: plan.id,
    planName: plan.name,
    coin,
    amount,
    dailyRate: plan.dailyRate,
    durationDays: plan.durationDays,
    startedAt: now.toISOString(),
    maturesAt: matures.toISOString(),
    status: 'active',
    earnedSoFar: 0,
  };
  const all = getAllInvestments();
  all[userId] = [...(all[userId] ?? []), investment];
  localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(all));
  addNotification(userId, 'investment',
    `An investment of ${amount} ${coin} on the ${plan.name} plan has been applied to your account.`
  );
  return { success: true };
};

// ── Withdrawals ────────────────────────────────────────────────────

export interface WithdrawalRequest {
  id: string;
  userId: string;
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

const WITHDRAWALS_KEY = 'cryptoflow_withdrawals';

const getAllWithdrawals = (): WithdrawalRequest[] => {
  try { return JSON.parse(localStorage.getItem(WITHDRAWALS_KEY) || '[]'); } catch { return []; }
};

export const getUserWithdrawals = (userId: string): WithdrawalRequest[] =>
  getAllWithdrawals().filter(w => w.userId === userId);

export const getAllWithdrawalRequests = (): WithdrawalRequest[] => getAllWithdrawals();

export const requestWithdrawal = (
  userId: string,
  userName: string,
  userEmail: string,
  coin: keyof UserBalances,
  amount: number,
  address: string,
  network: string
): { success: boolean; error?: string } => {
  const deduct = adjustBalance(userId, coin, -amount);
  if (!deduct.success) return deduct;

  const req: WithdrawalRequest = {
    id: crypto.randomUUID(),
    userId,
    userName,
    userEmail,
    coin,
    amount,
    address,
    network,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };

  const all = getAllWithdrawals();
  all.push(req);
  localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(all));

  addTransaction(userId, {
    type: 'withdrawal_pending',
    coin,
    amount,
    note: `Withdrawal request to ${address.slice(0, 10)}...`,
  });
  addNotification(userId, 'withdrawal',
    `Withdrawal of ${amount} ${coin} submitted. Pending admin review.`
  );
  return { success: true };
};

export const reviewWithdrawal = (
  withdrawalId: string,
  decision: 'approved' | 'rejected',
  note?: string
): { success: boolean } => {
  const all = getAllWithdrawals();
  const idx = all.findIndex(w => w.id === withdrawalId);
  if (idx === -1) return { success: false };

  const w = all[idx];
  all[idx] = { ...w, status: decision, reviewedAt: new Date().toISOString(), note };

  if (decision === 'rejected') {
    // Refund balance
    adjustBalance(w.userId, w.coin, w.amount);
  }

  localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(all));

  addTransaction(w.userId, {
    type: decision === 'approved' ? 'withdrawal_approved' : 'withdrawal_rejected',
    coin: w.coin,
    amount: w.amount,
    note: decision === 'approved' ? 'Withdrawal processed' : `Withdrawal rejected${note ? ': ' + note : ''}`,
  });
  addNotification(w.userId, 'withdrawal',
    decision === 'approved'
      ? `Your withdrawal of ${w.amount} ${w.coin} has been approved and sent.`
      : `Your withdrawal of ${w.amount} ${w.coin} was rejected.${note ? ' Reason: ' + note : ''}`
  );
  return { success: true };
};

// ── Transactions ──────────────────────────────────────────────────

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

const TX_KEY = 'cryptoflow_transactions';

const getAllTransactions = (): Record<string, Transaction[]> => {
  try { return JSON.parse(localStorage.getItem(TX_KEY) || '{}'); } catch { return {}; }
};

export const addTransaction = (
  userId: string,
  tx: Omit<Transaction, 'id' | 'createdAt'>
) => {
  const all = getAllTransactions();
  const entry: Transaction = {
    ...tx,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  all[userId] = [entry, ...(all[userId] ?? [])].slice(0, 200);
  localStorage.setItem(TX_KEY, JSON.stringify(all));
};

export const getUserTransactions = (userId: string): Transaction[] =>
  getAllTransactions()[userId] ?? [];

// ── Notifications ─────────────────────────────────────────────────

export type NotifType = 'investment' | 'withdrawal' | 'deposit' | 'kyc' | 'referral' | 'broadcast' | 'general';

export interface Notification {
  id: string;
  type: NotifType;
  message: string;
  read: boolean;
  createdAt: string;
}

const NOTIF_KEY = 'cryptoflow_notifications';

const getAllNotifications = (): Record<string, Notification[]> => {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}'); } catch { return {}; }
};

export const addNotification = (userId: string, type: NotifType, message: string) => {
  const all = getAllNotifications();
  const notif: Notification = {
    id: crypto.randomUUID(),
    type,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  };
  all[userId] = [notif, ...(all[userId] ?? [])].slice(0, 100);
  localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
};

export const getUserNotifications = (userId: string): Notification[] =>
  getAllNotifications()[userId] ?? [];

export const markAllRead = (userId: string) => {
  const all = getAllNotifications();
  all[userId] = (all[userId] ?? []).map(n => ({ ...n, read: true }));
  localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
};

export const getUnreadCount = (userId: string): number =>
  (getAllNotifications()[userId] ?? []).filter(n => !n.read).length;

// ── Broadcast ─────────────────────────────────────────────────────

const BROADCAST_KEY = 'cryptoflow_broadcast';

export interface BroadcastMessage {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  createdAt: string;
  active: boolean;
}

export const setBroadcast = (message: string, type: BroadcastMessage['type']) => {
  const msg: BroadcastMessage = {
    id: crypto.randomUUID(),
    message,
    type,
    createdAt: new Date().toISOString(),
    active: true,
  };
  localStorage.setItem(BROADCAST_KEY, JSON.stringify(msg));
  // Also notify all users
  const users = getUsers();
  users.forEach(u => addNotification(u.id, 'broadcast', message));
};

export const clearBroadcast = () => { localStorage.removeItem(BROADCAST_KEY); };

export const getBroadcast = (): BroadcastMessage | null => {
  try {
    const data = localStorage.getItem(BROADCAST_KEY);
    const msg = data ? JSON.parse(data) : null;
    return msg?.active ? msg : null;
  } catch { return null; }
};
