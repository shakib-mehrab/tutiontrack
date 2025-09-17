'use client';

import { useState, useEffect } from 'react';
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
  RefreshCw,
  GraduationCap
} from 'lucide-react';
import { Tuition, ClassLog } from '@/types';
import { ProgressBar } from '@/components/ProgressBar';

interface TuitionDetails {
  tuition: Tuition;
  logs: ClassLog[];
}

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
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    
    if (status === 'authenticated' && params.id) {
      fetchTuitionDetails(params.id as string);
    }
  }, [status, params.id, router]);

  const fetchTuitionDetails = async (tuitionId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tuitions/${tuitionId}`);
      const data = await response.json();
      
      if (data.success) {
        setDetails(data);
      } else {
        setError('Failed to load tuition details');
      }
    } catch (error) {
      console.error('Error fetching tuition details:', error);
      setError('Failed to load tuition details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassUpdate = async (action: 'increment' | 'decrement', customDate?: string) => {
    if (!details) return;
    
    setIsUpdating(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/tuitions/${details.tuition.id}/classes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action,
          ...(customDate && { classDate: customDate })
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Class ${action === 'increment' ? 'added' : 'removed'} successfully!`);
        await fetchTuitionDetails(details.tuition.id);
        setShowDateModal(false);
        setSelectedDate('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || `Failed to ${action} class`);
      }
    } catch (error) {
      console.error(`Error ${action}ing class:`, error);
      setError(`Failed to ${action} class`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!details) return;
    
    try {
      const { downloadTuitionPDF } = await import('@/lib/pdf-generator');
      downloadTuitionPDF({
        tuition: details.tuition,
        logs: details.logs,
        month: details.tuition.currentMonthYear,
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setError('Failed to export PDF');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="mobile-container text-center">
          <div className="gradient-bg p-4 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <div className="loader-large"></div>
          <p className="text-slate-600 mt-4">Loading tuition details...</p>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen bg-white">
        <div className="app-header">
          <div className="mobile-container">
            <button
              onClick={() => router.back()}
              className="flex items-center text-slate-600 hover:text-slate-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
          </div>
        </div>
        
        <div className="mobile-container">
          <div className="card text-center py-12">
            <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Tuition Not Found</h2>
            <p className="text-slate-600">The requested tuition could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  const progress = details.tuition.plannedClassesPerMonth > 0 
    ? Math.round((details.tuition.takenClasses / details.tuition.plannedClassesPerMonth) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="app-header">
        <div className="mobile-container">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center text-slate-600 hover:text-slate-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
            
            <div className="flex items-center">
              <div className="gradient-bg p-2 rounded-xl mr-2">
                {session?.user?.role === 'teacher' ? (
                  <User className="h-5 w-5 text-white" />
                ) : (
                  <GraduationCap className="h-5 w-5 text-white" />
                )}
              </div>
              <span className="font-medium text-slate-800">
                {details.tuition.subject}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mobile-container pb-8">
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

        {/* Tuition Overview */}
        <div className="card gradient-bg text-white mb-6">
          <h1 className="text-2xl font-bold mb-4">{details.tuition.subject}</h1>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white/20 rounded-xl p-3">
              <div className="flex items-center mb-2">
                <User className="h-4 w-4 mr-2" />
                <span className="text-sm opacity-80">
                  {session?.user?.role === 'teacher' ? 'Student' : 'Teacher'}
                </span>
              </div>
              <p className="font-semibold">
                {session?.user?.role === 'teacher' 
                  ? (details.tuition.studentName || 'No student assigned')
                  : details.tuition.teacherName
                }
              </p>
            </div>
            
            <div className="bg-white/20 rounded-xl p-3">
              <div className="flex items-center mb-2">
                <Clock className="h-4 w-4 mr-2" />
                <span className="text-sm opacity-80">Schedule</span>
              </div>
              <p className="font-semibold">
                {details.tuition.startTime} - {details.tuition.endTime}
              </p>
              <p className="text-sm opacity-80">
                {details.tuition.daysPerWeek} days/week
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">This Month&rsquo;s Progress</span>
              <span className="text-white/80">
                {details.tuition.takenClasses}/{details.tuition.plannedClassesPerMonth} classes
              </span>
            </div>
            <ProgressBar progress={progress} className="h-3 mb-2" />
            <div className="text-right">
              <span className="text-sm text-white/80">{progress}% complete</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {session?.user?.role === 'teacher' && (
          <div className="card mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => handleClassUpdate('increment')}
                disabled={isUpdating}
                className="btn-primary flex items-center justify-center py-3"
              >
                {isUpdating ? (
                  <div className="loader w-4 h-4"></div>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Class
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleClassUpdate('decrement')}
                disabled={isUpdating || details.tuition.takenClasses === 0}
                className="btn-secondary flex items-center justify-center py-3"
              >
                <Minus className="h-4 w-4 mr-2" />
                Remove Class
              </button>
            </div>
            
            <button
              onClick={() => setShowDateModal(true)}
              className="btn-secondary w-full flex items-center justify-center"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Add Class with Date
            </button>
          </div>
        )}

        {/* Export */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Monthly Report</h3>
              <p className="text-sm text-slate-600">
                Export progress report for {details.tuition.currentMonthYear}
              </p>
            </div>
            <button
              onClick={handleExportPDF}
              className="btn-primary w-auto px-4 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Recent Activity</h2>
            <button
              onClick={() => fetchTuitionDetails(details.tuition.id)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          
          {details.logs.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">No activity recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {details.logs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${
                      log.actionType === 'increment' 
                        ? 'bg-green-100 text-green-600'
                        : log.actionType === 'decrement'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {log.actionType === 'increment' ? (
                        <Plus className="h-4 w-4" />
                      ) : log.actionType === 'decrement' ? (
                        <Minus className="h-4 w-4" />
                      ) : (
                        <Calendar className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">
                        {log.actionType === 'increment' ? 'Class Added' : 
                         log.actionType === 'decrement' ? 'Class Removed' : 'Manual Update'}
                      </p>
                      <p className="text-sm text-slate-600">
                        by {log.addedByName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">
                      {new Date(log.createdAt.seconds * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Date Modal */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Add Class with Date</h3>
            
            <div className="mb-4">
              <label className="form-label" htmlFor="classDate">
                Class Date
              </label>
              <input
                id="classDate"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-input"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDateModal(false);
                  setSelectedDate('');
                }}
                className="btn-secondary flex-1"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={() => handleClassUpdate('increment', selectedDate)}
                className="btn-primary flex-1"
                disabled={isUpdating || !selectedDate}
              >
                {isUpdating ? (
                  <div className="loader w-4 h-4"></div>
                ) : (
                  'Add Class'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}