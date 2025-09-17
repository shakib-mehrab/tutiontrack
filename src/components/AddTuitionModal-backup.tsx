'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface AddTuitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    studentEmail?: string;
    studentName?: string;
    subject: string;
    startTime: string;
    endTime: string;
    daysPerWeek: number;
    plannedClassesPerMonth: number;
  }) => void;
  isLoading?: boolean;
}

export function AddTuitionModal({ isOpen, onClose, onSubmit, isLoading = false }: AddTuitionModalProps) {
  const [formData, setFormData] = useState({
    studentEmail: '',
    studentName: '',
    subject: '',
    startTime: '',
    endTime: '',
    daysPerWeek: 1,
    plannedClassesPerMonth: 4,
  });

  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.subject || !formData.startTime || !formData.endTime) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.daysPerWeek < 1 || formData.daysPerWeek > 7) {
      setError('Days per week must be between 1 and 7');
      return;
    }

    if (formData.plannedClassesPerMonth < 1 || formData.plannedClassesPerMonth > 31) {
      setError('Planned classes per month must be between 1 and 31');
      return;
    }

    // Only include optional fields if they're provided
    const submitData = {
      subject: formData.subject,
      startTime: formData.startTime,
      endTime: formData.endTime,
      daysPerWeek: formData.daysPerWeek,
      plannedClassesPerMonth: formData.plannedClassesPerMonth,
      ...(formData.studentEmail && { studentEmail: formData.studentEmail }),
      ...(formData.studentName && { studentName: formData.studentName })
    };
    
    onSubmit(submitData);
  };

  const handleClose = () => {
    setFormData({
      studentEmail: '',
      studentName: '',
      subject: '',
      startTime: '',
      endTime: '',
      daysPerWeek: 1,
      plannedClassesPerMonth: 4,
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 w-full max-w-md sm:max-w-lg lg:max-w-xl relative overflow-hidden my-8 min-h-fit max-h-[90vh] overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-green-500/5 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-200/50">
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-green-800 bg-clip-text text-transparent">
              Add New Tuition
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-red-500 p-2 rounded-2xl hover:bg-red-50 transition-all duration-200 transform hover:scale-110"
              disabled={isLoading}
              title="Close modal"
            >
              <X className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/50 rounded-2xl p-4 mb-6 backdrop-blur-sm">
                <p className="text-red-600 text-sm sm:text-base font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div className="group">
                <label htmlFor="studentName" className="block text-sm sm:text-base font-semibold text-gray-700 mb-3 group-focus-within:text-blue-600 transition-colors">
                  👤 Student Name
                </label>
                <input
                  id="studentName"
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400 transition-all duration-300 text-base placeholder-gray-500 shadow-sm"
                  placeholder="Enter student's full name (optional)"
                  disabled={isLoading}
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-2">💡 Optional: Student&apos;s name for record keeping</p>
              </div>

              <div className="group">
                <label htmlFor="studentEmail" className="block text-sm sm:text-base font-semibold text-gray-700 mb-3 group-focus-within:text-blue-600 transition-colors">
                  📧 Student Email
                </label>
                <input
                  id="studentEmail"
                  type="email"
                  value={formData.studentEmail}
                  onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400 transition-all duration-300 text-base placeholder-gray-500 shadow-sm"
                  placeholder="student@example.com (optional - can be added later)"
                  disabled={isLoading}
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-2">💡 Optional: You can invite students to collaborate later</p>
              </div>

              <div className="group">
                <label htmlFor="subject" className="block text-sm sm:text-base font-semibold text-gray-700 mb-3 group-focus-within:text-blue-600 transition-colors">
                  📚 Subject *
                </label>
                <input
                  id="subject"
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400 transition-all duration-300 text-base placeholder-gray-500 shadow-sm"
                  placeholder="Mathematics, Physics, etc."
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="group">
                  <label htmlFor="startTime" className="block text-sm sm:text-base font-semibold text-gray-700 mb-3 group-focus-within:text-blue-600 transition-colors">
                    🕐 Start Time *
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400 transition-all duration-300 text-base shadow-sm"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="group">
                  <label htmlFor="endTime" className="block text-sm sm:text-base font-semibold text-gray-700 mb-3 group-focus-within:text-blue-600 transition-colors">
                    🕐 End Time *
                  </label>
                  <input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400 transition-all duration-300 text-base shadow-sm"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="group">
                  <label htmlFor="daysPerWeek" className="block text-sm sm:text-base font-semibold text-gray-700 mb-3 group-focus-within:text-blue-600 transition-colors">
                    📅 Days Per Week
                  </label>
                  <input
                    id="daysPerWeek"
                    type="number"
                    min="1"
                    max="7"
                    value={formData.daysPerWeek}
                    onChange={(e) => setFormData({ ...formData, daysPerWeek: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400 transition-all duration-300 text-base shadow-sm"
                    disabled={isLoading}
                  />
                </div>

                <div className="group">
                  <label htmlFor="plannedClassesPerMonth" className="block text-sm sm:text-base font-semibold text-gray-700 mb-3 group-focus-within:text-blue-600 transition-colors">
                    📊 Classes Per Month
                  </label>
                  <input
                    id="plannedClassesPerMonth"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.plannedClassesPerMonth}
                    onChange={(e) => setFormData({ ...formData, plannedClassesPerMonth: parseInt(e.target.value) || 4 })}
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400 transition-all duration-300 text-base shadow-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-8 sm:mt-10">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 sm:px-8 py-3 sm:py-4 text-gray-700 border-2 border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 font-semibold transition-all duration-200 transform hover:-translate-y-0.5"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="group px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading}
              >
                <span className="flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      Add Tuition
                      <span className="group-hover:rotate-12 transition-transform duration-300">✨</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
