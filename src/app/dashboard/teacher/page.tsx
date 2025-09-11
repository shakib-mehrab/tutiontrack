'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Users, 
  Plus, 
  Settings, 
  LogOut,
  Clock,
  TrendingUp,
  Calendar,
  RefreshCw,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { AddTuitionModal } from '@/components/AddTuitionModal';
import { Tuition } from '@/types';

interface TuitionFormData {
  studentEmail?: string;
  studentName?: string;
  subject: string;
  startTime: string;
  endTime: string;
  daysPerWeek: number;
  plannedClassesPerMonth: number;
}

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tuitions, setTuitions] = useState<Tuition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedTuitionId, setSelectedTuitionId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');

  // Redirect if not authenticated or not a teacher
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.role !== 'teacher') {
      router.push('/dashboard/student');
    }
  }, [status, session, router]);

  // Fetch tuitions
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'teacher') {
      fetchTuitions();
    }
  }, [status, session]);

  const fetchTuitions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tuitions');
      const data = await response.json();
      
      if (data.success) {
        setTuitions(data.tuitions);
      } else {
        setError('Failed to fetch tuitions');
      }
    } catch (error) {
      setError('Failed to fetch tuitions');
      console.error('Error fetching tuitions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTuition = async (formData: TuitionFormData) => {
    try {
      setIsSubmitting(true);
      setError('');
      
      const response = await fetch('/api/tuitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Tuition added successfully!');
        setIsModalOpen(false);
        await fetchTuitions(); // Refresh the list
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to add tuition');
      }
    } catch (error) {
      setError('Failed to add tuition');
      console.error('Error adding tuition:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClassUpdate = async (tuitionId: string, action: 'increment' | 'decrement' | 'reset', classDate?: string) => {
    try {
      const body: { action: string; classDate?: string } = { action };
      if (classDate) {
        body.classDate = classDate;
      }

      const response = await fetch(`/api/tuitions/${tuitionId}/classes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTuitions(); // Refresh the list
        setSuccess(`Class count ${action}ed successfully`);
        setTimeout(() => setSuccess(''), 2000);
        setShowDateModal(false);
        setSelectedDate('');
        setSelectedTuitionId('');
      } else {
        setError(data.message || `Failed to ${action} class count`);
      }
    } catch (error) {
      setError(`Failed to ${action} class count`);
      console.error(`Error ${action}ing class count:`, error);
    }
  };

  const handleAddClassWithDate = (tuitionId: string) => {
    setSelectedTuitionId(tuitionId);
    setShowDateModal(true);
  };

  const handleAddClass = () => {
    if (selectedDate) {
      handleClassUpdate(selectedTuitionId, 'increment', selectedDate);
    } else {
      handleClassUpdate(selectedTuitionId, 'increment');
    }
  };

  const handleAddStudent = async () => {
    if (!studentEmail.trim()) return;

    try {
      const response = await fetch(`/api/tuitions/${selectedTuitionId}/student`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentEmail: studentEmail.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Student added successfully!');
        setShowStudentModal(false);
        setStudentEmail('');
        setSelectedTuitionId('');
        await fetchTuitions(); // Refresh tuitions
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to add student');
      }
    } catch (error) {
      setError('Failed to add student');
      console.error('Error adding student:', error);
    }
  };

  const handleAddStudentToTuition = (tuitionId: string) => {
    setSelectedTuitionId(tuitionId);
    setShowStudentModal(true);
  };

  const calculateProgress = (takenClasses: number, plannedClasses: number) => {
    return (takenClasses / plannedClasses) * 100;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    return 'text-red-600';
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-2xl animate-pulse">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <p className="text-white text-lg font-medium">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Mobile-First Responsive Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 lg:w-72 bg-white/10 backdrop-blur-md shadow-2xl border-r border-white/20 hidden md:block">
        <div className="flex flex-col h-full relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 pointer-events-none"></div>
          
          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center px-6 py-6 border-b border-white/20">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-2xl mr-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                TuitionTrack
              </span>
            </div>

            {/* User Info */}
            <div className="px-6 py-6 border-b border-gray-200/50">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl p-3 mr-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">{session?.user?.name}</p>
                  <p className="text-sm text-blue-600 font-medium">👨‍🏫 Teacher</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-6 relative z-10">
            <ul className="space-y-3">
              <li>
                <button className="group w-full flex items-center px-5 py-4 text-base font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <TrendingUp className="h-5 w-5 mr-4 group-hover:rotate-12 transition-transform duration-300" />
                  Dashboard
                </button>
              </li>
              <li>
                <button className="group w-full flex items-center px-5 py-4 text-base font-semibold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <Users className="h-5 w-5 mr-4 group-hover:scale-110 transition-transform duration-300" />
                  Students
                </button>
              </li>
              <li>
                <button className="group w-full flex items-center px-5 py-4 text-base font-semibold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <Calendar className="h-5 w-5 mr-4 group-hover:scale-110 transition-transform duration-300" />
                  Schedule
                </button>
              </li>
              <li>
                <button className="group w-full flex items-center px-5 py-4 text-base font-semibold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <Settings className="h-5 w-5 mr-4 group-hover:rotate-90 transition-transform duration-300" />
                  Settings
                </button>
              </li>
            </ul>
          </nav>

          {/* Logout */}
          <div className="px-6 py-6 border-t border-white/20 relative z-10">
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="group w-full flex items-center px-5 py-4 text-base font-semibold text-red-600 hover:text-white bg-red-50 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-600 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <LogOut className="h-5 w-5 mr-4 group-hover:scale-110 transition-transform duration-300" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile Responsive */}
      <div className="md:ml-64 lg:ml-72">
        {/* Mobile Header */}
        <div className="md:hidden bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-xl mr-3">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                TuitionTrack
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Header */}
        <header className="bg-gradient-to-r from-white/95 via-blue-50/95 to-indigo-50/95 backdrop-blur-lg border-b border-white/20 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                    Teacher Dashboard
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">
                    Manage your tuitions and track student progress
                  </p>
                </div>
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-2 rounded-2xl border border-blue-200/50 shadow-sm">
                  <p className="text-sm font-bold text-blue-700">
                    📅 {new Date().toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="group bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                Add New Tuition
              </button>
            </div>
          </div>
        </header>

        {/* Mobile-First Container */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Alerts */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/50 text-red-700 px-4 sm:px-6 py-4 rounded-2xl shadow-sm backdrop-blur-sm">
              <p className="font-medium">❌ {error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 text-green-700 px-4 sm:px-6 py-4 rounded-2xl shadow-sm backdrop-blur-sm">
              <p className="font-medium">✅ {success}</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="group bg-white/95 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-400 to-indigo-500 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div className="ml-6">
                  <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {tuitions.length}
                  </p>
                  <p className="text-gray-600 font-semibold">Active Tuitions</p>
                </div>
              </div>
            </div>
            
            <div className="group bg-white/95 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <div className="ml-6">
                  <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {tuitions.reduce((sum, t) => sum + t.takenClasses, 0)}
                  </p>
                  <p className="text-gray-600 font-semibold">Classes This Month</p>
                </div>
              </div>
            </div>
            
            <div className="group bg-white/95 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-purple-400 to-pink-500 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <div className="ml-6">
                  <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {tuitions.length > 0 
                      ? Math.round(tuitions.reduce((sum, t) => sum + calculateProgress(t.takenClasses, t.plannedClassesPerMonth), 0) / tuitions.length)
                      : 0
                    }%
                  </p>
                  <p className="text-gray-600 font-semibold">Average Progress</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tuitions List */}
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="px-6 sm:px-8 py-6 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                  📚 Active Tuitions
                </h2>
                <button
                  onClick={fetchTuitions}
                  className="group bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 p-3 rounded-2xl transition-all duration-300 hover:scale-110"
                  title="Refresh tuitions"
                  aria-label="Refresh tuitions"
                >
                  <RefreshCw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                </button>
              </div>
            </div>

            {tuitions.length === 0 ? (
              <div className="px-6 sm:px-12 py-16 text-center">
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-6 rounded-3xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Users className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">No tuitions yet</h3>
                <p className="text-gray-600 mb-8 text-base sm:text-lg max-w-md mx-auto">
                  🚀 Get started by adding your first tuition and begin your teaching journey!
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="group bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-3 mx-auto"
                >
                  <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                  Add Your First Tuition
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {tuitions.map((tuition) => {
                  const progress = calculateProgress(tuition.takenClasses, tuition.plannedClassesPerMonth);
                  return (
                    <div key={tuition.id} className="group bg-gradient-to-r from-white via-gray-50/50 to-blue-50/30 hover:from-blue-50/50 hover:to-indigo-50/50 border border-gray-200/50 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Main Content */}
                        <div className="flex-1 cursor-pointer space-y-4" onClick={() => router.push(`/tuition/${tuition.id}`)}>
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="bg-gradient-to-r from-blue-400 to-indigo-500 p-3 rounded-2xl shadow-lg">
                                <BookOpen className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors group-hover:text-blue-600">
                                  📚 {tuition.subject}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {tuition.studentName ? `👤 ${tuition.studentName}` : '👤 No student assigned'}
                                </p>
                              </div>
                            </div>
                            
                            {!tuition.studentName && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddStudentToTuition(tuition.id);
                                }}
                                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-4 py-2 rounded-2xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                title="Add student to this tuition"
                              >
                                ➕ Add Student
                              </button>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClassUpdate(tuition.id, 'decrement');
                              }}
                              className="group bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-110"
                              title="Decrease class count"
                            >
                              <ChevronDown className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddClassWithDate(tuition.id);
                              }}
                              className="group bg-green-100 hover:bg-green-200 text-green-600 p-2 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-110"
                              title="Add class (with date)"
                            >
                              <ChevronUp className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClassUpdate(tuition.id, 'reset');
                              }}
                              className="group bg-blue-100 hover:bg-blue-200 text-blue-600 p-2 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-110"
                              title="Reset class count"
                            >
                              <RefreshCw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-300" />
                            </button>
                          </div>
                          
                          {/* Info Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white/80 p-4 rounded-2xl border border-gray-200/50">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">📧 Student Email</p>
                              <p className="text-sm font-medium text-gray-900 mt-1 truncate">
                                {tuition.studentEmail || 'Not assigned yet'}
                              </p>
                            </div>
                            <div className="bg-white/80 p-4 rounded-2xl border border-gray-200/50">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">🕐 Schedule</p>
                              <p className="text-sm font-medium text-gray-900 mt-1">
                                {tuition.startTime} - {tuition.endTime}
                              </p>
                            </div>
                            <div className="bg-white/80 p-4 rounded-2xl border border-gray-200/50">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">📅 Days/Week</p>
                              <p className="text-sm font-medium text-gray-900 mt-1">{tuition.daysPerWeek}</p>
                            </div>
                            <div className="bg-white/80 p-4 rounded-2xl border border-gray-200/50">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">📊 Classes</p>
                              <p className="text-sm font-medium text-gray-900 mt-1">
                                {tuition.takenClasses} / {tuition.plannedClassesPerMonth}
                              </p>
                            </div>
                          </div>

                          {/* Progress Section */}
                          <div className="bg-white/80 p-4 rounded-2xl border border-gray-200/50">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-semibold text-gray-700">📈 Progress</span>
                              <span className={`text-lg font-bold px-3 py-1 rounded-xl ${getProgressColor(progress)} bg-opacity-20`}>
                                {Math.round(progress)}%
                              </span>
                            </div>
                            <ProgressBar progress={progress} />
                          </div>
                        </div>

                        {/* Action Panel */}
                        <div className="flex lg:flex-col gap-3">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportPDF(tuition);
                            }}
                            className="group bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            title="Export PDF Report"
                            aria-label="Export PDF Report"
                          >
                            <svg className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Tuition Modal */}
      <AddTuitionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTuition}
        isLoading={isSubmitting}
      />

      {/* Add Class Modal */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 w-full max-w-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
            
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-blue-800 bg-clip-text text-transparent mb-6">
                ➕ Add Class
              </h3>
              
              <div className="mb-6">
                <label htmlFor="classDate" className="block text-sm sm:text-base font-semibold text-gray-700 mb-3">
                  📅 Class Date (optional)
                </label>
                <input
                  id="classDate"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50/50 hover:bg-white transition-all duration-300 text-base"
                  placeholder="Select date"
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                  💡 Leave empty to use today&apos;s date
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => {
                    setShowDateModal(false);
                    setSelectedDate('');
                    setSelectedTuitionId('');
                  }}
                  className="px-6 sm:px-8 py-3 sm:py-4 text-gray-700 border-2 border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 font-semibold transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddClass}
                  className="group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-2">
                    Add Class
                    <span className="group-hover:rotate-12 transition-transform duration-300">✨</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 w-full max-w-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
            
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-6">
                👤 Add Student to Tuition
              </h3>
              
              <div className="mb-6">
                <label htmlFor="studentEmail" className="block text-sm sm:text-base font-semibold text-gray-700 mb-3">
                  📧 Student Email
                </label>
                <input
                  id="studentEmail"
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 hover:bg-white transition-all duration-300 text-base placeholder-gray-400"
                  placeholder="student@example.com"
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                  💡 Enter the email address of an existing student account
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => {
                    setShowStudentModal(false);
                    setStudentEmail('');
                    setSelectedTuitionId('');
                  }}
                  className="px-6 sm:px-8 py-3 sm:py-4 text-gray-700 border-2 border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 font-semibold transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStudent}
                  disabled={!studentEmail.trim()}
                  className="group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-2">
                    Add Student
                    <span className="group-hover:rotate-12 transition-transform duration-300">🎓</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
