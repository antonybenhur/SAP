import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, User, Mail, Phone, MapPin, DollarSign, Clock, CheckCircle, Eye, Video, Edit, Trash2 } from 'lucide-react';
import { submissionsTable, interviewsTable, candidatesTable } from '../../lib/db';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';

interface JobPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobOrder: Record<string, any> | null;
}

const statusColors: Record<string, string> = {
  associated: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  under_consideration: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  shortlisted_for_am: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  pending_am_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  rejected_by_am: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  approved_for_submission: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  submitted_to_client: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
  client_reviewing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  interview_scheduled: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400',
  interview_completed: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400',
  offer_extended: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
  offer_accepted: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  placement_confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  rejected_by_client: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  withdrawn: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  submitted: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
};

export const JobPipelineModal: React.FC<JobPipelineModalProps> = ({ isOpen, onClose, jobOrder }) => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [suggestedCandidates, setSuggestedCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [showInterviewsFor, setShowInterviewsFor] = useState<string | null>(null);
  const [selectedCandidateInterviews, setSelectedCandidateInterviews] = useState<any[]>([]);
  const [editingInterview, setEditingInterview] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && jobOrder?.id) {
      fetchSubmissions(); fetchSuggestedCandidates(); fetchInterviews();
    }
  }, [isOpen, jobOrder?.id]);

  const fetchSubmissions = async () => {
    if (!jobOrder?.id) return;
    try {
      setLoading(true);
      const data = await submissionsTable.selectByJobOrder(jobOrder.id);
      setSubmissions(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchSuggestedCandidates = async () => {
    if (!jobOrder?.id) return;
    try { const data = await submissionsTable.getSuggestedCandidates(jobOrder.id); setSuggestedCandidates(data); }
    catch (err) { console.error(err); setSuggestedCandidates([]); }
  };

  const fetchInterviews = async () => {
    if (!jobOrder?.id) return;
    try { const data = await interviewsTable.selectByJobOrder(jobOrder.id); setInterviews(data); }
    catch (err) { console.error(err); setInterviews([]); }
  };

  const getCandidateInterviews = (candidateId: string) => interviews.filter(i => i.candidate_id === candidateId);

  const handleSubmitCandidate = async (candidate: any) => {
    if (!jobOrder?.id || !candidate.id) return;
    try {
      await submissionsTable.insert({ job_order_id: jobOrder.id, candidate_id: candidate.id, status: 'associated' });
      await fetchSubmissions(); await fetchSuggestedCandidates();
    } catch (err) { console.error(err); }
  };

  const handleStatusUpdate = async (submissionId: string, newStatus: string) => {
    try { await submissionsTable.updateStatus(submissionId, newStatus); await fetchSubmissions(); }
    catch (err) { console.error(err); }
  };

  const handleScheduleInterview = (submission: any) => { setSelectedSubmission(submission); setIsScheduleModalOpen(true); };

  const handleInterviewScheduled = () => {
    if (selectedSubmission?.id) handleStatusUpdate(selectedSubmission.id, 'interview_scheduled');
    fetchInterviews(); setIsScheduleModalOpen(false); setSelectedSubmission(null);
  };

  const handleViewInterviews = (candidateId: string) => {
    setSelectedCandidateInterviews(getCandidateInterviews(candidateId));
    setShowInterviewsFor(candidateId);
  };

  const handleEditInterview = (interview: any) => { setEditingInterview(interview); setIsEditModalOpen(true); };

  const handleDeleteInterview = async (interviewId: string) => {
    if (confirm('Are you sure you want to delete this interview?')) {
      try {
        await interviewsTable.delete(interviewId);
        await fetchInterviews();
        if (showInterviewsFor) setSelectedCandidateInterviews(getCandidateInterviews(showInterviewsFor));
        window.dispatchEvent(new CustomEvent('interviewDeleted', { detail: { interviewId } }));
      } catch (err) { console.error(err); }
    }
  };

  const handleInterviewUpdated = async () => {
    await fetchInterviews();
    if (showInterviewsFor) setSelectedCandidateInterviews(getCandidateInterviews(showInterviewsFor));
    setIsEditModalOpen(false); setEditingInterview(null);
  };

  const getInterviewTypeIcon = (type: string) => type === 'video' ? <Video className="w-3 h-3" /> : type === 'phone' ? <Phone className="w-3 h-3" /> : <MapPin className="w-3 h-3" />;
  const formatCurrency = (amount: number | null) => !amount ? 'Not specified' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatStatusLabel = (status: string) => status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = (s.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) || (s.candidate_email?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredSuggestedCandidates = suggestedCandidates.filter(c => (c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false));

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-neutral-900 rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div><h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Candidate Pipeline</h2><p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{jobOrder?.title} at {jobOrder?.company_name}</p></div>
            <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"><X className="w-5 h-5 text-neutral-500" /></button>
          </div>
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><input type="text" placeholder="Search candidates..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 w-full text-neutral-900 dark:text-white" /></div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-white">
                <option value="all">All Status</option>
                <option value="associated">Associated</option>
                <option value="under_consideration">Under Consideration</option>
                <option value="approved_for_submission">Approved for Submission</option>
                <option value="submitted_to_client">Submitted to Client</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="interview_completed">Interview Completed</option>
                <option value="offer_extended">Offer Extended</option>
                <option value="placement_confirmed">Placement Confirmed</option>
                <option value="rejected_by_client">Rejected by Client</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {loading ? <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-white"></div></div>
            : (filteredSubmissions.length === 0 && filteredSuggestedCandidates.length === 0) ? <div className="text-center py-12"><User className="w-12 h-12 text-neutral-400 mx-auto mb-4" /><p className="text-neutral-500 dark:text-neutral-400">No candidates found for this job order.</p></div>
            : (
              <div className="space-y-4">
                {filteredSubmissions.map(submission => (
                  <div key={submission.id} className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-6 border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center"><User className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-neutral-900 dark:text-white">{submission.candidate_name}</h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${submission.status ? statusColors[submission.status] || 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'}`}><CheckCircle className="w-3 h-3 mr-1" />{submission.status ? formatStatusLabel(submission.status) : 'Unknown'}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                            <div className="flex items-center space-x-2"><Mail className="w-4 h-4" /><span>{submission.candidate_email}</span></div>
                            {submission.candidate_phone && <div className="flex items-center space-x-2"><Phone className="w-4 h-4" /><span>{submission.candidate_phone}</span></div>}
                          </div>
                          <div className="flex items-center space-x-2 mt-2"><Clock className="w-4 h-4 text-neutral-400" /><span className="text-sm text-neutral-500 dark:text-neutral-400">{submission.candidate_experience_years} years experience</span></div>
                          {submission.candidate_skills && submission.candidate_skills.length > 0 && <div className="flex flex-wrap gap-1 mt-3">{submission.candidate_skills.slice(0, 5).map((skill: string, index: number) => <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">{skill}</span>)}{submission.candidate_skills.length > 5 && <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-neutral-200 dark:bg-neutral-700 text-neutral-600">+{submission.candidate_skills.length - 5} more</span>}</div>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        {(submission.status === 'approved_for_submission' || submission.status === 'interview_scheduled' || submission.status === 'interview_completed') && <button onClick={() => handleScheduleInterview(submission)} className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"><Calendar className="w-4 h-4" /><span>{submission.status === 'interview_scheduled' ? 'Schedule Another' : 'Schedule Interview'}</span></button>}
                        {submission.candidate_id && getCandidateInterviews(submission.candidate_id).length > 0 && <button onClick={() => handleViewInterviews(submission.candidate_id)} className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"><Eye className="w-4 h-4" /><span>View Interviews ({getCandidateInterviews(submission.candidate_id).length})</span></button>}
                        <select value={submission.status || 'associated'} onChange={e => submission.id && handleStatusUpdate(submission.id, e.target.value)} className="px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-neutral-900 dark:text-white">
                          <option value="associated">Associated</option><option value="under_consideration">Under Consideration</option><option value="approved_for_submission">Approved for Submission</option><option value="submitted_to_client">Submitted to Client</option><option value="interview_scheduled">Interview Scheduled</option><option value="interview_completed">Interview Completed</option><option value="offer_extended">Offer Extended</option><option value="placement_confirmed">Placement Confirmed</option><option value="rejected_by_client">Rejected by Client</option><option value="withdrawn">Withdrawn</option>
                        </select>
                        <div className="text-xs text-neutral-400">Submitted {submission.created_at ? new Date(submission.created_at).toLocaleDateString() : 'Unknown'}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredSuggestedCandidates.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center space-x-2 mb-4"><h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Suggested Candidates</h3><span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">{filteredSuggestedCandidates.length} matches</span></div>
                    <div className="space-y-4">
                      {filteredSuggestedCandidates.map(candidate => (
                        <div key={candidate.id} className="bg-green-50 dark:bg-green-900/10 rounded-lg p-6 border border-green-200 dark:border-green-800">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center"><User className="w-6 h-6 text-green-600 dark:text-green-400" /></div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2"><h3 className="text-lg font-medium text-neutral-900 dark:text-white">{candidate.name}</h3><span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">{candidate.match_score}% match</span></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                                  <div className="flex items-center space-x-2"><Mail className="w-4 h-4" /><span>{candidate.email}</span></div>
                                  <div className="flex items-center space-x-2"><Clock className="w-4 h-4" /><span>{candidate.experience_years} years experience</span></div>
                                </div>
                                {candidate.matched_skills && candidate.matched_skills.length > 0 && <div className="mt-3"><p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">Matching Skills:</p><div className="flex flex-wrap gap-1">{candidate.matched_skills.map((skill: string, index: number) => <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">{skill}</span>)}</div></div>}
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2"><button onClick={() => handleSubmitCandidate(candidate)} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"><User className="w-4 h-4" /><span>Submit to Job</span></button></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end p-6 border-t border-neutral-200 dark:border-neutral-700"><button onClick={onClose} className="px-4 py-2 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button></div>
        </div>
      </div>

      {selectedSubmission && (
        <ScheduleInterviewModal isOpen={isScheduleModalOpen} onClose={() => { setIsScheduleModalOpen(false); setSelectedSubmission(null); }}
          candidate={{ id: selectedSubmission.candidate_id || '', name: selectedSubmission.candidate_name || '', email: selectedSubmission.candidate_email || '' }}
          jobOrder={{ id: jobOrder?.id || '', title: jobOrder?.title || '', company_name: jobOrder?.company_name || '' }}
          onSchedule={handleInterviewScheduled} />
      )}

      {editingInterview && (
        <ScheduleInterviewModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingInterview(null); }}
          candidate={{ id: editingInterview.candidate_id || '', name: editingInterview.candidate_name || '', email: editingInterview.candidate_email || '' }}
          jobOrder={{ id: editingInterview.job_order_id || '', title: editingInterview.job_title || '', company_name: editingInterview.company_name || '' }}
          onSchedule={handleInterviewUpdated} editingInterview={editingInterview} />
      )}

      {showInterviewsFor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div><h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Interview History</h2><p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{selectedCandidateInterviews[0]?.candidate_name || 'Candidate'} - {jobOrder?.title}</p></div>
              <button onClick={() => { setShowInterviewsFor(null); setSelectedCandidateInterviews([]); }} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"><X className="w-5 h-5 text-neutral-500" /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedCandidateInterviews.length === 0 ? <div className="text-center py-8"><Calendar className="w-12 h-12 text-neutral-400 mx-auto mb-4" /><p className="text-neutral-500 dark:text-neutral-400">No interviews scheduled yet</p></div>
              : <div className="space-y-4">{selectedCandidateInterviews.map(interview => (
                <div key={interview.id} className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2"><div className="flex items-center space-x-2">{getInterviewTypeIcon(interview.interview_type)}<h3 className="font-medium text-neutral-900 dark:text-white">{interview.interview_stage?.replace('_', ' ') || 'Interview'}</h3></div><span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">{interview.status || 'Scheduled'}</span></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center space-x-2"><Calendar className="w-4 h-4" /><span>{interview.interview_date ? new Date(interview.interview_date).toLocaleDateString() : 'TBD'}</span></div>
                        <div className="flex items-center space-x-2"><Clock className="w-4 h-4" /><span>{interview.interview_date ? new Date(interview.interview_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'} ({interview.duration_minutes} min)</span></div>
                        {(interview.location || interview.meeting_link) && <div className="flex items-center space-x-2 md:col-span-2">{interview.interview_type === 'in_person' ? <MapPin className="w-4 h-4" /> : interview.interview_type === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}<span className="truncate">{interview.location || interview.meeting_link}</span></div>}
                      </div>
                      {interview.interviewers && interview.interviewers.length > 0 && <div className="mt-3"><p className="text-xs text-neutral-500 mb-1">Interviewers:</p><div className="flex flex-wrap gap-1">{interview.interviewers.map((interviewer: string, idx: number) => <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400">{interviewer}</span>)}</div></div>}
                      {interview.notes && <div className="mt-3"><p className="text-xs text-neutral-500 mb-1">Notes:</p><p className="text-sm text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 rounded p-2">{interview.notes}</p></div>}
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <div className="flex items-center space-x-2"><button onClick={() => handleEditInterview(interview)} className="p-1 text-blue-600 hover:text-blue-800 transition-colors"><Edit className="w-4 h-4" /></button><button onClick={() => handleDeleteInterview(interview.id)} className="p-1 text-red-600 hover:text-red-800 transition-colors"><Trash2 className="w-4 h-4" /></button></div>
                    </div>
                  </div>
                </div>
              ))}</div>}
            </div>
            <div className="flex justify-end p-6 border-t border-neutral-200 dark:border-neutral-700"><button onClick={() => { setShowInterviewsFor(null); setSelectedCandidateInterviews([]); }} className="px-4 py-2 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button></div>
          </div>
        </div>
      )}
    </>
  );
};
