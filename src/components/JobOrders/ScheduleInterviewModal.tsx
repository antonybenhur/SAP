import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Video, Phone, MapPin, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    id: string;
    name: string;
    email: string;
  } | null;
  jobOrder: {
    id: string;
    title: string;
    company_name: string;
  } | null;
  onSchedule: (interviewData: any) => void;
  editingInterview?: any;
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  isOpen,
  onClose,
  candidate,
  jobOrder,
  onSchedule,
  editingInterview
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: '60',
    type: 'video' as 'video' | 'phone' | 'in_person',
    stage: 'phone_screen' as 'phone_screen' | 'technical' | 'panel' | 'final',
    location: '',
    notes: '',
    interviewers: ''
  });
  const [loading, setLoading] = useState(false);

  // Pre-populate form when editing
  useEffect(() => {
    if (editingInterview) {
      const interviewDate = editingInterview.interview_date ? new Date(editingInterview.interview_date) : new Date();
      setFormData({
        date: interviewDate.toISOString().split('T')[0] || '',
        time: interviewDate.toTimeString().slice(0, 5) || '',
        duration: editingInterview.duration_minutes?.toString() || '60',
        type: editingInterview.interview_type || 'video',
        stage: editingInterview.interview_stage || 'phone_screen',
        location: editingInterview.location || editingInterview.meeting_link || '',
        notes: editingInterview.notes || '',
        interviewers: editingInterview.interviewers?.join(', ') || ''
      });
    } else {
      // Reset form for new interview
      setFormData({
        date: '',
        time: '',
        duration: '60',
        type: 'video',
        stage: 'phone_screen',
        location: '',
        notes: '',
        interviewers: ''
      });
    }
  }, [editingInterview]);

  if (!isOpen || !candidate || !jobOrder) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!candidate || !jobOrder || !user) return;
    
    setLoading(true);
    
    try {
      // Combine date and time into a single datetime
      const interviewDateTime = new Date(`${formData.date}T${formData.time}`);
      
      const interviewData = {
        candidate_id: candidate.id,
        job_order_id: jobOrder.id,
        interview_date: interviewDateTime.toISOString(),
        duration_minutes: parseInt(formData.duration),
        interview_type: formData.type,
        interview_stage: formData.stage,
        location: formData.location || null,
        meeting_link: formData.type === 'video' ? formData.location : null,
        notes: formData.notes || null,
        interviewers: formData.interviewers.split(',').map(i => i.trim()).filter(Boolean),
        status: 'scheduled' as const,
        created_by: user.id
      };

      if (editingInterview) {
        // Update existing interview
        const { error } = await supabase
          .from('interviews')
          .update(interviewData)
          .eq('id', editingInterview.id);

        if (error) throw error;
        
        // Dispatch update event
        window.dispatchEvent(new CustomEvent('interviewUpdated', { detail: { ...interviewData, id: editingInterview.id } }));
      } else {
        // Get the submission ID first
        const { data: submission, error: submissionError } = await supabase
          .from('submissions')
          .select('id')
          .eq('job_order_id', jobOrder.id)
          .eq('candidate_id', candidate.id)
          .single();

        if (submissionError) throw submissionError;

        // Create new interview with submission ID
        const { data: interview, error: interviewError } = await supabase
          .from('interviews')
          .insert({
            ...interviewData,
            submission_id: submission.id
          })
          .select()
          .single();

        if (interviewError) throw interviewError;

        // Update submission status to interview_scheduled
        const { error: statusUpdateError } = await supabase
          .from('submissions')
          .update({ submission_status: 'interview_scheduled' })
          .eq('job_order_id', jobOrder.id)
          .eq('candidate_id', candidate.id);

        if (statusUpdateError) throw statusUpdateError;
        
        // Dispatch new interview event
        window.dispatchEvent(new CustomEvent('interviewScheduled', { detail: interview }));
      }

      onSchedule(interviewData);
      onClose();
    } catch (error) {
      console.error('Error saving interview:', error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  const getStageLabel = (stage: string) => {
    const labels = {
      phone_screen: 'Phone Screen',
      technical: 'Technical Interview',
      panel: 'Panel Interview',
      final: 'Final Interview'
    };
    return labels[stage as keyof typeof labels] || stage;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'in_person': return <MapPin className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              {editingInterview ? 'Edit Interview' : 'Schedule Interview'}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {candidate.name} • {jobOrder.title} at {jobOrder.company_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Time
              </label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          {/* Duration and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Duration (minutes)
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Interview Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              >
                <option value="video">Video Call</option>
                <option value="phone">Phone Call</option>
                <option value="in_person">In Person</option>
              </select>
            </div>
          </div>

          {/* Stage */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Interview Stage
            </label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData(prev => ({ ...prev, stage: e.target.value as any }))}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              <option value="phone_screen">Phone Screen</option>
              <option value="technical">Technical Interview</option>
              <option value="panel">Panel Interview</option>
              <option value="final">Final Interview</option>
            </select>
          </div>

          {/* Location (for in-person or video link) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {formData.type === 'in_person' ? 'Location' : formData.type === 'video' ? 'Meeting Link' : 'Phone Number'}
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder={
                formData.type === 'in_person' 
                  ? 'Office address or meeting room' 
                  : formData.type === 'video' 
                    ? 'Zoom/Teams meeting link' 
                    : 'Phone number to call'
              }
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            />
          </div>

          {/* Interviewers */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Interviewers (comma-separated)
            </label>
            <input
              type="text"
              value={formData.interviewers}
              onChange={(e) => setFormData(prev => ({ ...prev, interviewers: e.target.value }))}
              placeholder="John Smith, Jane Doe, Mike Johnson"
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Additional notes or instructions for the interview..."
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                getTypeIcon(formData.type)
              )}
              {loading ? 'Saving...' : (editingInterview ? 'Update Interview' : `Schedule ${getStageLabel(formData.stage)}`)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};