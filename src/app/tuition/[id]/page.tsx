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
import { downloadTuitionPDF } from '@/lib/pdf-generator';

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
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [details, setDetails] = useState<TuitionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

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

  const formatDate = (timestamp: TimestampType) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (typeof timestamp === 'object' && 'seconds' in timestamp && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'object' && 'toDate' in timestamp && timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
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
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExportPDF = () => {
    if (!details) return;
    
    downloadTuitionPDF({
      tuition: details.tuition,
      logs: details.logs,
      month: details.tuition.currentMonthYear,
    });
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !details) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!details) return null;

  const { tuition, logs, classDates } = details;
  const progress = calculateProgress(tuition.takenClasses, tuition.plannedClassesPerMonth);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {tuition.subject}
                {tuition.studentName && ` - ${tuition.studentName}`}
              </h1>
              <p className="text-gray-600 mt-1">Tuition Details & Class History</p>
            </div>
            <button
              onClick={handleExportPDF}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                Tuition Information
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Teacher</p>
                    <p className="font-medium">{tuition.teacherName}</p>
                  </div>
                </div>

                {tuition.studentName && (
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Student</p>
                      <p className="font-medium">{tuition.studentName}</p>
                      {tuition.studentEmail && (
                        <p className="text-sm text-gray-500">{tuition.studentEmail}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Schedule</p>
                    <p className="font-medium">{tuition.startTime} - {tuition.endTime}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Days per Week</p>
                    <p className="font-medium">{tuition.daysPerWeek}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-2">Monthly Progress</p>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">
                      {tuition.takenClasses} / {tuition.plannedClassesPerMonth} classes
                    </span>
                    <span className={`text-sm font-medium ${getProgressColor(progress)}`}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <ProgressBar progress={progress} />
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-3">Class Actions</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowDateModal(true)}
                      className="w-full flex items-center justify-center px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Class
                    </button>
                    <button
                      onClick={() => handleClassUpdate('decrement')}
                      className="w-full flex items-center justify-center px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                    >
                      <Minus className="h-4 w-4 mr-2" />
                      Remove Class
                    </button>
                    <button
                      onClick={() => handleClassUpdate('reset')}
                      className="w-full flex items-center justify-center px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Count
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <CalendarDays className="h-5 w-5 mr-2 text-green-600" />
                  Class Dates
                </h2>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {classDates.length > 0 ? (
                    classDates.map((classLog, index) => (
                      <div key={classLog.id} className="border-l-4 border-green-500 pl-3 py-2 bg-green-50 rounded-r">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-green-900">
                            Class #{classDates.length - index}
                          </p>
                          <p className="text-sm text-green-700">
                            {formatDate(classLog.classDate || classLog.date)}
                          </p>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          Added by {classLog.addedByName} at {formatTime(classLog.date)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No classes recorded yet</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  Activity Log
                </h2>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.length > 0 ? (
                    logs.map((log) => {
                      const bgColor = log.actionType === 'increment' ? 'bg-green-50 border-green-500' :
                                    log.actionType === 'decrement' ? 'bg-red-50 border-red-500' :
                                    'bg-blue-50 border-blue-500';
                      const textColor = log.actionType === 'increment' ? 'text-green-900' :
                                       log.actionType === 'decrement' ? 'text-red-900' :
                                       'text-blue-900';
                      
                      return (
                        <div key={log.id} className={`border-l-4 pl-3 py-2 rounded-r ${bgColor}`}>
                          <div className="flex justify-between items-center">
                            <p className={`font-medium ${textColor}`}>
                              {log.actionType === 'increment' ? 'Class Added' :
                               log.actionType === 'decrement' ? 'Class Removed' :
                               'Manual Action'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {formatDate(log.date)}
                            </p>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            by {log.addedByName}
                          </p>
                          {log.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {log.description}
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-center py-8">No activity recorded yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}