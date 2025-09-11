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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-blue-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b">
            <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
            <span className="text-xl font-bold text-gray-900">TuitionTrack</span>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-2 mr-3">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
                <p className="text-xs text-gray-500">Teacher</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-4">
            <ul className="space-y-2">
              <li>
                <button className="w-full flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-4 w-4 mr-3" />
                  Dashboard
                </button>
              </li>
              <li>
                <button className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Users className="h-4 w-4 mr-3" />
                  Students
                </button>
              </li>
              <li>
                <button className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Calendar className="h-4 w-4 mr-3" />
                  Schedule
                </button>
              </li>
              <li>
                <button className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </button>
              </li>
            </ul>
          </nav>

          {/* Logout */}
          <div className="px-6 py-4 border-t">
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-600 mt-1">
                      Manage your tuitions and track student progress
                    </p>
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
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tuition
              </button>
            </div>
          </div>
        </header>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mx-6 mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Stats Cards */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{tuitions.length}</p>
                  <p className="text-gray-600">Active Tuitions</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {tuitions.reduce((sum, t) => sum + t.takenClasses, 0)}
                  </p>
                  <p className="text-gray-600">Classes This Month</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {tuitions.length > 0 
                      ? Math.round(tuitions.reduce((sum, t) => sum + calculateProgress(t.takenClasses, t.plannedClassesPerMonth), 0) / tuitions.length)
                      : 0
                    }%
                  </p>
                  <p className="text-gray-600">Average Progress</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tuitions List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Active Tuitions</h2>
                <button
                  onClick={fetchTuitions}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                  title="Refresh tuitions"
                  aria-label="Refresh tuitions"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {tuitions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tuitions yet</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first tuition.</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Tuition
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {tuitions.map((tuition) => {
                  const progress = calculateProgress(tuition.takenClasses, tuition.plannedClassesPerMonth);
                  return (
                    <div key={tuition.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 cursor-pointer" onClick={() => router.push(`/tuition/${tuition.id}`)}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                {tuition.subject}{tuition.studentName ? ` - ${tuition.studentName}` : ''}
                              </h3>
                              {!tuition.studentName && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddStudentToTuition(tuition.id);
                                  }}
                                  className="bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700 transition-colors"
                                  title="Add student to this tuition"
                                >
                                  Add Student
                                </button>
                              )}
                            </div>
                            {!tuition.studentName && (
                              <p className="text-sm text-yellow-600 mb-2">No student assigned</p>
                            )}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClassUpdate(tuition.id, 'decrement');
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Decrease class count"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddClassWithDate(tuition.id);
                                }}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Add class (with date)"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClassUpdate(tuition.id, 'reset');
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Reset class count"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-gray-500">Student Email</p>
                              <p className="text-sm text-gray-900">
                                {tuition.studentEmail || 'Not assigned yet'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Schedule</p>
                              <p className="text-sm text-gray-900">
                                {tuition.startTime} - {tuition.endTime}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Days/Week</p>
                              <p className="text-sm text-gray-900">{tuition.daysPerWeek}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Classes</p>
                              <p className="text-sm text-gray-900">
                                {tuition.takenClasses} / {tuition.plannedClassesPerMonth}
                              </p>
                            </div>
                          </div>

                          <div className="mb-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-600">Progress</span>
                              <span className={`text-sm font-medium ${getProgressColor(progress)}`}>
                                {Math.round(progress)}%
                              </span>
                            </div>
                            <ProgressBar progress={progress} />
                          </div>
                        </div>

                        <div className="ml-4">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportPDF(tuition);
                            }}
                            className="text-blue-600 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50"
                            title="Export PDF Report"
                            aria-label="Export PDF Report"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Class</h3>
            
            <div className="mb-4">
              <label htmlFor="classDate" className="block text-sm font-medium text-gray-700 mb-2">
                Class Date (optional)
              </label>
              <input
                id="classDate"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Select date"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to use today&apos;s date
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDateModal(false);
                  setSelectedDate('');
                  setSelectedTuitionId('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClass}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Student to Tuition</h3>
            
            <div className="mb-4">
              <label htmlFor="studentEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Student Email
              </label>
              <input
                id="studentEmail"
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="student@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the email address of an existing student account
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowStudentModal(false);
                  setStudentEmail('');
                  setSelectedTuitionId('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudent}
                disabled={!studentEmail.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
