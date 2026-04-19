import { useState } from 'react';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    category: 'Getting Started',
    items: [
      { q: 'How do I create an account?', a: 'Click "Sign Up" in the top navigation, fill in your name, email, and a secure password. Your account is ready instantly — no email verification required.' },
      { q: 'Is CryptoFlow safe to use?', a: 'Yes. Your password is hashed using SHA-256 before storage and is never stored in plain text. All connections are secured via SSL/TLS encryption.' },
      { q: 'What countries are supported?', a: 'CryptoFlow is available globally. We accept deposits from users in all countries. Withdrawal processing times may vary by region.' },
    ],
  },
  {
    category: 'Deposits',
    items: [
      { q: 'How do I deposit funds?', a: 'Navigate to the Deposit page. You can deposit BTC, USDT (TRC-20), or ETH using the provided wallet addresses or QR codes. You can also deposit via credit/debit card.' },
      { q: 'How long does a deposit take?', a: 'Crypto deposits are credited after network confirmations — typically 10-30 minutes for BTC, 1-5 minutes for USDT/ETH. Credit card deposits are reviewed within 1-24 hours.' },
      { q: 'Is there a minimum deposit?', a: 'There is no minimum for crypto deposits. Credit card deposits require a minimum of $50.' },
      { q: 'Why hasn\'t my deposit appeared?', a: 'Confirm the transaction on the blockchain explorer. If 3+ hours have passed with confirmations, contact our support team with your transaction hash.' },
    ],
  },
  {
    category: 'Investments',
    items: [
      { q: 'How do investment plans work?', a: 'You invest your platform balance into a plan. The platform pays daily returns based on your plan\'s rate. After 30 days, you can claim your principal plus all earned returns.' },
      { q: 'Can I invest in multiple plans at once?', a: 'Yes. You can have multiple active investments simultaneously across different plans and coins.' },
      { q: 'What happens if I don\'t claim after 30 days?', a: 'Your investment remains claimable. Returns stop accruing after maturity, so we recommend claiming promptly to reinvest.' },
      { q: 'Can I cancel an active investment?', a: 'No. Investments cannot be cancelled once started. Please only invest amounts you are comfortable locking for the full duration.' },
    ],
  },
  {
    category: 'Withdrawals',
    items: [
      { q: 'How do I withdraw funds?', a: 'Go to the Withdraw page, select your coin, enter your external wallet address and amount, then submit. Your request enters a review queue.' },
      { q: 'How long do withdrawals take?', a: 'Withdrawals are typically processed within 1-24 hours after admin approval. Processing times may be longer during high volume periods.' },
      { q: 'Is there a withdrawal fee?', a: 'Yes. There is a small network fee: 0.0001 BTC for Bitcoin, 1 USDT for Tether, and 0.003 ETH for Ethereum.' },
      { q: 'Why was my withdrawal rejected?', a: 'Withdrawals may be rejected if the wallet address is invalid, your account requires KYC verification, or there are security concerns. You will receive a notification with the reason.' },
    ],
  },
  {
    category: 'Verification & Security',
    items: [
      { q: 'What is KYC verification?', a: 'KYC (Know Your Customer) is an identity verification process. Verified accounts unlock higher withdrawal limits. Submit your full name and country in Account Settings.' },
      { q: 'What is 2FA and should I enable it?', a: 'Two-Factor Authentication adds a 6-digit code requirement to your login. We strongly recommend enabling it for extra account security.' },
      { q: 'What is the referral program?', a: 'Share your unique referral code or link. When someone signs up using it, you receive 5 USDT instantly credited to your account.' },
    ],
  },
];

const FAQ = () => {
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => { document.title = 'FAQ | CryptoFlow'; }, []);

  return (
    <div className="min-h-screen bg-crypto-blue overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-3xl">
        <div className="mb-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-crypto-purple/20 flex items-center justify-center mx-auto mb-4">
            <HelpCircle size={28} className="text-crypto-purple" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Frequently Asked Questions</h1>
          <p className="text-gray-400">Everything you need to know about CryptoFlow.</p>
        </div>

        <div className="space-y-8">
          {FAQS.map(section => (
            <div key={section.category}>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-crypto-purple rounded-full inline-block" />
                {section.category}
              </h2>
              <div className="space-y-2">
                {section.items.map(item => {
                  const key = section.category + item.q;
                  const isOpen = open === key;
                  return (
                    <div key={key} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                      <button onClick={() => setOpen(isOpen ? null : key)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4">
                        <span className={`text-sm font-medium ${isOpen ? 'text-white' : 'text-gray-300'}`}>{item.q}</span>
                        {isOpen ? <ChevronUp size={16} className="text-crypto-purple shrink-0" /> : <ChevronDown size={16} className="text-gray-500 shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4">
                          <div className="border-t border-white/10 pt-3">
                            <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center bg-white/5 border border-white/10 rounded-2xl p-8">
          <p className="text-gray-300 mb-4">Still have questions?</p>
          <a href="/cryptoflow/support" className="inline-flex items-center gap-2 bg-crypto-purple hover:bg-crypto-dark-purple text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors">
            Contact Support
          </a>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default FAQ;
