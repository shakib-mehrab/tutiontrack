'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Users, BarChart3, Shield } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (session.user.role === 'teacher') {
        router.push('/dashboard/teacher');
      } else {
        router.push('/dashboard/student');
      }
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-blue-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center">
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 sm:p-4 rounded-2xl shadow-lg">
              <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Welcome to <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">TuitionTrack</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-xs sm:max-w-2xl mx-auto px-2">
            A comprehensive platform for teachers and students to track tuition progress, 
            manage classes, and stay organized with real-time updates.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Link 
              href="/auth/signin"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/register"
              className="bg-white text-blue-600 border-2 border-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Powerful Features for Education Management
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage tuitions effectively and efficiently
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="group bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
              <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              Student Management
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Easily add and manage students, track their progress, and maintain detailed records 
              of all tuition activities with intuitive controls.
            </p>
          </div>

          <div className="group bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
            <div className="bg-gradient-to-r from-purple-400 to-violet-500 p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              Progress Tracking
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Monitor class attendance, completion rates, and academic progress with 
              intuitive dashboards and beautiful visual reports.
            </p>
          </div>

          <div className="group bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 sm:col-span-2 lg:col-span-1">
            <div className="bg-gradient-to-r from-orange-400 to-red-500 p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
              <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              Secure & Reliable
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Built with Firebase authentication and real-time database for secure, 
              reliable, and always up-to-date information you can trust.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white py-16 sm:py-20 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8">Ready to Get Started?</h2>
            <p className="text-lg sm:text-xl mb-8 sm:mb-12 opacity-90 max-w-2xl mx-auto leading-relaxed">
              Join thousands of teachers and students already using TuitionTrack to revolutionize their educational journey
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
              <Link 
                href="/auth/register"
                className="group bg-white text-blue-600 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 shadow-2xl w-full sm:w-auto"
              >
                <span className="flex items-center justify-center gap-2">
                  Create Your Account
                  <BookOpen className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                </span>
              </Link>
              <Link 
                href="/auth/signin"
                className="group border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 w-full sm:w-auto bg-white/10 backdrop-blur-sm"
              >
                <span className="flex items-center justify-center gap-2">
                  Sign In Now
                  <Users className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                TuitionTrack
              </h3>
              <p className="text-gray-400 max-w-md">
                Empowering educators with modern tools for effective tuition management
              </p>
            </div>
            <div className="pt-6 border-t border-gray-700 w-full max-w-md">
              <p className="text-gray-500 text-sm">
                © 2025 TuitionTrack. Built with ❤️ using Next.js and Firebase.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
