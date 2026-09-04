import React from 'react';
import { X, Mail, Phone, MapPin, DollarSign, FileText, User, Building, Globe } from 'lucide-react';

interface CandidateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Record<string, any> | null;
}

export const CandidateDetailsModal: React.FC<CandidateDetailsModalProps> = ({ isOpen, onClose, candidate }) => {
  if (!isOpen || !candidate) return null;

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {candidate.profile_photo_url ? (
                <img className="h-16 w-16 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700" src={candidate.profile_photo_url} alt={candidate.name} />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center"><span className="text-lg font-medium text-primary">{candidate.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}</span></div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{candidate.name}</h2>
              <p className="text-neutral-500 dark:text-neutral-400">{candidate.primary_skill || 'Professional'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center"><User className="w-5 h-5 mr-2" />Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3"><Mail className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">Email</p><p className="text-neutral-900 dark:text-white">{candidate.email}</p></div></div>
              <div className="flex items-center space-x-3"><Phone className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">Phone</p><p className="text-neutral-900 dark:text-white">{candidate.phone || 'Not provided'}</p></div></div>
              <div className="flex items-center space-x-3"><MapPin className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">Location</p><p className="text-neutral-900 dark:text-white">{candidate.location || 'Not specified'}</p></div></div>
              {candidate.linkedin_url && <div className="flex items-center space-x-3"><Globe className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">LinkedIn</p><a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Profile</a></div></div>}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center"><Building className="w-5 h-5 mr-2" />Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Experience</p><p className="text-neutral-900 dark:text-white">{candidate.experience_years} years</p></div>
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Primary Skill</p><p className="text-neutral-900 dark:text-white">{candidate.primary_skill || 'Not specified'}</p></div>
              <div className="md:col-span-2"><p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Skills</p><div className="flex flex-wrap gap-2">{(candidate.skills || []).map((skill: string, index: number) => <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">{skill}</span>)}</div></div>
              {candidate.certifications && candidate.certifications.length > 0 && <div className="md:col-span-2"><p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Certifications</p><div className="flex flex-wrap gap-2">{candidate.certifications.map((cert: string, index: number) => <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">{cert}</span>)}</div></div>}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Work Authorization & Logistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400">Work Authorization</p><p className="text-neutral-900 dark:text-white">{candidate.work_authorization ? candidate.work_authorization.replace('_', ' ').toUpperCase() : 'Not specified'}</p></div>
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400">Work Arrangement</p><p className="text-neutral-900 dark:text-white">{candidate.work_arrangement ? candidate.work_arrangement.charAt(0).toUpperCase() + candidate.work_arrangement.slice(1) : 'Not specified'}</p></div>
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400">Availability Date</p><p className="text-neutral-900 dark:text-white">{formatDate(candidate.availability_date)}</p></div>
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400">Willing to Relocate</p><p className="text-neutral-900 dark:text-white">{candidate.willing_to_relocate ? candidate.willing_to_relocate.replace('_', ' ') : 'Not specified'}</p></div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center"><DollarSign className="w-5 h-5 mr-2" />Compensation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400">Current Rate</p><p className="text-neutral-900 dark:text-white">{formatCurrency(candidate.current_rate)}</p></div>
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400">Expected Rate</p><p className="text-neutral-900 dark:text-white">{formatCurrency(candidate.expected_rate)}</p></div>
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400">Rate Type</p><p className="text-neutral-900 dark:text-white">{candidate.rate_type ? candidate.rate_type.toUpperCase() : 'Not specified'}</p></div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center"><FileText className="w-5 h-5 mr-2" />Documents</h3>
            <div className="flex flex-wrap gap-4">
              {candidate.resume_url && <button onClick={() => window.open(candidate.resume_url, '_blank')} className="flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"><FileText className="w-4 h-4" /><span>View Resume</span></button>}
              {candidate.id_card_url && <button onClick={() => window.open(candidate.id_card_url, '_blank')} className="flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"><FileText className="w-4 h-4" /><span>View ID Card</span></button>}
            </div>
          </div>
          {candidate.notes && <div><h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Notes</h3><div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4"><p className="text-neutral-900 dark:text-white whitespace-pre-wrap">{candidate.notes}</p></div></div>}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Status & Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400">Status</p><span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${candidate.status === 'available' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : candidate.status === 'in_process' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' : candidate.status === 'placed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>{candidate.status.replace('_', ' ')}</span></div>
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400">Source</p><p className="text-neutral-900 dark:text-white">{candidate.source || 'Not specified'}</p></div>
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400">Last Contacted</p><p className="text-neutral-900 dark:text-white">{formatDate(candidate.last_contacted_date)}</p></div>
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400">Added On</p><p className="text-neutral-900 dark:text-white">{formatDate(candidate.created_at)}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
