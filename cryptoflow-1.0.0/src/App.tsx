import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Support from "./pages/Support";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import FAQ from "./pages/FAQ";
import Testimonials from "./pages/Testimonials";
import NotFound from "./pages/NotFound";
import BroadcastBanner from "@/components/BroadcastBanner";
import LiveTicker from "@/components/LiveTicker";

// Redirects to dashboard when wallet connects, but only from the landing page
const WalletRedirect = () => {
  const { isConnected } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isConnected && location.pathname === '/cryptoflow') {
      navigate('/cryptoflow/dashboard');
    }
  }, [isConnected]);

  return null;
};

const App = () => (
  <ThemeProvider>
    <SessionProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <WalletRedirect />
            <BroadcastBanner />
            <LiveTicker />
            <Routes>
              <Route path="/cryptoflow" element={<Index />} />
              <Route path="/cryptoflow/dashboard" element={<Dashboard />} />
              <Route path="/cryptoflow/history" element={<History />} />
              <Route path="/cryptoflow/deposit" element={<Deposit />} />
              <Route path="/cryptoflow/withdraw" element={<Withdraw />} />
              <Route path="/cryptoflow/profile" element={<Profile />} />
              <Route path="/cryptoflow/admin" element={<Admin />} />
              <Route path="/cryptoflow/support" element={<Support />} />
              <Route path="/cryptoflow/terms" element={<Terms />} />
              <Route path="/cryptoflow/privacy" element={<Privacy />} />
              <Route path="/cryptoflow/faq" element={<FAQ />} />
              <Route path="/cryptoflow/testimonials" element={<Testimonials />} />
              <Route path="/cryptoflow/login" element={<Login />} />
              <Route path="/cryptoflow/signup" element={<SignUp />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </SessionProvider>
  </ThemeProvider>
);

export default App;
