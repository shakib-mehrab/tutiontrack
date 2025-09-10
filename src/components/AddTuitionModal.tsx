'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface AddTuitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    studentEmail?: string;
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

    // Only include studentEmail if it's provided
    const submitData = {
      subject: formData.subject,
      startTime: formData.startTime,
      endTime: formData.endTime,
      daysPerWeek: formData.daysPerWeek,
      plannedClassesPerMonth: formData.plannedClassesPerMonth,
      ...(formData.studentEmail && { studentEmail: formData.studentEmail })
    };
    
    onSubmit(submitData);
  };

  const handleClose = () => {
    setFormData({
      studentEmail: '',
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Tuition</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
            title="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="studentEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Student Email
              </label>
              <input
                id="studentEmail"
                type="email"
                value={formData.studentEmail}
                onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="student@example.com (optional - can be added later)"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">Optional: You can invite students to collaborate later</p>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                id="subject"
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mathematics, Physics, etc."
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                  End Time *
                </label>
                <input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="daysPerWeek" className="block text-sm font-medium text-gray-700 mb-1">
                Days Per Week
              </label>
              <input
                id="daysPerWeek"
                type="number"
                min="1"
                max="7"
                value={formData.daysPerWeek}
                onChange={(e) => setFormData({ ...formData, daysPerWeek: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="plannedClassesPerMonth" className="block text-sm font-medium text-gray-700 mb-1">
                Planned Classes Per Month
              </label>
              <input
                id="plannedClassesPerMonth"
                type="number"
                min="1"
                max="31"
                value={formData.plannedClassesPerMonth}
                onChange={(e) => setFormData({ ...formData, plannedClassesPerMonth: parseInt(e.target.value) || 4 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Tuition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
