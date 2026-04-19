
import { Facebook, Twitter, Instagram, Linkedin, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#12141C] pt-16 pb-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-4">
              Crypto<span className="text-crypto-purple">Flow</span>
            </h2>
            <p className="text-gray-400 mb-6 max-w-xs">
              The most trusted cryptocurrency platform, empowering traders with innovative tools and unparalleled security.
            </p>
            <div className="flex space-x-4">
              <a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="#!" className="text-gray-400 hover:text-crypto-purple transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-medium mb-4">Platform</h3>
            <ul className="space-y-2">
              <li><Link to="/cryptoflow/dashboard" className="text-gray-400 hover:text-crypto-purple transition-colors">Dashboard</Link></li>
              <li><Link to="/cryptoflow/deposit" className="text-gray-400 hover:text-crypto-purple transition-colors">Deposit</Link></li>
              <li><Link to="/cryptoflow/withdraw" className="text-gray-400 hover:text-crypto-purple transition-colors">Withdraw</Link></li>
              <li><Link to="/cryptoflow/history" className="text-gray-400 hover:text-crypto-purple transition-colors">History</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-medium mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link to="/cryptoflow/support" className="text-gray-400 hover:text-crypto-purple transition-colors">Support</Link></li>
              <li><Link to="/cryptoflow/faq" className="text-gray-400 hover:text-crypto-purple transition-colors">FAQ</Link></li>
              <li><Link to="/cryptoflow/testimonials" className="text-gray-400 hover:text-crypto-purple transition-colors">Testimonials</Link></li>
              <li><Link to="/cryptoflow/terms" className="text-gray-400 hover:text-crypto-purple transition-colors">Terms of Service</Link></li>
              <li><Link to="/cryptoflow/privacy" className="text-gray-400 hover:text-crypto-purple transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-medium mb-4">Account</h3>
            <ul className="space-y-2">
              <li><Link to="/cryptoflow/signup" className="text-gray-400 hover:text-crypto-purple transition-colors">Create Account</Link></li>
              <li><Link to="/cryptoflow/login" className="text-gray-400 hover:text-crypto-purple transition-colors">Sign In</Link></li>
              <li><Link to="/cryptoflow/profile" className="text-gray-400 hover:text-crypto-purple transition-colors">Account Settings</Link></li>
              <li><Link to="/cryptoflow/support" className="text-gray-400 hover:text-crypto-purple transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              &copy; {currentYear} CryptoFlow. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link to="/cryptoflow/terms" className="text-gray-400 hover:text-crypto-purple text-sm transition-colors">Terms of Service</Link>
              <Link to="/cryptoflow/privacy" className="text-gray-400 hover:text-crypto-purple text-sm transition-colors">Privacy Policy</Link>
              <Link to="/cryptoflow/support" className="text-gray-400 hover:text-crypto-purple text-sm transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
