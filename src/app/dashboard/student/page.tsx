'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, 
  LogOut, 
  Calendar,
  TrendingUp,
  Download,
  Clock,
  User 
} from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { Tuition } from '@/types';

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tuitions, setTuitions] = useState<Tuition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.role !== 'student') {
      router.push('/dashboard/teacher');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTuitions();
    }
  }, [status]);

  const fetchTuitions = async () => {
    try {
      const response = await fetch('/api/tuitions');
      const data = await response.json();
      if (data.success) {
        setTuitions(data.tuitions);
      }
    } catch (error) {
      console.error('Error fetching tuitions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  const calculateProgress = (tuition: Tuition) => {
    return Math.round((tuition.takenClasses / tuition.plannedClassesPerMonth) * 100);
  };

  const handleExportPDF = async (tuition: Tuition) => {
    try {
      // Dynamically import PDF generator only when needed
      const { downloadTuitionPDF } = await import('@/lib/pdf-generator');
      
      // Fetch class logs for this tuition
      const response = await fetch(`/api/tuitions/${tuition.id}/logs`);
      const data = await response.json();
      
      if (data.success) {
        downloadTuitionPDF({
          tuition,
          logs: data.logs || [],
          month: tuition.currentMonthYear,
        });
      } else {
        // Fallback: export without logs
        downloadTuitionPDF({
          tuition,
          logs: [],
          month: tuition.currentMonthYear,
        });
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      // Fallback: try basic export
      try {
        const { downloadTuitionPDF } = await import('@/lib/pdf-generator');
        downloadTuitionPDF({
          tuition,
          logs: [],
          month: tuition.currentMonthYear,
        });
      } catch (e) {
        console.error('Failed to load PDF generator:', e);
      }
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 rounded-3xl w-20 h-20 mx-auto mb-6 flex items-center justify-center animate-pulse shadow-2xl">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <p className="text-gray-700 font-semibold text-lg">Loading your learning dashboard...</p>
        </div>
      </div>
    );
  }

  const totalClasses = tuitions.reduce((sum, t) => sum + t.takenClasses, 0);
  const avgProgress = tuitions.length > 0 
    ? Math.round(tuitions.reduce((sum, t) => sum + calculateProgress(t), 0) / tuitions.length) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-white/95 via-purple-50/95 to-pink-50/95 backdrop-blur-lg shadow-2xl border-b border-white/20 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 gap-4">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-2xl mr-4 shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 bg-clip-text text-transparent">
                TuitionTrack
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="text-left sm:text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-bold text-gray-900 flex items-center gap-2">
                  👨‍🎓 {session?.user?.name}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="group flex items-center justify-center sm:justify-start px-4 py-2 text-red-600 hover:text-white bg-red-50 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-600 rounded-2xl font-semibold shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <LogOut className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-white/95 via-purple-50/95 to-pink-50/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 bg-clip-text text-transparent mb-3">
                🎓 My Learning Dashboard
              </h1>
              <p className="text-gray-600 text-base sm:text-lg">
                Track your learning progress and upcoming classes with ease
              </p>
            </div>
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-6 py-4 rounded-2xl border border-purple-200/50 shadow-lg">
              <p className="text-sm font-bold text-purple-700 text-center">
                📅 {new Date().toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="group bg-white/95 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-400 to-indigo-500 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div className="ml-6">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Active Tuitions</p>
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {tuitions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-white/95 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div className="ml-6">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Classes This Month</p>
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {totalClasses}
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-white/95 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-purple-400 to-pink-500 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div className="ml-6">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Overall Progress</p>
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {avgProgress}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tuitions List */}
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="px-6 sm:px-8 py-6 bg-gradient-to-r from-gray-50 to-purple-50 border-b border-gray-200/50">
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-purple-800 bg-clip-text text-transparent">
              📚 My Learning Journey
            </h2>
          </div>
          
          {tuitions.length === 0 ? (
            <div className="px-6 sm:px-12 py-16 text-center">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-3xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">No tuitions yet</h3>
              <p className="text-gray-600 text-base sm:text-lg max-w-md mx-auto">
                🎯 Your teacher will add you to tuitions. Start your learning journey soon!
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {tuitions.map((tuition) => (
                <div key={tuition.id} className="group bg-gradient-to-r from-white via-purple-50/30 to-pink-50/30 hover:from-purple-50/50 hover:to-pink-50/50 border border-gray-200/50 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer" onClick={() => router.push(`/tuition/${tuition.id}`)}>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-r from-purple-400 to-pink-500 p-3 rounded-2xl shadow-lg">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 hover:text-purple-600 transition-colors group-hover:text-purple-600">
                          📚 {tuition.subject}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <User className="h-4 w-4 mr-2" />
                          <span className="font-medium">👨‍🏫 Teacher: {tuition.teacherName}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportPDF(tuition);
                      }}
                      className="group bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105"
                    >
                      <Download className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                      Export Log
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/80 p-4 rounded-2xl border border-gray-200/50 shadow-sm">
                      <div className="flex items-center text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        <Clock className="h-4 w-4 mr-2" />
                        🕐 Schedule
                      </div>
                      <p className="text-gray-900 font-bold text-lg">
                        {tuition.startTime} - {tuition.endTime}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        📅 {tuition.daysPerWeek} days per week
                      </p>
                    </div>

                    <div className="bg-white/80 p-4 rounded-2xl border border-gray-200/50 shadow-sm">
                      <div className="flex items-center text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        📊 Classes
                      </div>
                      <p className="text-gray-900 font-bold text-lg">
                        {tuition.takenClasses} / {tuition.plannedClassesPerMonth}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        ✅ Completed this month
                      </p>
                    </div>

                    <div className="bg-white/80 p-4 rounded-2xl border border-gray-200/50 shadow-sm sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        📈 Progress
                      </div>
                      <p className="text-gray-900 font-bold text-lg">
                        {calculateProgress(tuition)}%
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        🎯 Monthly completion
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-white/80 p-4 rounded-2xl border border-gray-200/50 mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-gray-700">📈 Learning Progress</span>
                      <span className="text-lg font-bold text-purple-600 px-3 py-1 bg-purple-100 rounded-xl">
                        {calculateProgress(tuition)}%
                      </span>
                    </div>
                    <ProgressBar progress={calculateProgress(tuition)} />
                  </div>

                  {calculateProgress(tuition) >= 100 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl p-4 shadow-sm">
                      <p className="text-green-700 font-semibold text-center">
                        🎉 Congratulations! You&apos;ve completed all planned classes for this month! 🏆
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Download All Reports
            </button>
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              View Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
