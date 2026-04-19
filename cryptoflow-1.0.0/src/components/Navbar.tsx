import { useState, useEffect, useRef } from 'react';
import { Menu, X, Moon, Sun, LayoutDashboard, History, LogOut, ArrowDownToLine, ArrowUpRight, User, ShieldCheck, MessageCircle, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ConnectKitButton } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSession } from '@/contexts/SessionContext';
import NotificationBell from '@/components/NotificationBell';

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().split(',').map((e: string) => e.trim());

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { isLoggedIn, user, logout } = useSession();
  const navigate = useNavigate();
  const accountRef = useRef<HTMLDivElement>(null);

  const isAdmin = !!user && ADMIN_EMAILS.includes(user.email.toLowerCase());

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    setAccountOpen(false);
    navigate('/cryptoflow');
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-crypto-blue/80 backdrop-blur-md py-3 shadow-lg' : 'py-6'}`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/cryptoflow">
          <h1 className="text-2xl font-bold text-white">Crypto<span className="text-crypto-purple">Flow</span></h1>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden lg:flex items-center space-x-6">
          <li><a href="#features" className="text-gray-300 hover:text-white transition-colors text-sm">Features</a></li>
          <li><a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors text-sm">How it works</a></li>
          <li><a href="#pricing" className="text-gray-300 hover:text-white transition-colors text-sm">Pricing</a></li>
          <li><Link to="/cryptoflow/support" className="text-gray-300 hover:text-white transition-colors text-sm">Support</Link></li>
          {isLoggedIn && (
            <>
              <li><Link to="/cryptoflow/dashboard" className="text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-sm"><LayoutDashboard size={15} /> Dashboard</Link></li>
              <li><Link to="/cryptoflow/history" className="text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-sm"><History size={15} /> History</Link></li>
              <li><Link to="/cryptoflow/deposit" className="text-crypto-purple hover:text-white transition-colors flex items-center gap-1 text-sm font-medium"><ArrowDownToLine size={15} /> Deposit</Link></li>
              <li><Link to="/cryptoflow/withdraw" className="text-gray-300 hover:text-white transition-colors flex items-center gap-1 text-sm"><ArrowUpRight size={15} /> Withdraw</Link></li>
            </>
          )}
        </ul>

        {/* Desktop right */}
        <div className="hidden lg:flex items-center space-x-2">
          <button onClick={toggleTheme} className="text-gray-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Toggle dark mode">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isLoggedIn ? (
            <>
              <NotificationBell />
              <ConnectKitButton />
              {/* Account dropdown */}
              <div ref={accountRef} className="relative">
                <button onClick={() => setAccountOpen(!accountOpen)}
                  className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-crypto-purple to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  {user?.name.split(' ')[0]}
                  <ChevronDown size={14} />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-11 w-48 bg-[#1a1f2c] border border-white/10 rounded-xl shadow-2xl py-1 z-50">
                    <Link to="/cryptoflow/profile" onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 text-sm transition-colors">
                      <User size={14} /> Account Settings
                    </Link>
                    {isAdmin && (
                      <Link to="/cryptoflow/admin" onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-crypto-purple hover:text-white hover:bg-white/5 text-sm transition-colors">
                        <ShieldCheck size={14} /> Admin Panel
                      </Link>
                    )}
                    <Link to="/cryptoflow/support" onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 text-sm transition-colors">
                      <MessageCircle size={14} /> Support
                    </Link>
                    <div className="border-t border-white/10 my-1" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-white/5 text-sm transition-colors">
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/cryptoflow/login" className="text-gray-300 hover:text-white text-sm transition-colors px-3 py-2">Login</Link>
              <Link to="/cryptoflow/signup" className="bg-crypto-purple hover:bg-crypto-dark-purple text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Sign Up</Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="lg:hidden flex items-center gap-2">
          {isLoggedIn && <NotificationBell />}
          <button onClick={toggleTheme} className="text-white p-2 rounded-full hover:bg-white/10 transition-colors">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-crypto-blue/95 backdrop-blur-lg absolute top-full left-0 w-full py-4 shadow-lg">
          <div className="container mx-auto px-4">
            <ul className="flex flex-col space-y-1">
              <li><a href="#features" className="text-gray-300 hover:text-white block py-2 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Features</a></li>
              <li><a href="#how-it-works" className="text-gray-300 hover:text-white block py-2 text-sm" onClick={() => setIsMobileMenuOpen(false)}>How it works</a></li>
              <li><a href="#pricing" className="text-gray-300 hover:text-white block py-2 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a></li>
              <li><Link to="/cryptoflow/support" className="text-gray-300 hover:text-white block py-2 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Support</Link></li>
              {isLoggedIn && (
                <>
                  <div className="border-t border-white/10 my-2" />
                  <li><Link to="/cryptoflow/dashboard" className="text-gray-300 hover:text-white flex items-center gap-1.5 py-2 text-sm" onClick={() => setIsMobileMenuOpen(false)}><LayoutDashboard size={15} /> Dashboard</Link></li>
                  <li><Link to="/cryptoflow/history" className="text-gray-300 hover:text-white flex items-center gap-1.5 py-2 text-sm" onClick={() => setIsMobileMenuOpen(false)}><History size={15} /> History</Link></li>
                  <li><Link to="/cryptoflow/deposit" className="text-crypto-purple hover:text-white flex items-center gap-1.5 py-2 text-sm font-medium" onClick={() => setIsMobileMenuOpen(false)}><ArrowDownToLine size={15} /> Deposit</Link></li>
                  <li><Link to="/cryptoflow/withdraw" className="text-gray-300 hover:text-white flex items-center gap-1.5 py-2 text-sm" onClick={() => setIsMobileMenuOpen(false)}><ArrowUpRight size={15} /> Withdraw</Link></li>
                  <li><Link to="/cryptoflow/profile" className="text-gray-300 hover:text-white flex items-center gap-1.5 py-2 text-sm" onClick={() => setIsMobileMenuOpen(false)}><User size={15} /> Account Settings</Link></li>
                  {isAdmin && <li><Link to="/cryptoflow/admin" className="text-crypto-purple hover:text-white flex items-center gap-1.5 py-2 text-sm" onClick={() => setIsMobileMenuOpen(false)}><ShieldCheck size={15} /> Admin Panel</Link></li>}
                </>
              )}
              <div className="border-t border-white/10 my-2" />
              <li className="pt-1 flex flex-col space-y-3">
                {isLoggedIn ? (
                  <>
                    <div className="w-full"><ConnectKitButton /></div>
                    <button onClick={handleLogout} className="flex items-center gap-1.5 text-red-400 text-sm py-2"><LogOut size={15} /> Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/cryptoflow/login" className="text-gray-300 hover:text-white block py-2 text-sm" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                    <Link to="/cryptoflow/signup" className="bg-crypto-purple hover:bg-crypto-dark-purple text-white text-sm font-medium px-4 py-2 rounded-lg text-center" onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link>
                  </>
                )}
              </li>
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
