'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, BookOpen, Mail, RefreshCw } from 'lucide-react';

function SignInContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      setSuccessMessage('Email verified successfully! You can now sign in.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    setShowResendVerification(false);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: true,
        callbackUrl: '/dashboard'
      });

      // This shouldn't execute if redirect: true works
      if (result?.error) {
        if (result.error.includes('verify')) {
          setError('Please verify your email before signing in.');
          setShowResendVerification(true);
        } else {
          setError('Invalid email or password.');
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccessMessage('Verification email sent! Please check your inbox.');
        setShowResendVerification(false);
        setError('');
      } else {
        setError(result.message);
      }
    } catch {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 w-full max-w-md sm:max-w-lg p-6 sm:p-8 lg:p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-8 sm:mb-10">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 sm:p-5 rounded-2xl shadow-lg animate-pulse">
                <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 sm:mb-4">
              Welcome Back
            </h1>
            <p className="text-white/80 text-base sm:text-lg">Sign in to your TuitionTrack account and continue learning</p>
          </div>

          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 mb-6 backdrop-blur-sm">
              <p className="text-emerald-300 text-sm sm:text-base font-medium">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 sm:p-5 mb-6 backdrop-blur-sm">
              <p className="text-red-300 text-sm sm:text-base font-medium mb-2">{error}</p>
              {showResendVerification && (
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="mt-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg text-white px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
                >
                  {isResending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {isResending ? 'Sending...' : 'Resend verification email'}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7">
            <div className="group">
              <label htmlFor="email" className="block text-sm sm:text-base font-semibold text-white mb-3 group-focus-within:text-blue-400 transition-colors">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400 transition-all duration-300 text-base placeholder-gray-500 shadow-sm"
                placeholder="Enter your email"
              />
            </div>

            <div className="group">
              <label htmlFor="password" className="block text-sm sm:text-base font-semibold text-white mb-3 group-focus-within:text-blue-400 transition-colors">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-14 bg-white hover:border-gray-400 transition-all duration-300 text-base placeholder-gray-500 shadow-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-lg hover:bg-blue-50"
                >
                  {showPassword ? <EyeOff className="h-5 w-5 sm:h-6 sm:w-6" /> : <Eye className="h-5 w-5 sm:h-6 sm:w-6" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 sm:py-5 px-4 rounded-2xl font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <BookOpen className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-8 sm:mt-10 text-center space-y-4">
            <p className="text-gray-600 text-base">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all duration-200">
                Sign up
              </Link>
            </p>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                🔒 Note: Only verified email addresses can sign in
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 text-center border border-white/20">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center animate-pulse">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
