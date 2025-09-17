'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus, BookOpen, User, GraduationCap } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'teacher' as 'teacher' | 'student',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration successful! Please check your email for verification instructions.');
        // Clear form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'teacher',
        });
        
        // Redirect to verification page after a delay
        setTimeout(() => {
          router.push('/auth/verify?email=' + encodeURIComponent(formData.email));
        }, 2000);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="mobile-container text-center">
          <div className="gradient-bg p-4 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <div className="success-message">
            {success}
          </div>
          <p className="text-slate-600 mt-4">
            Redirecting to verification page...
          </p>
          <div className="loader-large"></div>
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
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Join TuitionTrack</h1>
          <p className="text-slate-600">Create your account to get started</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message mb-6">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div>
            <label className="form-label">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'teacher' }))}
                className={`p-4 border-2 rounded-xl transition-colors flex flex-col items-center space-y-2 ${
                  formData.role === 'teacher' 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <User className="h-6 w-6 text-blue-600" />
                <span className="font-medium text-slate-800">Teacher</span>
                <span className="text-xs text-slate-600">Manage classes</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'student' }))}
                className={`p-4 border-2 rounded-xl transition-colors flex flex-col items-center space-y-2 ${
                  formData.role === 'student' 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <GraduationCap className="h-6 w-6 text-blue-600" />
                <span className="font-medium text-slate-800">Student</span>
                <span className="text-xs text-slate-600">Track progress</span>
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="form-label" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your full name"
              required
              autoComplete="name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                className="form-input pr-12"
                placeholder="Enter your password (min 6 characters)"
                required
                autoComplete="new-password"
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

          {/* Confirm Password */}
          <div>
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="form-input pr-12"
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="loader w-5 h-5 mr-2"></div>
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 mr-2" />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Sign In Link */}
        <div className="mt-8 text-center">
          <p className="text-slate-600">
            Already have an account?{' '}
            <Link 
              href="/auth/signin" 
              className="font-semibold text-blue-600 hover:text-blue-800 no-underline"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-slate-400 text-sm">
            By creating an account, you agree to our terms of service
          </p>
        </div>
      </div>
    </div>
  );
}