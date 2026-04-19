import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check, Gift } from 'lucide-react';
import { ConnectKitButton } from '@/contexts/AuthContext';
import { useSession } from '@/contexts/SessionContext';
import { registerUser } from '@/lib/firestore';

const PasswordRule = ({ met, text }: { met: boolean; text: string }) => (
  <li className={`flex items-center gap-1.5 text-xs ${met ? 'text-green-400' : 'text-gray-500'}`}>
    <Check size={11} className={met ? 'opacity-100' : 'opacity-30'} />
    {text}
  </li>
);

const SignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const session = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [referral, setReferral] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setReferral(ref);
  }, [searchParams]);

  const rules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const passwordValid = Object.values(rules).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password || !confirm) { setError('Please fill in all fields.'); return; }
    if (!passwordValid) { setError('Password does not meet requirements.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const reg = await registerUser(name, email, password, referral || undefined);
    setLoading(false);
    if (!reg.success) { setError(reg.error || 'Registration failed.'); return; }
    // Firebase auth auto-triggers SessionContext, navigate to dashboard
    setTimeout(() => navigate('/cryptoflow/dashboard'), 1000);
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
          Have an account?{' '}
          <Link to="/cryptoflow/login" className="text-crypto-purple hover:underline font-medium">
            Sign in
          </Link>
        </span>
      </div>

      {/* Card */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Create account</h1>
              <p className="text-gray-400 text-sm">Start trading crypto in minutes</p>
            </div>

            {/* Wallet connect option */}
            <div className="mb-6">
              <div className="flex justify-center">
                <ConnectKitButton />
              </div>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-gray-500 text-xs">or sign up with email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300 text-sm">Full name</Label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-crypto-purple"
                  />
                </div>
              </div>

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
                <Label htmlFor="password" className="text-gray-300 text-sm">Password</Label>
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
                {password && (
                  <ul className="mt-1.5 space-y-1 pl-1">
                    <PasswordRule met={rules.length} text="At least 8 characters" />
                    <PasswordRule met={rules.upper}  text="One uppercase letter" />
                    <PasswordRule met={rules.number} text="One number" />
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-gray-300 text-sm">Confirm password</Label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <Input
                    id="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={`pl-9 pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-crypto-purple ${
                      confirm && confirm !== password ? 'border-red-500/50' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirm && confirm !== password && (
                  <p className="text-red-400 text-xs pl-1">Passwords do not match</p>
                )}
              </div>

              {/* Referral code */}
              <div className="space-y-2">
                <Label htmlFor="referral" className="text-gray-300 text-sm flex items-center gap-1.5">
                  <Gift size={13} className="text-pink-400" /> Referral Code <span className="text-gray-600">(optional)</span>
                </Label>
                <Input
                  id="referral"
                  type="text"
                  placeholder="e.g. JOHN1A2B"
                  value={referral}
                  onChange={e => setReferral(e.target.value.toUpperCase())}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 font-mono focus:border-crypto-purple"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-crypto-purple hover:bg-crypto-dark-purple text-white h-11 text-sm font-medium mt-2"
              >
                {loading ? 'Creating account...' : (
                  <span className="flex items-center justify-center gap-2">
                    Create account <ArrowRight size={16} />
                  </span>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-gray-500 text-xs">
              By signing up you agree to our{' '}
              <a href="#!" className="text-crypto-purple hover:underline">Terms</a>
              {' '}and{' '}
              <a href="#!" className="text-crypto-purple hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
