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
  User,
  GraduationCap
} from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { ViewHomeworkModal } from '@/components/ViewHomeworkModal';
import { Tuition, Homework } from '@/types';

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tuitions, setTuitions] = useState<Tuition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [isViewHomeworkOpen, setIsViewHomeworkOpen] = useState(false);
  const [loadingHomework, setLoadingHomework] = useState(false);

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

  const calculateProgress = (tuition: Tuition) => {
    return tuition.plannedClassesPerMonth > 0 
      ? Math.round((tuition.takenClasses / tuition.plannedClassesPerMonth) * 100) 
      : 0;
  };

  const fetchHomework = async () => {
    try {
      setLoadingHomework(true);
      const response = await fetch('/api/homework');
      const data = await response.json();
      if (Array.isArray(data)) {
        setHomeworkList(data);
      }
    } catch (error) {
      console.error('Error fetching homework:', error);
    } finally {
      setLoadingHomework(false);
    }
  };

  const handleViewHomework = () => {
    fetchHomework();
    setIsHomeworkModalOpen(true);
  };

  const handleHomeworkClick = (homework: Homework) => {
    setSelectedHomework(homework);
    setIsViewHomeworkOpen(true);
  };

  const handleExportPDF = async (tuition: Tuition) => {
    try {
      const { downloadTuitionPDF } = await import('@/lib/pdf-generator');
      
      const response = await fetch(`/api/tuitions/${tuition.id}/logs`);
      const data = await response.json();
      
      if (data.success) {
        downloadTuitionPDF({
          tuition,
          logs: data.logs || [],
          month: tuition.currentMonthYear,
        });
      } else {
        downloadTuitionPDF({
          tuition,
          logs: [],
          month: tuition.currentMonthYear,
        });
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="mobile-container text-center">
          <div className="loader-large"></div>
          <p className="text-slate-600 mt-4">Loading your classes...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const totalClasses = tuitions.reduce((sum, tuition) => sum + tuition.takenClasses, 0);
  const totalPlanned = tuitions.reduce((sum, tuition) => sum + tuition.plannedClassesPerMonth, 0);
  const overallProgress = totalPlanned > 0 ? Math.round((totalClasses / totalPlanned) * 100) : 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="app-header">
        <div className="mobile-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="gradient-bg p-2 rounded-lg shadow-sm">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-800 leading-tight">TuitionTrack</h1>
                  <span className="role-badge">Student</span>
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
              <h2 className="text-xl font-bold">Hello, {session?.user?.name}!</h2>
              <p className="text-white/80">Your Progress Dashboard</p>
            </div>
          </div>
          
          {/* Overall Progress */}
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Overall Progress</span>
              <span className="text-white/80">{totalClasses}/{totalPlanned} classes</span>
            </div>
            <ProgressBar progress={overallProgress} />
            <div className="text-right mt-1">
              <span className="text-sm text-white/80">{overallProgress}% complete</span>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card text-center">
            <div className="gradient-bg p-3 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-bold text-slate-800">{tuitions.length}</h3>
            <p className="text-sm text-slate-600">Active Classes</p>
          </div>
          
          <div className="card text-center">
            <div className="gradient-bg p-3 rounded-xl w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-bold text-slate-800">{totalClasses}</h3>
            <p className="text-sm text-slate-600">Classes Attended</p>
          </div>
        </div>

        {/* View Homework Button */}
        <button
          onClick={handleViewHomework}
          className="btn-secondary mb-6 flex items-center justify-center"
        >
          <BookOpen className="h-5 w-5 mr-2" />
          View Homework
        </button>

        {/* Your Classes */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-800">Your Classes</h3>

          {tuitions.length === 0 ? (
            <div className="card text-center py-12">
              <div className="gradient-bg p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center opacity-50">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">No Classes Yet</h3>
              <p className="text-slate-600 mb-4">Your teacher will add you to classes soon</p>
            </div>
          ) : (
            tuitions.map((tuition) => {
              const progress = calculateProgress(tuition);
              return (
                <div key={tuition.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-lg">{tuition.subject}</h4>
                      <p className="text-slate-600">
                        Teacher: {tuition.teacherName}
                      </p>
                      <div className="flex items-center text-sm text-slate-500 mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        {tuition.startTime} - {tuition.endTime}
                      </div>
                      <div className="flex items-center text-sm text-slate-500 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {tuition.daysPerWeek} days per week
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Progress This Month</span>
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
                    <button
                      onClick={() => handleExportPDF(tuition)}
                      className="btn-primary flex-1 text-sm py-2 flex items-center justify-center"
                      title="Download Report"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Report
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Actions */}
        {tuitions.length > 0 && (
          <div className="card mt-6 gradient-bg text-white text-center">
            <h3 className="text-lg font-bold mb-2">Keep Learning!</h3>
            <p className="text-white/80 mb-4">
              You&rsquo;ve completed {totalClasses} classes this month. Great progress!
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const bestTuition = tuitions.reduce((best, current) => 
                    calculateProgress(current) < calculateProgress(best) ? current : best
                  );
                  router.push(`/tuition/${bestTuition.id}`);
                }}
                className="btn-secondary bg-white text-blue-900 hover:bg-gray-100 flex-1"
              >
                Focus on Weak Subject
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Homework List Modal */}
      {isHomeworkModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">My Homework</h2>
              <button
                onClick={() => setIsHomeworkModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <LogOut className="h-5 w-5 rotate-180" />
              </button>
            </div>

            {loadingHomework ? (
              <div className="text-center py-8">
                <div className="loader-large"></div>
                <p className="text-slate-600 mt-4">Loading homework...</p>
              </div>
            ) : homeworkList.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No homework assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {homeworkList.map((homework) => {
                  let dueDate: Date;
                  if (homework.dueDate instanceof Date) {
                    dueDate = homework.dueDate;
                  } else if (typeof homework.dueDate === 'string') {
                    dueDate = new Date(homework.dueDate);
                  } else if (homework.dueDate && typeof homework.dueDate === 'object' && 'toDate' in homework.dueDate) {
                    dueDate = homework.dueDate.toDate();
                  } else {
                    dueDate = new Date(); // Fallback
                  }
                  const isOverdue = dueDate < new Date() && homework.status === 'assigned';

                  return (
                    <div
                      key={homework.id}
                      className="border rounded-xl p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => handleHomeworkClick(homework)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800">{homework.subject}</h3>
                          <p className="text-sm text-slate-600">{homework.chapter} - {homework.topic}</p>
                        </div>
                        {homework.status === 'completed' ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Completed
                          </span>
                        ) : isOverdue ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            Overdue
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-slate-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        Due: {dueDate.toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Homework Modal */}
      <ViewHomeworkModal
        isOpen={isViewHomeworkOpen}
        onClose={() => {
          setIsViewHomeworkOpen(false);
          setSelectedHomework(null);
        }}
        homework={selectedHomework}
        isTeacher={false}
      />
    </div>
  );
}