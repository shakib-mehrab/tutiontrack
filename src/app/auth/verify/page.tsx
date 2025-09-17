'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Mail, RefreshCw, BookOpen } from 'lucide-react';

function OTPVerificationContent() {
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
  const [message, setMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleVerifyOTP = async () => {
    if (!email || !otp) {
      setMessage('Please enter both email and OTP code');
      return;
    }

    if (otp.length !== 6) {
      setMessage('OTP code must be 6 digits');
      return;
    }

    setIsVerifying(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const result = await response.json();
      
      if (result.success) {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
        
        setTimeout(() => {
          router.push('/auth/signin?verified=true');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(result.message || 'Invalid OTP code. Please try again.');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setStatus('error');
      setMessage('An error occurred during verification. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }

    setIsResending(true);
    setMessage('');

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
        setMessage('New OTP code sent to your email!');
        setOtp(''); // Clear the OTP field
      } else {
        setMessage(result.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setMessage('Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="mobile-container text-center">
          <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Email Verified!</h1>
          <div className="success-message">
            {message}
          </div>
          <p className="text-slate-600 mt-4">
            Redirecting to sign in page...
          </p>
          <div className="loader-large"></div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="mobile-container text-center">
          <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Verification Failed</h1>
          <div className="error-message mb-6">
            {message}
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => setStatus('form')}
              className="btn-primary"
            >
              Try Again
            </button>
            <Link href="/auth/signin" className="btn-secondary block text-center no-underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="mobile-container">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="gradient-bg p-4 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Verify Your Email</h1>
          <p className="text-slate-600">
            We&rsquo;ve sent a 6-digit verification code to your email
          </p>
        </div>

        {/* Instructions */}
        <div className="card bg-blue-50 border-blue-200 mb-6">
          <div className="flex items-start">
            <div className="bg-blue-600 p-2 rounded-lg mr-3 mt-1">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-800 mb-1">Check Your Email</h3>
              <p className="text-blue-700 text-sm">
                Enter the 6-digit code we sent to your email address to complete verification.
              </p>
            </div>
          </div>
        </div>

        {/* Error/Success Message */}
        {message && (
          <div className={`mb-6 ${
            message.includes('sent') || message.includes('success') 
              ? 'success-message' 
              : 'error-message'
          }`}>
            {message}
          </div>
        )}

        {/* Verification Form */}
        <div className="space-y-6">
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
            <label className="form-label" htmlFor="otp">
              Verification Code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="form-input text-center text-2xl font-mono tracking-widest"
              placeholder="000000"
              required
              autoComplete="one-time-code"
            />
            <p className="text-sm text-slate-500 mt-2 text-center">
              Enter the 6-digit code from your email
            </p>
          </div>

          <button
            onClick={handleVerifyOTP}
            disabled={isVerifying || !email || !otp || otp.length !== 6}
            className="btn-primary flex items-center justify-center"
          >
            {isVerifying ? (
              <>
                <div className="loader w-5 h-5 mr-2"></div>
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </button>
        </div>

        {/* Resend Section */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 mb-4">Didn&rsquo;t receive the code?</p>
          <button
            onClick={handleResendOTP}
            disabled={isResending || !email}
            className="btn-secondary w-auto px-6 flex items-center justify-center mx-auto"
          >
            {isResending ? (
              <>
                <div className="loader w-4 h-4 mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Resend Code
              </>
            )}
          </button>
        </div>

        {/* Back to Sign In */}
        <div className="mt-8 text-center">
          <Link 
            href="/auth/signin" 
            className="font-semibold text-blue-600 hover:text-blue-800 no-underline"
          >
            ← Back to Sign In
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-slate-400 text-sm">
            Secure verification powered by TuitionTrack
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="mobile-container text-center">
          <div className="gradient-bg p-4 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <div className="loader-large"></div>
        </div>
      </div>
    }>
      <OTPVerificationContent />
    </Suspense>
  );
}