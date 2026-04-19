import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ConnectKitButton } from '@/contexts/AuthContext';
import { useSession } from '@/contexts/SessionContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Portfolio from '@/components/Portfolio';
import InvestmentPlans from '@/components/InvestmentPlans';
import PriceFeed from '@/components/PriceFeed';
import ScrollToTop from '@/components/ScrollToTop';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import VipBadge from '@/components/VipBadge';

const Dashboard = () => {
  const { isConnected, address } = useAuth();
  const { user } = useSession();

  useEffect(() => {
    document.title = "Dashboard | CryptoFlow";
  }, []);

  return (
    <div className="min-h-screen bg-crypto-blue overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white mb-1">
                {user ? `Welcome, ${user.name.split(' ')[0]}` : 'Portfolio Dashboard'}
              </h1>
              {user && <VipBadge userId={user.uid} size="md" />}
            </div>
            {isConnected && address ? (
              <p className="text-gray-400 text-sm font-mono">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            ) : (
              <p className="text-gray-500 text-sm">Connect your wallet for live data</p>
            )}
          </div>
          {!isConnected && (
            <ConnectKitButton />
          )}
        </div>

        <div className="space-y-10">
          <OnboardingChecklist />
          <Portfolio />
          <InvestmentPlans />
          <PriceFeed />
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Dashboard;
