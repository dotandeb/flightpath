'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, Mail, Lock, Eye, EyeOff, ArrowRight, Check, Sparkles } from 'lucide-react';
import { signUpUser, MAGIC_LOGIN } from '@/app/lib/auth';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { user, error: signUpError } = await signUpUser(email, password);

    if (signUpError) {
      setError(signUpError.message || 'Failed to sign up');
    } else if (user) {
      setSuccess(true);
      localStorage.setItem('flightpath_user', JSON.stringify(user));
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }

    setLoading(false);
  };

  const handleMagicLogin = () => {
    setEmail(MAGIC_LOGIN.email);
    setPassword(MAGIC_LOGIN.password);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to FlightPath</h2>
          <p className="text-slate-600 mb-4">You now have 1 free flight search. Redirecting you...</p>
          <div className="flex justify-center">
            <Sparkles className="w-6 h-6 text-sky-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 mt-2">Get 1 free flight search on us</p>
        </div>

        <div className="bg-sky-50 rounded-xl p-4 mb-6">
          <ul className="space-y-2 text-sm text-sky-800">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              1 free flight search
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Real-time Amadeus prices
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Split-ticket arbitrage
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              No credit card required
            </li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold py-3 rounded-xl hover:from-sky-600 hover:to-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              'Creating account...'
            ) : (
              <>
                Get 1 Free Search
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <button
          onClick={handleMagicLogin}
          className="w-full mt-4 text-xs text-slate-400 hover:text-slate-600"
        >
          Admin access
        </button>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <a href="/signin" className="text-sky-600 hover:underline font-medium">Sign in</a>
        </p>
      </div>
    </div>
  );
}
