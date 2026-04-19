import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import { Star, Quote } from 'lucide-react';

const REVIEWS = [
  { name: 'James T.', country: 'United Kingdom', avatar: 'JT', plan: 'Elite VIP', stars: 5, text: 'I was skeptical at first but the returns have been consistent every day. Withdrew my first profits last week without any issues. CryptoFlow is the real deal.' },
  { name: 'Sarah M.', country: 'United States', avatar: 'SM', plan: 'Growth', stars: 5, text: 'Started with the Growth plan 3 months ago. The dashboard is clean, the support team responds within hours, and my balance has grown significantly. Highly recommend.' },
  { name: 'David K.', country: 'Canada', avatar: 'DK', plan: 'Pro Trader', stars: 5, text: 'The referral program alone has paid for my subscription fees. I\'ve referred 4 friends and each of us is earning great daily returns. Love the transparency.' },
  { name: 'Amara N.', country: 'Australia', avatar: 'AN', plan: 'Starter', stars: 5, text: 'Perfect for beginners. I started with the Starter plan to test the platform and within a week I was already reinvesting profits into the Pro Trader plan.' },
  { name: 'Marco R.', country: 'Germany', avatar: 'MR', plan: 'Elite VIP', stars: 5, text: 'The admin team is professional and responsive. They helped me with my KYC verification quickly and my first large withdrawal was processed in under 6 hours.' },
  { name: 'Priya S.', country: 'Singapore', avatar: 'PS', plan: 'Growth', stars: 5, text: 'I\'ve tried several crypto investment platforms. CryptoFlow is the most user-friendly and reliable one I\'ve used. The live portfolio view is fantastic.' },
  { name: 'Tom W.', country: 'Ireland', avatar: 'TW', plan: 'Pro Trader', stars: 5, text: 'Deposit was seamless — just sent USDT to the address provided and within 15 minutes it was showing in my balance. Earning daily returns since day one.' },
  { name: 'Fatima H.', country: 'UAE', avatar: 'FH', plan: 'Elite VIP', stars: 5, text: 'Customer support is outstanding. They answered all my questions before I invested my first dollar. Now I\'m on my third 30-day cycle and the gains are incredible.' },
  { name: 'Chen L.', country: 'Hong Kong', avatar: 'CL', plan: 'Growth', stars: 5, text: 'The 2FA security feature gives me peace of mind. Love that I can see my exact earnings ticking up in real-time on the dashboard. Very professional platform.' },
];

const StarRating = ({ stars }: { stars: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: stars }).map((_, i) => (
      <Star key={i} size={13} className="text-yellow-400 fill-yellow-400" />
    ))}
  </div>
);

const planColor = (plan: string) => {
  if (plan === 'Elite VIP')  return 'text-pink-400 bg-pink-500/20';
  if (plan === 'Pro Trader') return 'text-yellow-400 bg-yellow-500/20';
  if (plan === 'Growth')     return 'text-purple-400 bg-purple-500/20';
  return 'text-blue-400 bg-blue-500/20';
};

const Testimonials = () => {
  useEffect(() => { document.title = 'Testimonials | CryptoFlow'; }, []);

  return (
    <div className="min-h-screen bg-crypto-blue overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <div className="flex justify-center gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={22} className="text-yellow-400 fill-yellow-400" />)}
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">What Our Users Say</h1>
          <p className="text-gray-400">Thousands of investors trust CryptoFlow to grow their wealth every day.</p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
          {[
            { label: 'Active Users', value: '12,400+' },
            { label: 'Avg. Rating', value: '4.9 / 5' },
            { label: 'Paid Out', value: '$2.8M+' },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-gray-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {REVIEWS.map(r => (
            <div key={r.name} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 relative">
              <Quote size={24} className="absolute top-4 right-4 text-white/5" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-crypto-purple to-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {r.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">{r.name}</p>
                  <p className="text-gray-500 text-xs">{r.country}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${planColor(r.plan)}`}>{r.plan}</span>
              </div>
              <StarRating stars={r.stars} />
              <p className="text-gray-400 text-sm leading-relaxed">"{r.text}"</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a href="/cryptoflow/signup" className="inline-flex items-center gap-2 bg-crypto-purple hover:bg-crypto-dark-purple text-white font-semibold px-8 py-3 rounded-xl transition-colors">
            Join Thousands of Investors
          </a>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Testimonials;
