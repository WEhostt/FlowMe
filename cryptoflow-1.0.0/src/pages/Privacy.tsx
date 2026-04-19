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

const Privacy = () => {
  useEffect(() => { document.title = "Privacy Policy | CryptoFlow"; }, []);
  return (
    <div className="min-h-screen bg-crypto-blue overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-3xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: {new Date().toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'})}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <Section title="1. Information We Collect">
            <p><strong className="text-gray-200">Account Data:</strong> When you register, we collect your name, email address, and a hashed version of your password. We never store passwords in plain text.</p>
            <p><strong className="text-gray-200">Wallet Data:</strong> If you connect a Web3 wallet, we access your public wallet address only. We do not control or have access to your private keys.</p>
            <p><strong className="text-gray-200">Usage Data:</strong> We may collect anonymized information about how you interact with the Platform to improve our services.</p>
          </Section>
          <Section title="2. How We Use Your Information">
            <p>We use your information to: provide and maintain the Platform; authenticate your identity; process transactions; communicate important account updates; improve Platform functionality.</p>
          </Section>
          <Section title="3. Data Storage">
            <p>Currently, user account data is stored locally in your browser's localStorage. This means your data exists on your device. We recommend not using shared or public computers to access your account.</p>
          </Section>
          <Section title="4. Data Sharing">
            <p>We do not sell, trade, or rent your personal information to third parties. We may share data with service providers (such as Moralis for blockchain data) strictly to operate the Platform. These providers are bound by confidentiality obligations.</p>
          </Section>
          <Section title="5. Cookies">
            <p>We use localStorage (not traditional cookies) to store session data and user preferences such as theme settings. This data stays on your device and is not transmitted to our servers.</p>
          </Section>
          <Section title="6. Security">
            <p>Passwords are hashed using SHA-256. We implement reasonable security measures to protect your information. However, no method of storage is 100% secure, and we cannot guarantee absolute security.</p>
          </Section>
          <Section title="7. Your Rights">
            <p>You have the right to: access your personal data; correct inaccurate data (via Account Settings); delete your account and associated data by contacting support; withdraw consent at any time by ceasing to use the Platform.</p>
          </Section>
          <Section title="8. Children's Privacy">
            <p>The Platform is not intended for users under 18 years of age. We do not knowingly collect data from minors.</p>
          </Section>
          <Section title="9. Changes to This Policy">
            <p>We may update this Privacy Policy periodically. We will notify users of significant changes via the Platform. Continued use constitutes acceptance of the updated policy.</p>
          </Section>
          <Section title="10. Contact">
            <p>For privacy-related questions, please visit our <Link to="/cryptoflow/support" className="text-crypto-purple hover:underline">Support page</Link>.</p>
          </Section>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Privacy;
