import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="text-white font-semibold text-lg mb-3">{title}</h2>
    <div className="text-gray-400 text-sm leading-relaxed space-y-2">{children}</div>
  </div>
);

const Terms = () => {
  useEffect(() => { document.title = "Terms of Service | CryptoFlow"; }, []);
  return (
    <div className="min-h-screen bg-crypto-blue overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-3xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-gray-500 text-sm">Last updated: {new Date().toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'})}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <Section title="1. Acceptance of Terms">
            <p>By accessing or using CryptoFlow ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.</p>
          </Section>
          <Section title="2. Eligibility">
            <p>You must be at least 18 years of age to use this Platform. By registering an account, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these terms.</p>
          </Section>
          <Section title="3. Account Registration">
            <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. CryptoFlow is not liable for any loss resulting from unauthorized account access.</p>
          </Section>
          <Section title="4. Cryptocurrency Transactions">
            <p>All cryptocurrency transactions are final and irreversible. CryptoFlow does not guarantee the value of any cryptocurrency. You acknowledge the inherent risks of cryptocurrency trading, including but not limited to market volatility and loss of funds.</p>
            <p>Deposits and withdrawals are processed subject to network confirmation times. CryptoFlow is not responsible for delays caused by blockchain network congestion.</p>
          </Section>
          <Section title="5. Prohibited Activities">
            <p>You agree not to: use the Platform for money laundering or illegal activities; provide false identity information; attempt to hack, reverse-engineer, or disrupt the Platform; use automated bots or scripts without authorization.</p>
          </Section>
          <Section title="6. Fees">
            <p>CryptoFlow charges network fees for withdrawals as disclosed on the Withdraw page. These fees are subject to change with notice. No fees are charged for deposits.</p>
          </Section>
          <Section title="7. Disclaimer of Warranties">
            <p>The Platform is provided "as is" without warranties of any kind. CryptoFlow does not guarantee uninterrupted access, error-free operation, or the accuracy of market data displayed.</p>
          </Section>
          <Section title="8. Limitation of Liability">
            <p>CryptoFlow shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, including loss of funds due to market conditions.</p>
          </Section>
          <Section title="9. Changes to Terms">
            <p>We reserve the right to modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the updated Terms.</p>
          </Section>
          <Section title="10. Contact">
            <p>For questions about these Terms, please visit our <Link to="/cryptoflow/support" className="text-crypto-purple hover:underline">Support page</Link>.</p>
          </Section>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Terms;
