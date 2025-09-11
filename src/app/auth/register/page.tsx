'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

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

      const result = await response.json();

      if (result.success) {
        setSuccess('Registration successful! Please check the console for your OTP code.');
        setTimeout(() => {
          router.push(`/auth/verify?email=${encodeURIComponent(formData.email)}`);
        }, 3000);
      } else {
        setError(result.message);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 w-full max-w-md sm:max-w-lg p-6 sm:p-8 lg:p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-8 sm:mb-10">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 sm:p-5 rounded-2xl shadow-lg animate-pulse">
                <UserPlus className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-3 sm:mb-4">
              Create Account
            </h1>
            <p className="text-white/80 text-base sm:text-lg">Join TuitionTrack today and transform your teaching experience</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 sm:p-5 mb-6 backdrop-blur-sm">
              <p className="text-red-300 text-sm sm:text-base font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 mb-6 backdrop-blur-sm">
              <p className="text-emerald-300 text-sm sm:text-base font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7">
            <div className="group">
              <label htmlFor="name" className="block text-sm sm:text-base font-semibold text-white mb-3 group-focus-within:text-emerald-400 transition-colors">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white hover:border-gray-400 transition-all duration-300 text-base placeholder-gray-500 shadow-sm"
                placeholder="Enter your full name"
              />
            </div>

            <div className="group">
              <label htmlFor="email" className="block text-sm sm:text-base font-semibold text-white mb-3 group-focus-within:text-emerald-400 transition-colors">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white hover:border-gray-400 transition-all duration-300 text-base placeholder-gray-500 shadow-sm"
                placeholder="Enter your email"
              />
            </div>

            <div className="group">
              <label htmlFor="role" className="block text-sm sm:text-base font-semibold text-white mb-3 group-focus-within:text-emerald-400 transition-colors">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white hover:border-gray-400 transition-all duration-300 text-base appearance-none cursor-pointer shadow-sm"
              >
                <option value="teacher">👨‍🏫 Teacher</option>
                <option value="student">👨‍🎓 Student</option>
              </select>
            </div>

            <div className="group">
              <label htmlFor="password" className="block text-sm sm:text-base font-semibold text-white mb-3 group-focus-within:text-emerald-400 transition-colors">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-14 bg-white hover:border-gray-400 transition-all duration-300 text-base placeholder-gray-500 shadow-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors p-1 rounded-lg hover:bg-green-50"
                >
                  {showPassword ? <EyeOff className="h-5 w-5 sm:h-6 sm:w-6" /> : <Eye className="h-5 w-5 sm:h-6 sm:w-6" />}
                </button>
              </div>
            </div>

            <div className="group">
              <label htmlFor="confirmPassword" className="block text-sm sm:text-base font-semibold text-white mb-3 group-focus-within:text-emerald-400 transition-colors">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-14 bg-white hover:border-gray-400 transition-all duration-300 text-base placeholder-gray-500 shadow-sm"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors p-1 rounded-lg hover:bg-green-50"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5 sm:h-6 sm:w-6" /> : <Eye className="h-5 w-5 sm:h-6 sm:w-6" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 sm:py-5 px-4 rounded-2xl font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <UserPlus className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-8 sm:mt-10 text-center space-y-4">
            <p className="text-gray-600 text-base">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-green-600 hover:text-green-700 font-semibold hover:underline transition-all duration-200">
                Sign in
              </Link>
            </p>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                🔒 You will need to verify your email before signing in
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
