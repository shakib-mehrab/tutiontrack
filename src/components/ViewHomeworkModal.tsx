'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Calendar, BookOpen, FileText, CheckCircle, Edit2, Trash2, Send } from 'lucide-react';
import { Homework, HomeworkComment } from '@/types';
import { format } from 'date-fns';

interface ViewHomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  homework: Homework | null;
  isTeacher: boolean;
  onUpdate?: (id: string, data: Partial<Homework>) => void;
  onDelete?: (id: string) => void;
  onMarkComplete?: (id: string) => void;
  isLoading?: boolean;
}

export function ViewHomeworkModal({
  isOpen,
  onClose,
  homework,
  isTeacher,
  onUpdate,
  onDelete,
  onMarkComplete,
  isLoading = false,
}: ViewHomeworkModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    subject: '',
    chapter: '',
    topic: '',
    dueDate: '',
    notes: '',
    feedback: '',
  });
  const [comments, setComments] = useState<HomeworkComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  const loadComments = useCallback(async () => {
    if (!homework) return;
    
    setLoadingComments(true);
    try {
      const response = await fetch(`/api/homework/${homework.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  }, [homework]);

  // Load homework data into edit form when homework changes
  useEffect(() => {
    if (homework) {
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
      
      setEditData({
        subject: homework.subject,
        chapter: homework.chapter,
        topic: homework.topic,
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        notes: homework.notes || '',
        feedback: homework.feedback || '',
      });
      
      // Load comments
      loadComments();
    }
  }, [homework, loadComments]);

  const handleUpdate = () => {
    if (!homework || !onUpdate) return;

    onUpdate(homework.id, {
      subject: editData.subject,
      chapter: editData.chapter,
      topic: editData.topic,
      dueDate: new Date(editData.dueDate) as unknown as Date,
      notes: editData.notes,
      feedback: editData.feedback,
    });
    setIsEditing(false);
  };

  const handleMarkComplete = () => {
    if (!homework || !onMarkComplete) return;
    onMarkComplete(homework.id);
  };

  const handleDelete = () => {
    if (!homework || !onDelete) return;
    if (confirm('Are you sure you want to delete this homework? This action cannot be undone.')) {
      onDelete(homework.id);
    }
  };

  const handleSendComment = async () => {
    if (!homework || !newComment.trim()) return;

    setSendingComment(true);
    try {
      const response = await fetch(`/api/homework/${homework.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newComment }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments(prev => [...prev, comment]);
        setNewComment('');
      } else {
        alert('Failed to send comment');
      }
    } catch (error) {
      console.error('Error sending comment:', error);
      alert('Failed to send comment');
    } finally {
      setSendingComment(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setNewComment('');
    onClose();
  };

  if (!isOpen || !homework) return null;

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
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-slate-800">
                {isEditing ? 'Edit Homework' : 'Homework Details'}
              </h2>
              {homework.status === 'completed' && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Completed
                </span>
              )}
              {isOverdue && (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                  Overdue
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">
              {isTeacher ? `Student: ${homework.studentName}` : `Teacher: ${homework.teacherName}`}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            disabled={isLoading}
            title="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Homework Details */}
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="form-label" htmlFor="edit-subject">
                  Subject *
                </label>
                <input
                  id="edit-subject"
                  type="text"
                  value={editData.subject}
                  onChange={(e) => setEditData(prev => ({ ...prev, subject: e.target.value }))}
                  className="form-input"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="form-label" htmlFor="edit-chapter">
                  Chapter *
                </label>
                <input
                  id="edit-chapter"
                  type="text"
                  value={editData.chapter}
                  onChange={(e) => setEditData(prev => ({ ...prev, chapter: e.target.value }))}
                  className="form-input"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="form-label" htmlFor="edit-topic">
                  Topic *
                </label>
                <input
                  id="edit-topic"
                  type="text"
                  value={editData.topic}
                  onChange={(e) => setEditData(prev => ({ ...prev, topic: e.target.value }))}
                  className="form-input"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="form-label" htmlFor="edit-dueDate">
                  Due Date *
                </label>
                <input
                  id="edit-dueDate"
                  type="date"
                  min={today}
                  value={editData.dueDate}
                  onChange={(e) => setEditData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="form-input"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="form-label" htmlFor="edit-notes">
                  Notes
                </label>
                <textarea
                  id="edit-notes"
                  value={editData.notes}
                  onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                  className="form-input min-h-[80px] resize-y"
                  disabled={isLoading}
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Subject</p>
                  <p className="font-medium text-slate-800 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-indigo-600" />
                    {homework.subject}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500 mb-1">Due Date</p>
                  <p className={`font-medium flex items-center gap-2 ${isOverdue ? 'text-red-600' : 'text-slate-800'}`}>
                    <Calendar className="h-4 w-4" />
                    {format(dueDate, 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Chapter</p>
                <p className="font-medium text-slate-800">{homework.chapter}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Topic</p>
                <p className="font-medium text-slate-800">{homework.topic}</p>
              </div>

              {homework.notes && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Notes</p>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">
                    {homework.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Teacher Feedback Section */}
          {isTeacher ? (
            <div>
              <label className="form-label" htmlFor="feedback">
                Feedback
              </label>
              <textarea
                id="feedback"
                value={editData.feedback}
                onChange={(e) => setEditData(prev => ({ ...prev, feedback: e.target.value }))}
                className="form-input min-h-[100px] resize-y"
                placeholder="Provide feedback to the student..."
                disabled={isLoading}
                rows={4}
              />
            </div>
          ) : (
            homework.feedback && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Teacher Feedback</p>
                <p className="text-slate-700 bg-indigo-50 p-3 rounded-lg whitespace-pre-wrap border border-indigo-100">
                  {homework.feedback}
                </p>
              </div>
            )
          )}

          {/* Comments Section */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Comments
            </h3>

            {/* Comments List */}
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {loadingComments ? (
                <p className="text-sm text-slate-500 text-center py-4">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-3 rounded-lg ${
                      comment.userRole === 'teacher' 
                        ? 'bg-indigo-50 border border-indigo-100' 
                        : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-slate-800">
                        {comment.userName}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        comment.userRole === 'teacher'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {comment.userRole}
                      </span>
                      <span className="text-xs text-slate-400 ml-auto">
                        {format(
                          comment.createdAt instanceof Date 
                            ? comment.createdAt 
                            : typeof comment.createdAt === 'string'
                            ? new Date(comment.createdAt)
                            : comment.createdAt && typeof comment.createdAt === 'object' && 'toDate' in comment.createdAt
                            ? comment.createdAt.toDate()
                            : new Date(),
                          'MMM dd, HH:mm'
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {comment.comment}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !sendingComment && handleSendComment()}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Add a comment..."
                disabled={sendingComment}
              />
              <button
                onClick={handleSendComment}
                disabled={!newComment.trim() || sendingComment}
                className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              >
                {sendingComment ? (
                  <div className="loader w-4 h-4"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          {isTeacher && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary flex-1"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="btn-primary flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleDelete}
                    className="btn-secondary flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                  {homework.status === 'assigned' && (
                    <button
                      onClick={handleMarkComplete}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                      disabled={isLoading}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {isLoading ? 'Marking...' : 'Mark Complete'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {!isTeacher && (
            <div className="pt-4 border-t">
              <button
                onClick={handleClose}
                className="btn-secondary w-full"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
