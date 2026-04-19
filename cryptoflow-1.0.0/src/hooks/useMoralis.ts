import { useState, useEffect } from 'react';

const MORALIS_API = 'https://deep-index.moralis.io/api/v2.2';
const API_KEY = import.meta.env.VITE_MORALIS_API_KEY as string;

const moralisFetch = (path: string) =>
  fetch(`${MORALIS_API}${path}`, {
    headers: { 'X-API-Key': API_KEY, accept: 'application/json' },
  }).then((r) => {
    if (!r.ok) throw new Error(`Moralis ${r.status}`);
    return r.json();
  });

// ── Token balances ──────────────────────────────────────────────

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;         // raw
  decimals: number;
  token_address: string;
  usd_price: number | null;
  usd_value: number | null;
  logo: string | null;
  price_24h_percent_change: number | null;
}

export const useTokenBalances = (address: string | undefined) => {
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !API_KEY) return;
    setLoading(true);
    setError(null);

    // Fetch ERC-20 balances with prices
    moralisFetch(`/${address}/erc20?chain=eth&exclude_spam=true&exclude_unverified_contracts=true`)
      .then((data) => {
        const result: TokenBalance[] = (data.result ?? []).map((t: any) => ({
          symbol: t.symbol,
          name: t.name,
          balance: t.balance,
          decimals: Number(t.decimals),
          token_address: t.token_address,
          usd_price: t.usd_price ?? null,
          usd_value: t.usd_value ?? null,
          logo: t.logo ?? null,
          price_24h_percent_change: t.usd_price_24hr_percent_change ?? null,
        }));
        // Sort by USD value descending
        result.sort((a, b) => (b.usd_value ?? 0) - (a.usd_value ?? 0));
        setTokens(result);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [address]);

  return { tokens, loading, error };
};

// ── Transaction history ─────────────────────────────────────────

export interface MoralisTx {
  hash: string;
  from_address: string;
  to_address: string;
  value: string;       // wei
  block_timestamp: string;
  receipt_status: string;  // "1" = success
  summary?: string;
}

export const useTransactionHistory = (address: string | undefined) => {
  const [transactions, setTransactions] = useState<MoralisTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !API_KEY) return;
    setLoading(true);
    setError(null);

    moralisFetch(`/${address}?chain=eth&limit=50&order=DESC`)
      .then((data) => {
        setTransactions(data.result ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [address]);

  return { transactions, loading, error };
};

// ── Native ETH balance + price ──────────────────────────────────

export interface NativeBalance {
  balance: string;   // wei
  usd_price: number | null;
}

export const useNativeBalance = (address: string | undefined) => {
  const [data, setData] = useState<NativeBalance | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address || !API_KEY) return;
    setLoading(true);

    Promise.all([
      moralisFetch(`/${address}/balance?chain=eth`),
      moralisFetch('/erc20/prices?chain=eth').catch(() => null), // best-effort
    ])
      .then(([bal]) => {
        setData({ balance: bal.balance, usd_price: null });
      })
      .finally(() => setLoading(false));
  }, [address]);

  return { data, loading };
};
