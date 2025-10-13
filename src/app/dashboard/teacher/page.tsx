'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import Image from 'next/image';
import { 
  Users, 
  Plus, 
  LogOut,
  RefreshCw,
  Trash2,
  User,
  Minus,
  RotateCcw
} from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { AddTuitionModal } from '@/components/AddTuitionModal';
import { Tuition, ClassLog } from '@/types';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tuitionToDelete, setTuitionToDelete] = useState<Tuition | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedTuitionId, setSelectedTuitionId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [tuitionToReset, setTuitionToReset] = useState<Tuition | null>(null);
  const [downloadBeforeReset, setDownloadBeforeReset] = useState(true);
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
  const [availableClassLogs, setAvailableClassLogs] = useState<ClassLog[]>([]);
  const [selectedLogId, setSelectedLogId] = useState('');
  const [tuitionForClassDeletion, setTuitionForClassDeletion] = useState<string>('');

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
        await fetchTuitions();
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

  const handleDeleteTuition = async () => {
    if (!tuitionToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tuitions/${tuitionToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Tuition deleted successfully!');
        setShowDeleteModal(false);
        setTuitionToDelete(null);
        await fetchTuitions();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to delete tuition');
      }
    } catch (error) {
      console.error('Error deleting tuition:', error);
      setError('Failed to delete tuition');
    } finally {
      setIsDeleting(false);
    }
  };

  const calculateProgress = (takenClasses: number, plannedClasses: number) => {
    return plannedClasses > 0 ? (takenClasses / plannedClasses) * 100 : 0;
  };

  const handleClassUpdate = async (tuitionId: string, action: 'increment' | 'decrement' | 'reset', classDate?: string) => {
    try {
      // Show reset confirmation modal
      if (action === 'reset') {
        const tuition = tuitions.find(t => t.id === tuitionId);
        if (tuition) {
          setTuitionToReset(tuition);
          setShowResetModal(true);
        }
        return;
      }

      // Show delete class modal for decrement
      if (action === 'decrement') {
        await fetchClassLogsForDeletion(tuitionId);
        setTuitionForClassDeletion(tuitionId);
        setShowDeleteClassModal(true);
        return;
      }

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
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      setError(`Failed to ${action} class count`);
      console.error(`Error ${action}ing class count:`, error);
      setTimeout(() => setError(''), 3000);
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
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      setError('Failed to add student');
      console.error('Error adding student:', error);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAddStudentToTuition = (tuitionId: string) => {
    setSelectedTuitionId(tuitionId);
    setShowStudentModal(true);
  };

  const handleExportPDF = async (tuition: Tuition) => {
    try {
      // Fetch logs for this tuition
      const response = await fetch(`/api/tuitions/${tuition.id}/logs`);
      const data = await response.json();
      
      // Dynamically import PDF generator
      const { downloadTuitionPDF } = await import('@/lib/pdf-generator');
      
      downloadTuitionPDF({
        tuition,
        logs: data.success ? data.logs : [],
        month: tuition.currentMonthYear,
      });
    } catch (error) {
      console.error('Failed to export PDF:', error);
      setError('Failed to export PDF');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleReset = async () => {
    if (!tuitionToReset) return;

    try {
      // Download PDF before reset if requested
      if (downloadBeforeReset) {
        await handleExportPDF(tuitionToReset);
      }

      const response = await fetch(`/api/tuitions/${tuitionToReset.id}/classes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Class count reset successfully! All class records have been cleared.');
        setShowResetModal(false);
        setTuitionToReset(null);
        await fetchTuitions(); // Refresh the list
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to reset class count');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      setError('Failed to reset class count');
      console.error('Error resetting classes:', error);
      setTimeout(() => setError(''), 3000);
    }
  };

  const fetchClassLogsForDeletion = async (tuitionId: string) => {
    try {
      const response = await fetch(`/api/tuitions/${tuitionId}/logs`);
      const data = await response.json();
      
      if (data.success) {
        // Filter only increment logs (actual classes) and sort by date
        const incrementLogs = data.logs
          .filter((log: ClassLog) => log.actionType === 'increment')
          .sort((a: ClassLog, b: ClassLog) => {
            const dateA = a.classDate || a.date;
            const dateB = b.classDate || b.date;
            
            // Handle ISO string dates from serialized API response
            const timeA = typeof dateA === 'string'
              ? new Date(dateA).getTime()
              : dateA && typeof dateA === 'object' && 'seconds' in dateA 
              ? (dateA as { seconds: number }).seconds * 1000
              : new Date(dateA as Date).getTime();
            
            const timeB = typeof dateB === 'string'
              ? new Date(dateB).getTime()
              : dateB && typeof dateB === 'object' && 'seconds' in dateB 
              ? (dateB as { seconds: number }).seconds * 1000
              : new Date(dateB as Date).getTime();
            
            return timeB - timeA; // Most recent first
          });
        
        setAvailableClassLogs(incrementLogs);
      }
    } catch (error) {
      console.error('Error fetching class logs:', error);
      setError('Failed to load class logs');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedLogId || !tuitionForClassDeletion) return;

    try {
      const response = await fetch(`/api/tuitions/${tuitionForClassDeletion}/logs/${selectedLogId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Class deleted successfully');
        setShowDeleteClassModal(false);
        setSelectedLogId('');
        setTuitionForClassDeletion('');
        await fetchTuitions(); // Refresh the list
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(data.message || 'Failed to delete class');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      setError('Failed to delete class');
      console.error('Error deleting class:', error);
      setTimeout(() => setError(''), 3000);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="mobile-container text-center">
          <div className="loader-large"></div>
          <p className="text-slate-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="app-header">
        <div className="mobile-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="/icons/logo.svg" 
                alt="TuitionTrack Logo" 
                width={40}
                height={40}
                className="rounded-lg shadow-sm"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-800 leading-tight">TuitionTrack</h1>
                  <span className="role-badge">Teacher</span>
                </div>
                <p className="text-xs text-slate-500">{session?.user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-105"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mobile-container main-content pb-8">
        {/* Welcome Section */}
        <div className="card gradient-bg text-white mb-6">
          <div className="flex items-center mb-4">
            <div className="bg-white/20 p-3 rounded-xl mr-4">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Welcome, {session?.user?.name}!</h2>
              <p className="text-white/80">Your Dashboard</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card text-center">
            <Image 
              src="/icons/logo.svg" 
              alt="TuitionTrack Logo" 
              width={48}
              height={48}
              className="rounded-xl mx-auto mb-2"
            />
            <h3 className="font-bold text-slate-800">{tuitions.length}</h3>
            <p className="text-sm text-slate-600">Active Tuitions</p>
          </div>
          
          <div className="card text-center">
            <div className="gradient-bg p-3 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-bold text-slate-800">
              {tuitions.reduce((acc, tuition) => acc + (tuition.studentName ? 1 : 0), 0)}
            </h3>
            <p className="text-sm text-slate-600">Students</p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="success-message mb-4">
            {success}
          </div>
        )}
        
        {error && (
          <div className="error-message mb-4">
            {error}
          </div>
        )}

        {/* Add Tuition Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary mb-6 flex items-center justify-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add New Tuition
        </button>

        {/* Tuitions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">Your Tuitions</h3>
            <button
              onClick={fetchTuitions}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>

          {tuitions.length === 0 ? (
            <div className="card text-center py-12">
              <Image 
                src="/icons/logo.svg" 
                alt="TuitionTrack Logo" 
                width={64}
                height={64}
                className="rounded-full mx-auto mb-4 opacity-50"
              />
              <h3 className="text-lg font-bold text-slate-800 mb-2">No Tuitions Yet</h3>
              <p className="text-slate-600 mb-4">Start by adding your first tuition class</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary w-auto px-6"
              >
                Add Tuition
              </button>
            </div>
          ) : (
            tuitions.map((tuition) => {
              const progress = calculateProgress(tuition.takenClasses, tuition.plannedClassesPerMonth);
              return (
                <div key={tuition.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className=" font-bold text-slate-800">
                        {tuition.studentName || 'No student assigned'}
                      </h4>
                      <p className=" text-slate-600 text-lg">{tuition.subject}</p>
                      
                      <p className="text-sm text-slate-500">
                        {tuition.startTime} - {tuition.endTime} • {tuition.daysPerWeek} days/week
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!tuition.studentName && (
                        <button
                          onClick={() => handleAddStudentToTuition(tuition.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors text-sm"
                          title="Add student to this tuition"
                        >
                          <User className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setTuitionToDelete(tuition);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Delete tuition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Progress</span>
                      <span className="text-sm text-slate-600">
                        {tuition.takenClasses}/{tuition.plannedClassesPerMonth} classes
                      </span>
                    </div>
                    <ProgressBar 
                      progress={progress}
                      className="h-2"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => router.push(`/tuition/${tuition.id}`)}
                      className="btn-secondary flex-1 text-sm py-2"
                    >
                      View Details
                    </button>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200">
                    <button
                      onClick={() => handleAddClassWithDate(tuition.id)}
                      className="btn-primary flex-1 flex items-center justify-center gap-1 text-sm py-2"
                      title="Add Class"
                    >
                      <Plus className="h-3 w-3" />
                      <span className="hidden sm:inline">Add</span>
                    </button>
                    <button
                      onClick={() => handleClassUpdate(tuition.id, 'decrement')}
                      className="btn-secondary flex-1 flex items-center justify-center gap-1 text-sm py-2"
                      title="Remove Class"
                      disabled={tuition.takenClasses <= 0}
                    >
                      <Minus className="h-3 w-3" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                    <button
                      onClick={() => handleClassUpdate(tuition.id, 'reset')}
                      className="btn-secondary flex-1 flex items-center justify-center gap-1 text-sm py-2"
                      title="Reset Count"
                      disabled={tuition.takenClasses <= 0}
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Tuition Modal */}
      <AddTuitionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTuition}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
          <div className="card w-full max-w-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Tuition?</h3>
            <p className="text-slate-600 mb-4">
              This will permanently delete the tuition for &ldquo;{tuitionToDelete?.subject}&rdquo;. 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTuitionToDelete(null);
                }}
                className="btn-secondary flex-1"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTuition}
                className="btn-primary flex-1 bg-red-600 hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="loader w-4 h-4"></div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="card w-full max-w-md mx-4 animate-fade-in">
            <div className="text-center mb-6">
              <div className="gradient-bg p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Add Class</h3>
              <p className="text-slate-600 text-sm">Record a new class session</p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="classDate" className="block text-sm font-semibold text-slate-800 mb-3">
                Class Date (optional)
              </label>
              <input
                id="classDate"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-field"
                placeholder="Select date"
              />
              <p className="text-slate-500 text-xs mt-2">
                Leave empty to use today&apos;s date
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDateModal(false);
                  setSelectedDate('');
                  setSelectedTuitionId('');
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClass}
                className="btn-primary flex-1"
              >
                Add Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="card w-full max-w-md mx-4 animate-fade-in">
            <div className="text-center mb-6">
              <div className="gradient-bg p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Add Student</h3>
              <p className="text-slate-600 text-sm">Connect a student to this tuition</p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="studentEmail" className="block text-sm font-semibold text-slate-800 mb-3">
                Student Email
              </label>
              <input
                id="studentEmail"
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className="input-field"
                placeholder="student@example.com"
              />
              <p className="text-slate-500 text-xs mt-2">
                Enter the email address of an existing student account
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowStudentModal(false);
                  setStudentEmail('');
                  setSelectedTuitionId('');
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudent}
                disabled={!studentEmail.trim()}
                className="btn-primary flex-1"
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Class Modal */}
      {showDeleteClassModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="card w-full max-w-lg mx-4 animate-fade-in">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Minus className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Select Class to Delete</h3>
              <p className="text-slate-600 text-sm">Choose which class record to remove</p>
            </div>
            
            <div className="mb-6">
              <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                {availableClassLogs.length > 0 ? (
                  availableClassLogs.map((log) => {
                    const classDate = log.classDate || log.date;
                    let dateStr = 'Unknown Date';
                    
                    try {
                      if (typeof classDate === 'string') {
                        dateStr = new Date(classDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        });
                      } else if (classDate && typeof classDate === 'object' && 'seconds' in classDate) {
                        const timestamp = (classDate as { seconds: number }).seconds * 1000;
                        dateStr = new Date(timestamp).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        });
                      } else if (classDate && typeof classDate === 'object' && 'toDate' in classDate) {
                        const dateObj = (classDate as { toDate: () => Date }).toDate();
                        dateStr = dateObj.toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        });
                      } else {
                        dateStr = new Date(classDate as Date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        });
                      }
                    } catch {
                      dateStr = 'Invalid Date';
                    }
                    
                    return (
                      <label
                        key={log.id}
                        className={`flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                          selectedLogId === log.id
                            ? 'bg-red-50 border-red-300 scale-[1.02]'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="classLog"
                          value={log.id}
                          checked={selectedLogId === log.id}
                          onChange={(e) => setSelectedLogId(e.target.value)}
                          className="w-4 h-4 text-red-500 bg-white border-slate-300 focus:ring-red-500/20 focus:ring-2"
                        />
                        <div className="ml-3 flex-1">
                          <p className="font-semibold text-slate-800">{dateStr}</p>
                          <p className="text-slate-600 text-sm">Added by {log.addedByName}</p>
                        </div>
                        {selectedLogId === log.id && (
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                      </label>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                      <p className="text-slate-600">No class records found</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteClassModal(false);
                  setSelectedLogId('');
                  setTuitionForClassDeletion('');
                }}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClass}
                disabled={!selectedLogId}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Delete Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && tuitionToReset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="card w-full max-w-lg mx-4 animate-fade-in">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <RotateCcw className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Reset Class Count</h3>
              <p className="text-slate-600 text-sm">This action cannot be undone</p>
            </div>
            
            <div className="mb-6">
              <p className="text-slate-700 mb-4 text-center">
                This will permanently delete all class records for <span className="font-semibold">{tuitionToReset.studentName || 'this tuition'}</span> and reset the count to 0.
              </p>
              
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-2xl">⚠️</div>
                  <p className="text-amber-800 font-semibold">Critical Warning</p>
                </div>
                <ul className="text-amber-700 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
                    All class attendance records will be permanently deleted
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
                    Class count will reset to 0
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
                    This action cannot be undone
                  </li>
                </ul>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={downloadBeforeReset}
                    onChange={(e) => setDownloadBeforeReset(e.target.checked)}
                    className="w-4 h-4 text-blue-500 bg-white border-slate-300 rounded focus:ring-blue-500/20 focus:ring-2"
                  />
                  <span className="text-slate-700 text-sm group-hover:text-slate-900 transition-colors">
                    Download PDF report before reset
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setTuitionToReset(null);
                }}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Reset & Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}