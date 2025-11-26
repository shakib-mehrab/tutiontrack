'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Tuition } from '@/types';

interface AddHomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    tuitionId: string;
    subject: string;
    chapter: string;
    topic: string;
    dueDate: string;
    notes?: string;
  }) => void;
  isLoading?: boolean;
  tuitions?: Tuition[];
  preSelectedTuitionId?: string;
}

export function AddHomeworkModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false,
  tuitions = [],
  preSelectedTuitionId
}: AddHomeworkModalProps) {
  const [formData, setFormData] = useState({
    tuitionId: '',
    subject: '',
    chapter: '',
    topic: '',
    dueDate: '',
    notes: '',
  });

  const [error, setError] = useState('');

  // Set pre-selected tuition if provided
  useEffect(() => {
    if (preSelectedTuitionId) {
      setFormData(prev => ({ ...prev, tuitionId: preSelectedTuitionId }));
    }
  }, [preSelectedTuitionId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.tuitionId) {
      setError('Please select a tuition');
      return;
    }

    if (!formData.subject || !formData.chapter || !formData.topic || !formData.dueDate) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate due date is in the future
    const dueDate = new Date(formData.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dueDate < today) {
      setError('Due date must be today or in the future');
      return;
    }

    onSubmit({
      tuitionId: formData.tuitionId,
      subject: formData.subject,
      chapter: formData.chapter,
      topic: formData.topic,
      dueDate: formData.dueDate,
      notes: formData.notes || undefined,
    });
  };

  const handleClose = () => {
    setFormData({
      tuitionId: preSelectedTuitionId || '',
      subject: '',
      chapter: '',
      topic: '',
      dueDate: '',
      notes: '',
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Assign Homework</h2>
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
          {/* Tuition Selection */}
          {!preSelectedTuitionId && (
            <div>
              <label className="form-label" htmlFor="tuition">
                Select Tuition *
              </label>
              <select
                id="tuition"
                value={formData.tuitionId}
                onChange={(e) => setFormData(prev => ({ ...prev, tuitionId: e.target.value }))}
                className="form-input"
                required
                disabled={isLoading}
              >
                <option value="">-- Select a tuition --</option>
                {tuitions.map((tuition) => (
                  <option key={tuition.id} value={tuition.id}>
                    {tuition.studentName || 'No student'} - {tuition.subject}
                  </option>
                ))}
              </select>
              {tuitions.length === 0 && (
                <p className="text-sm text-slate-500 mt-1">
                  No tuitions available. Please create a tuition first.
                </p>
              )}
            </div>
          )}

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

          {/* Chapter */}
          <div>
            <label className="form-label" htmlFor="chapter">
              Chapter *
            </label>
            <input
              id="chapter"
              type="text"
              value={formData.chapter}
              onChange={(e) => setFormData(prev => ({ ...prev, chapter: e.target.value }))}
              className="form-input"
              placeholder="e.g. Chapter 5: Trigonometry"
              required
              disabled={isLoading}
            />
          </div>

          {/* Topic */}
          <div>
            <label className="form-label" htmlFor="topic">
              Topic *
            </label>
            <input
              id="topic"
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              className="form-input"
              placeholder="e.g. Sine and Cosine Functions"
              required
              disabled={isLoading}
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="form-label" htmlFor="dueDate">
              Due Date *
            </label>
            <input
              id="dueDate"
              type="date"
              min={today}
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="form-input"
              required
              disabled={isLoading}
            />
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="form-label" htmlFor="notes">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="form-input min-h-[100px] resize-y"
              placeholder="Add any additional instructions or notes..."
              disabled={isLoading}
              rows={4}
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
              disabled={isLoading || (!preSelectedTuitionId && tuitions.length === 0)}
            >
              {isLoading ? (
                <>
                  <div className="loader w-4 h-4 mr-2"></div>
                  Assigning...
                </>
              ) : (
                'Assign Homework'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
