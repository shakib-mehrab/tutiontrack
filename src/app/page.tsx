'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Users, BarChart3, Shield } from 'lucide-react';

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="mobile-container text-center">
          <div className="loader-large"></div>
          <p className="text-slate-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="mobile-container py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <Image 
              src="/icons/logo.svg" 
              alt="TuitionTrack Logo" 
              width={64}
              height={64}
              className="rounded-2xl"
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-4 leading-tight">
            Welcome to <br />
            <span className="gradient-bg bg-clip-text text-transparent">TuitionTrack</span>
          </h1>
          <p className="text-slate-600 mb-8">
            A comprehensive platform for teachers and students to track tuition progress, 
            manage classes, and generate reports efficiently.
          </p>
          
          <div className="space-y-3">
            <Link href="/auth/signin" className="btn-primary block text-center no-underline">
              Get Started
            </Link>
            <Link href="/auth/register" className="btn-secondary block text-center no-underline">
              Create Account
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">Key Features</h2>
          
          <div className="card animate-fade-in">
            <div className="gradient-bg p-3 rounded-xl w-12 h-12 mb-4 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Student Management
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Easily add and manage students, track their progress, and maintain detailed records 
              of all tuition activities.
            </p>
          </div>

          <div className="card animate-fade-in">
            <div className="gradient-bg p-3 rounded-xl w-12 h-12 mb-4 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Progress Tracking
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Monitor student performance with detailed analytics and comprehensive reporting 
              tools to identify improvement areas.
            </p>
          </div>

          <div className="card animate-fade-in">
            <div className="gradient-bg p-3 rounded-xl w-12 h-12 mb-4 flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Secure & Reliable
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Your data is protected with enterprise-grade security and reliable cloud storage 
              ensuring 24/7 availability.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="card mt-8 text-center gradient-bg">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Transform Your Teaching?
          </h2>
          <p className="text-white/90 mb-6">
            Join thousands of educators who trust TuitionTrack to manage their classes effectively.
          </p>
          <Link href="/auth/register" className="btn-secondary bg-white text-blue-900 hover:bg-gray-100 block no-underline">
            Start Your Journey
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-slate-500 text-sm">
            © 2024 TuitionTrack. All rights reserved.
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Empowering education through technology
          </p>
        </div>
      </div>
    </div>
  );
}