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
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Add New Tuition</h2>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            disabled={isLoading}
            title="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject */}
          <div>
            <label className="form-label" htmlFor="subject">
              Subject *
            </label>
            <input
              id="subject"
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="form-input"
              placeholder="e.g. Mathematics, Physics"
              required
              disabled={isLoading}
            />
          </div>

          {/* Student Information (Optional) */}
          <div className="bg-slate-50 p-4 rounded-xl">
            <h3 className="form-label mb-3">Student Information (Optional)</h3>
            
            <div className="space-y-3">
              <div>
                <label className="form-label" htmlFor="studentName">
                  Student Name
                </label>
                <input
                  id="studentName"
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
                  className="form-input"
                  placeholder="Student's full name"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="form-label" htmlFor="studentEmail">
                  Student Email
                </label>
                <input
                  id="studentEmail"
                  type="email"
                  value={formData.studentEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentEmail: e.target.value }))}
                  className="form-input"
                  placeholder="student@example.com"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Time Schedule */}
          <div>
            <label className="form-label">Class Schedule *</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label text-sm" htmlFor="startTime">
                  Start Time
                </label>
                <input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="form-input"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="form-label text-sm" htmlFor="endTime">
                  End Time
                </label>
                <input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="form-input"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Days per Week */}
          <div>
            <label className="form-label" htmlFor="daysPerWeek">
              Days per Week *
            </label>
            <select
              id="daysPerWeek"
              value={formData.daysPerWeek}
              onChange={(e) => setFormData(prev => ({ ...prev, daysPerWeek: parseInt(e.target.value) }))}
              className="form-input"
              required
              disabled={isLoading}
            >
              {[1, 2, 3, 4, 5, 6, 7].map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'day' : 'days'} per week
                </option>
              ))}
            </select>
          </div>

          {/* Planned Classes per Month */}
          <div>
            <label className="form-label" htmlFor="plannedClasses">
              Planned Classes per Month *
            </label>
            <input
              id="plannedClasses"
              type="number"
              min="1"
              max="31"
              value={formData.plannedClassesPerMonth}
              onChange={(e) => setFormData(prev => ({ ...prev, plannedClassesPerMonth: parseInt(e.target.value) || 1 }))}
              className="form-input"
              required
              disabled={isLoading}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary flex-1"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loader w-4 h-4 mr-2"></div>
                  Adding...
                </>
              ) : (
                'Add Tuition'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}