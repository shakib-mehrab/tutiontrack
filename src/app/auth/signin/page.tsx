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
        redirect: false, // Don't redirect automatically, handle it manually
      });

      if (result?.error) {
        // Handle different error types
        switch (result.error) {
          case 'UNVERIFIED_EMAIL':
            setError('Please verify your email before signing in.');
            setShowResendVerification(true);
            break;
          case 'INVALID_CREDENTIALS':
            setError('Invalid email or password. Please check your credentials and try again.');
            break;
          case 'USER_NOT_FOUND':
            setError('No account found with this email. Please register first.');
            break;
          case 'INVALID_EMAIL':
            setError('Please enter a valid email address.');
            break;
          case 'TOO_MANY_REQUESTS':
            setError('Too many failed attempts. Please try again later.');
            break;
          case 'CredentialsSignin':
            setError('Invalid email or password. Please try again.');
            break;
          default:
            setError('An error occurred during sign in. Please try again.');
        }
      } else if (result?.ok) {
        // Successful sign in - redirect to dashboard
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError('An unexpected error occurred. Please try again.');
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
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Verification email sent! Check your inbox.');
        setShowResendVerification(false);
      } else {
        setError(data.message || 'Failed to send verification email.');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setError('Failed to send verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="mobile-container">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="gradient-bg p-4 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back</h1>
          <p className="text-slate-600">Sign in to continue your learning journey</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="success-message mb-6">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message mb-6">
            {error}
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input pr-12"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Resend Verification */}
          {showResendVerification && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center mb-2">
                <Mail className="h-5 w-5 text-blue-600 mr-2" />
                <p className="font-medium text-blue-800">Email Verification Required</p>
              </div>
              <p className="text-blue-700 text-sm mb-3">
                Please check your email and click the verification link before signing in.
              </p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="btn-secondary w-auto px-4 py-2 bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 flex items-center"
              >
                {isResending ? (
                  <div className="loader w-4 h-4 mr-2"></div>
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Resend Verification Email
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="loader w-5 h-5 mr-2"></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-8 text-center">
          <p className="text-slate-600">
            Don&rsquo;t have an account?{' '}
            <Link 
              href="/auth/register" 
              className="font-semibold text-blue-600 hover:text-blue-800 no-underline"
            >
              Create one here
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-slate-400 text-sm">
            Secure sign in powered by TuitionTrack
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="mobile-container text-center">
          <div className="loader-large"></div>
          <p className="text-slate-600 mt-4">Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}