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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-blue-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalClasses = tuitions.reduce((sum, t) => sum + t.takenClasses, 0);
  const avgProgress = tuitions.length > 0 
    ? Math.round(tuitions.reduce((sum, t) => sum + calculateProgress(t), 0) / tuitions.length) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">TuitionTrack</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-medium text-gray-900">{session?.user?.name}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
              <p className="text-gray-600">Track your learning progress and upcoming classes</p>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600 font-medium">
                {new Date().toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Tuitions</p>
                <p className="text-2xl font-bold text-gray-900">{tuitions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Classes This Month</p>
                <p className="text-2xl font-bold text-gray-900">{totalClasses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Overall Progress</p>
                <p className="text-2xl font-bold text-gray-900">{avgProgress}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tuitions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">My Tuitions</h2>
          </div>
          
          {tuitions.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tuitions found. Your teacher will add you to tuitions.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tuitions.map((tuition) => (
                <div key={tuition.id} className="p-6 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/tuition/${tuition.id}`)}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">{tuition.subject}</h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <User className="h-4 w-4 mr-1" />
                        <span>Teacher: {tuition.teacherName}</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportPDF(tuition);
                      }}
                      className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-sm hover:bg-blue-200 flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Log
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        Schedule
                      </div>
                      <p className="text-gray-900 font-medium">
                        {tuition.startTime} - {tuition.endTime}
                      </p>
                      <p className="text-sm text-gray-600">
                        {tuition.daysPerWeek} days per week
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Classes
                      </div>
                      <p className="text-gray-900 font-medium">
                        {tuition.takenClasses} / {tuition.plannedClassesPerMonth}
                      </p>
                      <p className="text-sm text-gray-600">
                        Completed this month
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center text-sm text-gray-600">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Progress
                      </div>
                      <p className="text-gray-900 font-medium">
                        {calculateProgress(tuition)}%
                      </p>
                      <p className="text-sm text-gray-600">
                        Monthly completion
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{calculateProgress(tuition)}%</span>
                    </div>
                    <ProgressBar progress={calculateProgress(tuition)} />
                  </div>

                  {calculateProgress(tuition) >= 100 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                      <p className="text-green-700 text-sm">
                        🎉 Congratulations! You&apos;ve completed all planned classes for this month!
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
