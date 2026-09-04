import React from 'react';
import { X, Briefcase, Building2, DollarSign, Calendar, Users, MapPin, Clock, User, Target, AlertTriangle, Star } from 'lucide-react';

interface JobOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobOrder: Record<string, any> | null;
}

export const JobOrderDetailsModal: React.FC<JobOrderDetailsModalProps> = ({ isOpen, onClose, jobOrder }) => {
  if (!isOpen || !jobOrder) return null;

  const formatCurrency = (amount: number | null) => !amount ? 'Not specified' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (dateString: string | null) => !dateString ? 'Not specified' : new Date(dateString).toLocaleDateString();

  const getBillingDisplay = () => {
    if (jobOrder.billing_structure === 'monthly' && jobOrder.monthly_billing_rate) return formatCurrency(jobOrder.monthly_billing_rate) + '/mo';
    if (jobOrder.billing_structure === 'project_based' && jobOrder.project_total_value) return formatCurrency(jobOrder.project_total_value) + ' (Project)';
    if (jobOrder.billing_rate) return formatCurrency(jobOrder.billing_rate) + '/hr';
    return 'Rate not specified';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center"><Briefcase className="w-8 h-8 text-blue-600" /></div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center">{jobOrder.title}{jobOrder.priority_level === 'high' && <AlertTriangle className="w-5 h-5 text-red-500 ml-2" />}{jobOrder.contract_to_hire_potential && <Star className="w-5 h-5 text-yellow-500 ml-2" />}</h2>
              <p className="text-neutral-500 dark:text-neutral-400">{jobOrder.company_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center"><Briefcase className="w-5 h-5 mr-2" />Job Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3"><Building2 className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">Client</p><p className="text-neutral-900 dark:text-white">{jobOrder.company_name}</p></div></div>
              <div className="flex items-center space-x-3"><MapPin className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">Location</p><p className="text-neutral-900 dark:text-white">{jobOrder.location || 'Not specified'}</p></div></div>
              <div className="flex items-center space-x-3"><Clock className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">Duration</p><p className="text-neutral-900 dark:text-white">{jobOrder.duration || 'Not specified'}</p></div></div>
              <div className="flex items-center space-x-3"><Calendar className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">Ideal Start Date</p><p className="text-neutral-900 dark:text-white">{formatDate(jobOrder.ideal_start_date)}</p></div></div>
            </div>
            {jobOrder.description && <div className="mt-4"><p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Description</p><div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4"><p className="text-neutral-900 dark:text-white whitespace-pre-wrap">{jobOrder.description}</p></div></div>}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center"><Target className="w-5 h-5 mr-2" />Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400">Experience Level</p><p className="text-neutral-900 dark:text-white">{jobOrder.experience_level || 'Not specified'}</p></div>
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400">Years Required</p><p className="text-neutral-900 dark:text-white">{jobOrder.years_experience_required ? `${jobOrder.years_experience_required}+ years` : 'Not specified'}</p></div>
            </div>
            {jobOrder.required_skills && jobOrder.required_skills.length > 0 && <div className="mb-4"><p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Required Skills</p><div className="flex flex-wrap gap-2">{jobOrder.required_skills.map((skill: string, index: number) => <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">{skill}</span>)}</div></div>}
            {jobOrder.nice_to_have_skills && jobOrder.nice_to_have_skills.length > 0 && <div><p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Nice-to-Have Skills</p><div className="flex flex-wrap gap-2">{jobOrder.nice_to_have_skills.map((skill: string, index: number) => <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">{skill}</span>)}</div></div>}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center"><DollarSign className="w-5 h-5 mr-2" />Financial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400">Billing</p><p className="text-neutral-900 dark:text-white">{getBillingDisplay()}</p></div>
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400">Rate Type</p><p className="text-neutral-900 dark:text-white">{jobOrder.rate_type ? jobOrder.rate_type.toUpperCase() : 'Not specified'}</p></div>
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400">Priority</p><p className="text-neutral-900 dark:text-white">{jobOrder.priority_level ? jobOrder.priority_level.charAt(0).toUpperCase() + jobOrder.priority_level.slice(1) : 'Not specified'}</p></div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center"><Users className="w-5 h-5 mr-2" />Team Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3"><User className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">Primary Recruiter</p><p className="text-neutral-900 dark:text-white">{jobOrder.primary_recruiter_name || 'Unassigned'}</p></div></div>
              <div className="flex items-center space-x-3"><User className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">Account Manager</p><p className="text-neutral-900 dark:text-white">{jobOrder.account_manager_name || 'Unassigned'}</p></div></div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400">Status</p><span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${jobOrder.status === 'open' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : jobOrder.status === 'interviewing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' : jobOrder.status === 'filled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>{jobOrder.status}</span></div>
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400">Contract-to-Hire</p><p className="text-neutral-900 dark:text-white">{jobOrder.contract_to_hire_potential ? 'Yes' : 'No'}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
