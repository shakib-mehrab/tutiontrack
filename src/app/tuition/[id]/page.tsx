'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft,
  Clock, 
  User, 
  Calendar,
  BookOpen,
  Download,
  Plus,
  Minus,
  RotateCcw,
  CalendarDays
} from 'lucide-react';
import { Tuition, ClassLog } from '@/types';
import { ProgressBar } from '@/components/ProgressBar';

interface TuitionDetails {
  tuition: Tuition;
  logs: ClassLog[];
  classDates: ClassLog[];
}

type TimestampType = {
  seconds?: number;
  toDate?: () => Date;
} | string | Date;

export default function TuitionDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [details, setDetails] = useState<TuitionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
  const [availableClassLogs, setAvailableClassLogs] = useState<ClassLog[]>([]);
  const [selectedLogId, setSelectedLogId] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [downloadBeforeReset, setDownloadBeforeReset] = useState(true);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editStudentName, setEditStudentName] = useState('');

  const fetchTuitionDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch(`/api/tuitions/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setDetails(data);
      } else {
        setError(data.message || 'Failed to fetch tuition details');
      }
    } catch (error) {
      setError('Failed to fetch tuition details');
      console.error('Error fetching tuition details:', error);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchTuitionDetails();
    }
  }, [status, router, fetchTuitionDetails]);

  const handleClassUpdate = async (action: 'increment' | 'decrement' | 'reset', classDate?: string) => {
    try {
      if (action === 'decrement') {
        // Show modal to select which class to delete
        await fetchClassLogsForDeletion();
        setShowDeleteClassModal(true);
        return;
      }

      if (action === 'reset') {
        // Show reset confirmation modal
        setShowResetModal(true);
        return;
      }

      const body: { action: string; classDate?: string } = { action };
      if (classDate) {
        body.classDate = classDate;
      }

      const response = await fetch(`/api/tuitions/${params.id}/classes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTuitionDetails();
        setSuccess(`Class count ${action}ed successfully`);
        setTimeout(() => setSuccess(''), 2000);
        setShowDateModal(false);
        setSelectedDate('');
      } else {
        setError(data.message || `Failed to ${action} class count`);
      }
    } catch (error) {
      setError(`Failed to ${action} class count`);
      console.error(`Error ${action}ing class count:`, error);
    }
  };

  const handleAddClass = () => {
    if (selectedDate) {
      handleClassUpdate('increment', selectedDate);
    } else {
      handleClassUpdate('increment');
    }
  };

  const handleAddStudent = async () => {
    if (!studentEmail.trim()) return;

    try {
      const response = await fetch(`/api/tuitions/${params.id}/student`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentEmail: studentEmail.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Student added successfully!');
        setShowStudentModal(false);
        setStudentEmail('');
        await fetchTuitionDetails(); // Refresh details
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to add student');
      }
    } catch (error) {
      setError('Failed to add student');
      console.error('Error adding student:', error);
    }
  };

  const handleEditStudentName = async () => {
    if (!editStudentName.trim()) {
      setError('Student name cannot be empty');
      return;
    }

    try {
      const response = await fetch(`/api/tuitions/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName: editStudentName.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Student name updated successfully!');
        setShowEditStudentModal(false);
        setEditStudentName('');
        await fetchTuitionDetails(); // Refresh details
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to update student name');
      }
    } catch (error) {
      setError('Failed to update student name');
      console.error('Error updating student name:', error);
    }
  };

  const fetchClassLogsForDeletion = async () => {
    try {
      const response = await fetch(`/api/tuitions/${params.id}/logs`);
      const data = await response.json();
      
      if (data.success) {
        // Filter only increment logs (actual classes) and sort by date
        const incrementLogs = data.logs
          .filter((log: ClassLog) => log.actionType === 'increment')
          .sort((a: ClassLog, b: ClassLog) => {
            const dateA = a.classDate || a.date;
            const dateB = b.classDate || b.date;
            
            // Convert to comparable timestamps
            const timeA = dateA && typeof dateA === 'object' && 'seconds' in dateA 
              ? dateA.seconds 
              : new Date(dateA as string | Date).getTime() / 1000;
            const timeB = dateB && typeof dateB === 'object' && 'seconds' in dateB 
              ? dateB.seconds 
              : new Date(dateB as string | Date).getTime() / 1000;
            
            return timeB - timeA; // Most recent first
          });
        
        setAvailableClassLogs(incrementLogs);
      }
    } catch (error) {
      console.error('Error fetching class logs:', error);
      setError('Failed to load class logs');
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedLogId) return;

    try {
      const response = await fetch(`/api/tuitions/${params.id}/logs/${selectedLogId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Class deleted successfully');
        setShowDeleteClassModal(false);
        setSelectedLogId('');
        await fetchTuitionDetails(); // Refresh the details
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError(data.message || 'Failed to delete class');
      }
    } catch (error) {
      setError('Failed to delete class');
      console.error('Error deleting class:', error);
    }
  };

  const handleReset = async () => {
    try {
      // Download PDF before reset if requested
      if (downloadBeforeReset && details) {
        handleExportPDF();
      }

      const response = await fetch(`/api/tuitions/${params.id}/classes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Class count reset successfully! All class records have been cleared.');
        setShowResetModal(false);
        await fetchTuitionDetails(); // Refresh the details
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to reset class count');
      }
    } catch (error) {
      setError('Failed to reset class count');
      console.error('Error resetting classes:', error);
    }
  };

  const formatDate = (timestamp: TimestampType) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (typeof timestamp === 'object' && 'seconds' in timestamp && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'object' && 'toDate' in timestamp && timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp as string | number);
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: TimestampType) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (typeof timestamp === 'object' && 'seconds' in timestamp && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'object' && 'toDate' in timestamp && timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp as string | number);
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExportPDF = async () => {
    if (!details) return;
    
    try {
      // Dynamically import PDF generator only when needed
      const { downloadTuitionPDF } = await import('@/lib/pdf-generator');
      
      downloadTuitionPDF({
        tuition: details.tuition,
        logs: details.logs,
        month: details.tuition.currentMonthYear,
      });
    } catch (error) {
      console.error('Failed to load PDF generator:', error);
    }
  };

  const calculateProgress = (takenClasses: number, plannedClasses: number) => {
    return (takenClasses / plannedClasses) * 100;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="loader-large"></div>
          <p className="text-slate-600 mt-4">Loading tuition details...</p>
        </div>
      </div>
    );
  }

  if (error && !details) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="card max-w-md">
            <div className="gradient-bg p-4 rounded-xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <ArrowLeft className="h-8 w-8 text-white" />
            </div>
            <p className="text-red-600 mb-6 text-lg">{error}</p>
            <button
              onClick={() => router.back()}
              className="btn-primary"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!details) return null;

  const { tuition, logs, classDates } = details;
  const progress = calculateProgress(tuition.takenClasses, tuition.plannedClassesPerMonth);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header Section */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-slate-600 hover:text-slate-800 mb-4 group transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Dashboard
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                {tuition.studentName ? tuition.studentName : 'Tuition Details'}
              </h1>
              <p className="text-slate-600 text-sm">
                {tuition.currentMonthYear}
              </p>
            </div>
            <button
              onClick={handleExportPDF}
              className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Download className="h-5 w-5" />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="error-message mb-6 animate-fade-in">
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message mb-6 animate-fade-in">
            {success}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Tuition Information */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-xl font-bold mb-6 flex items-center text-slate-800">
                <div className="gradient-bg p-2 rounded-xl mr-3">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                Tuition Info
              </h2>
              
              <div className="space-y-4">
                {/* Subject Info */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="gradient-bg p-2 rounded-lg">
                      <BookOpen className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm">Subject</p>
                      <p className="font-bold text-slate-800 text-lg">{tuition.subject}</p>
                    </div>
                  </div>
                </div>

                {/* Teacher Info */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="gradient-bg p-2 rounded-lg">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm">Teacher</p>
                      <p className="font-semibold text-slate-800">{tuition.teacherName}</p>
                    </div>
                  </div>
                </div>

                {/* Student Info */}
                {tuition.studentName ? (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="gradient-bg p-2 rounded-lg">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-slate-600 text-sm">Student</p>
                          <p className="font-semibold text-slate-800">{tuition.studentName}</p>
                          {tuition.studentEmail && (
                            <p className="text-slate-500 text-sm">{tuition.studentEmail}</p>
                          )}
                        </div>
                      </div>
                      {session?.user?.role === 'teacher' && (
                        <button
                          onClick={() => {
                            setEditStudentName(tuition.studentName || '');
                            setShowEditStudentModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                          title="Edit student name"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="gradient-bg p-2 rounded-lg">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-orange-700 font-medium text-sm">No Student Assigned</p>
                          <p className="text-orange-600 text-xs">Add a student to this tuition</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowStudentModal(true)}
                        className="btn-primary px-3 py-1.5 text-sm"
                      >
                        Add Student
                      </button>
                    </div>
                  </div>
                )}

                {/* Schedule Info */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="gradient-bg p-2 rounded-lg">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm">Schedule</p>
                      <p className="font-semibold text-slate-800">{tuition.startTime} - {tuition.endTime}</p>
                    </div>
                  </div>
                </div>

                {/* Days per Week */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="gradient-bg p-2 rounded-lg">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm">Days per Week</p>
                      <p className="font-semibold text-slate-800">{tuition.daysPerWeek}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <h3 className="text-slate-800 font-semibold mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 gradient-bg rounded-full"></div>
                    Monthly Progress
                  </h3>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-600 text-sm">
                      {tuition.takenClasses} / {tuition.plannedClassesPerMonth} classes
                    </span>
                    <span className={`text-sm font-bold ${getProgressColor(progress)} bg-white px-2 py-1 rounded-lg border`}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <ProgressBar progress={progress} />
                </div>

                {/* Action Buttons */}
                {session?.user?.role === 'teacher' && (
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h3 className="text-slate-800 font-semibold mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 gradient-bg rounded-full"></div>
                      Quick Actions
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowDateModal(true)}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Class
                      </button>
                      <button
                        onClick={() => handleClassUpdate('decrement')}
                        className="btn-secondary w-full flex items-center justify-center gap-2"
                      >
                        <Minus className="h-4 w-4" />
                        Remove Class
                      </button>
                      <button
                        onClick={() => handleClassUpdate('reset')}
                        className="btn-secondary w-full flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset Count
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Class Dates Card */}
              <div className="card">
                <h2 className="text-xl font-bold mb-6 flex items-center text-slate-800">
                  <div className="gradient-bg p-2 rounded-xl mr-3">
                    <CalendarDays className="h-5 w-5 text-white" />
                  </div>
                  Class Dates
                  <span className="ml-auto bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium">
                    {classDates.length}
                  </span>
                </h2>
                
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {classDates.length > 0 ? (
                    classDates.map((classLog, index) => (
                      <div key={classLog.id} className="bg-green-50 border border-green-200 rounded-xl p-4 hover:bg-green-100 transition-all duration-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 gradient-bg rounded-full"></div>
                            <p className="font-semibold text-slate-800">
                              Class #{classDates.length - index}
                            </p>
                          </div>
                          <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-lg font-medium">
                            {formatDate(classLog.classDate || classLog.date)}
                          </div>
                        </div>
                        <p className="text-slate-600 text-sm">
                          Added by <span className="text-slate-800 font-medium">{classLog.addedByName}</span> at {formatTime(classLog.date)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                        <CalendarDays className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600 text-lg">No classes recorded yet</p>
                        <p className="text-slate-500 text-sm mt-2">Start by adding your first class!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Log Card */}
              <div className="card">
                <h2 className="text-xl font-bold mb-6 flex items-center text-slate-800">
                  <div className="gradient-bg p-2 rounded-xl mr-3">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  Activity Log
                  <span className="ml-auto bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium">
                    {logs.length}
                  </span>
                </h2>
                
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {logs.length > 0 ? (
                    logs.map((log) => {
                      const isIncrement = log.actionType === 'increment';
                      const isDecrement = log.actionType === 'decrement';
                      const bgColor = isIncrement ? 'bg-green-50 border-green-200 hover:bg-green-100' :
                                      isDecrement ? 'bg-red-50 border-red-200 hover:bg-red-100' :
                                      'bg-blue-50 border-blue-200 hover:bg-blue-100';
                      const badgeColor = isIncrement ? 'bg-green-100 text-green-800' :
                                         isDecrement ? 'bg-red-100 text-red-800' :
                                         'bg-blue-100 text-blue-800';
                      const dotColor = isIncrement ? 'bg-green-500' :
                                      isDecrement ? 'bg-red-500' :
                                      'bg-blue-500';
                      
                      return (
                        <div key={log.id} className={`${bgColor} border rounded-xl p-4 transition-all duration-200`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 ${dotColor} rounded-full`}></div>
                              <p className="font-semibold text-slate-800">
                                {isIncrement ? 'Class Added' :
                                 isDecrement ? 'Class Removed' :
                                 'Manual Action'}
                              </p>
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-lg font-medium ${badgeColor}`}>
                              {formatDate(log.date)}
                            </div>
                          </div>
                          <p className="text-slate-600 text-sm">
                            Added by <span className="text-slate-800 font-medium">{log.addedByName}</span>
                            {log.classDate && ` at ${formatTime(log.date)}`}
                          </p>
                          {log.description && (
                            <p className="text-slate-500 text-sm mt-2 italic">
                              {log.description}
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                        <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600 text-lg">No activity recorded yet</p>
                        <p className="text-slate-500 text-sm mt-2">Activity will appear here as you manage classes</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Class Modal */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md mx-4 animate-fade-in">
            <div className="text-center mb-6">
              <div className="gradient-bg p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Add New Class</h3>
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
              <p className="text-slate-500 text-xs mt-2 flex items-center gap-2">
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                Leave empty to use today&apos;s date
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDateModal(false);
                  setSelectedDate('');
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md mx-4 animate-fade-in">
            <div className="text-center mb-6">
              <div className="gradient-bg p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Add Student</h3>
              <p className="text-slate-600 text-sm">Connect a student to this tuition</p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="studentEmail" className="block text-sm font-semibold text-white mb-3">
                Student Email Address
              </label>
              <input
                id="studentEmail"
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                placeholder="student@example.com"
              />
              <p className="text-white/50 text-xs mt-2 flex items-center gap-2">
                <div className="w-1 h-1 bg-white/50 rounded-full"></div>
                Enter the email address of an existing student account
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowStudentModal(false);
                  setStudentEmail('');
                }}
                className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all duration-200 border border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudent}
                disabled={!studentEmail.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Name Modal */}
      {showEditStudentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md mx-4 animate-fade-in">
            <div className="text-center mb-6">
              <div className="gradient-bg p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Edit Student Name</h3>
              <p className="text-slate-600 text-sm">Update the student name for this tuition</p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="editStudentName" className="block text-sm font-semibold text-slate-800 mb-3">
                Student Name
              </label>
              <input
                id="editStudentName"
                type="text"
                value={editStudentName}
                onChange={(e) => setEditStudentName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                placeholder="Enter student name"
              />
              <p className="text-slate-500 text-xs mt-2 flex items-center gap-2">
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                This will update the displayed student name
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditStudentModal(false);
                  setEditStudentName('');
                }}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleEditStudentName}
                disabled={!editStudentName.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Update Name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Class Modal */}
      {showDeleteClassModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-full max-w-lg mx-4 animate-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Minus className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Select Class to Delete</h3>
              <p className="text-white/60 text-sm">Choose which class record to remove</p>
            </div>
            
            <div className="mb-6">
              <div className="max-h-60 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {availableClassLogs.length > 0 ? (
                  availableClassLogs.map((log) => {
                    const classDate = log.classDate || log.date;
                    let dateStr = 'Unknown Date';
                    
                    try {
                      if (classDate && typeof classDate === 'object' && 'seconds' in classDate) {
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
                        dateStr = new Date(classDate as string | Date).toLocaleDateString('en-US', {
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
                            ? 'bg-red-500/20 border-red-500/50 scale-105'
                            : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name="classLog"
                          value={log.id}
                          checked={selectedLogId === log.id}
                          onChange={(e) => setSelectedLogId(e.target.value)}
                          className="w-4 h-4 text-red-500 bg-transparent border-white/30 focus:ring-red-500/20 focus:ring-2"
                        />
                        <div className="ml-3 flex-1">
                          <p className="font-semibold text-white">{dateStr}</p>
                          <p className="text-white/60 text-sm">Added by {log.addedByName}</p>
                        </div>
                        {selectedLogId === log.id && (
                          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                        )}
                      </label>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                      <p className="text-white/60">No class records found</p>
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
                }}
                className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all duration-200 border border-white/20"
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
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-full max-w-lg mx-4 animate-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <RotateCcw className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Reset Class Count</h3>
              <p className="text-white/60 text-sm">This action cannot be undone</p>
            </div>
            
            <div className="mb-6">
              <p className="text-white/80 mb-4 text-center">
                This will permanently delete all class records and reset the count to 0.
              </p>
              
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-2xl">⚠️</div>
                  <p className="text-amber-200 font-semibold">Critical Warning</p>
                </div>
                <ul className="text-amber-100 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                    All class attendance records will be permanently deleted
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                    Class count will reset to 0
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                    This action cannot be undone
                  </li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/20">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    id="downloadPdf"
                    checked={downloadBeforeReset}
                    onChange={(e) => setDownloadBeforeReset(e.target.checked)}
                    className="w-4 h-4 text-blue-500 bg-transparent border-white/30 rounded focus:ring-blue-500/20 focus:ring-2"
                  />
                  <span className="text-white/80 text-sm group-hover:text-white transition-colors">
                    Download PDF report before reset
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all duration-200 border border-white/20"
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