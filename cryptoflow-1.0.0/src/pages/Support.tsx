import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MessageCircle, Mail, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

const FAQS = [
  { q: 'How do I deposit funds?', a: 'Go to the Deposit page after logging in. Select your coin (BTC, USDT, or ETH), copy the address or scan the QR code, and send from your external wallet.' },
  { q: 'How long do deposits take?', a: 'BTC: 1–3 confirmations (~30 min). ETH/USDT: 12–30 confirmations (~5 min). Once confirmed on-chain, your balance updates automatically.' },
  { q: 'How do I withdraw funds?', a: 'Go to the Withdraw page, select your coin, enter your external wallet address and the amount, then submit. Withdrawals are processed within 1–24 hours.' },
  { q: 'What are the withdrawal fees?', a: 'BTC: 0.0001 BTC. USDT (TRC-20): 1 USDT. ETH: 0.003 ETH. Fees cover blockchain network costs.' },
  { q: 'Is my account secure?', a: 'Passwords are hashed with SHA-256. We recommend using a strong, unique password and never sharing your login credentials.' },
  { q: 'I forgot my password — what do I do?', a: 'Contact support via the form below with your registered email and we will assist you in resetting your account.' },
];

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-0">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 hover:text-white transition-colors text-gray-300">
        <span className="text-sm font-medium">{q}</span>
        {open ? <ChevronUp size={16} className="shrink-0 text-crypto-purple" /> : <ChevronDown size={16} className="shrink-0" />}
      </button>
      {open && <p className="text-gray-400 text-sm pb-4 leading-relaxed">{a}</p>}
    </div>
  );
};

const Support = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = "Support | CryptoFlow"; }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 800);
  };

  return (
    <div className="min-h-screen bg-crypto-blue overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Support Center</h1>
          <p className="text-gray-400 max-w-xl mx-auto">Have a question or issue? Check the FAQ below or send us a message and we'll get back to you within 24 hours.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* FAQ */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <MessageCircle size={18} className="text-crypto-purple" /> Frequently Asked Questions
            </h2>
            <div>
              {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
            </div>
          </div>

          {/* Contact form */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <Mail size={18} className="text-crypto-purple" /> Contact Support
            </h2>

            {submitted ? (
              <div className="flex flex-col items-center py-10 text-center gap-4">
                <CheckCircle size={44} className="text-green-400" />
                <h3 className="text-white font-semibold text-lg">Message Sent!</h3>
                <p className="text-gray-400 text-sm">We've received your message and will respond within 24 hours to <span className="text-white">{email}</span>.</p>
                <Button onClick={() => { setSubmitted(false); setName(''); setEmail(''); setSubject(''); setMessage(''); }}
                  className="bg-white/10 hover:bg-white/20 text-white mt-2">Send Another</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-gray-300 text-sm">Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} required
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-300 text-sm">Email</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-300 text-sm">Subject</Label>
                  <Input value={subject} onChange={e => setSubject(e.target.value)} required
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600" />
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-300 text-sm">Message</Label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={5}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder:text-gray-600 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-crypto-purple" />
                </div>
                <Button type="submit" disabled={loading}
                  className="w-full bg-crypto-purple hover:bg-crypto-dark-purple text-white">
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Support;
