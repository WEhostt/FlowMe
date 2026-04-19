import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { ConnectKitButton } from '@/contexts/AuthContext';
import { useSession } from '@/contexts/SessionContext';
import { loginUser, sendPasswordReset } from '@/lib/firestore';

const Login = () => {
  const navigate = useNavigate();
  const { logout, isLoading: sessionLoading } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { 
      setError('Please fill in all fields.'); 
      return; 
    }
    setLoading(true);
    const result = await loginUser(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Login failed.');
      return;
    }
    // Firebase auto signs in, context will detect
    setTimeout(() => navigate('/cryptoflow/dashboard'), 500);
  };

  return (
    <div className="min-h-screen bg-gradient-hero hero-glow flex flex-col">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-crypto-purple/10 rounded-full filter blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-crypto-light-purple/10 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link to="/cryptoflow" className="text-2xl font-bold text-white">
          Crypto<span className="text-crypto-purple">Flow</span>
        </Link>
        <span className="text-gray-400 text-sm">
          No account?{' '}
          <Link to="/cryptoflow/signup" className="text-crypto-purple hover:underline font-medium">
            Sign up
          </Link>
        </span>
      </div>

      {/* Card */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">

            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
              <p className="text-gray-400 text-sm">Sign in to your CryptoFlow account</p>
            </div>

            {/* Wallet connect option */}
            <div className="mb-6">
              <div className="flex justify-center">
                <ConnectKitButton />
              </div>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-gray-500 text-xs">or continue with email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 text-sm">Email address</Label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-crypto-purple"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-gray-300 text-sm">Password</Label>
                  <button 
                    type="button"
                    className="text-crypto-purple text-xs hover:underline"
                    onClick={async () => {
                      try {
                        await sendPasswordReset(email);
                        setError('Password reset link sent to your email!');
                      } catch (err: any) {
                        setError(err.message);
                      }
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-crypto-purple"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || sessionLoading}
                className="w-full bg-crypto-purple hover:bg-crypto-dark-purple text-white h-11 text-sm font-medium"
              >
                {loading ? 'Signing in...' : (
                  <span className="flex items-center justify-center gap-2">
                    Sign in <ArrowRight size={16} />
                  </span>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-gray-500 text-xs">
              By signing in you agree to our{' '}
              <Link to="/cryptoflow/terms" className="text-crypto-purple hover:underline">Terms</Link>
              {' '}and{' '}
              <Link to="/cryptoflow/privacy" className="text-crypto-purple hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
