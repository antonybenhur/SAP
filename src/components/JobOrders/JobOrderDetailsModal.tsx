import React from 'react';
import { X, Building2, MapPin, Calendar, DollarSign, Users, Clock, Star, AlertTriangle, Briefcase } from 'lucide-react';
import { Database } from '../../lib/database.types';

type JobOrderWithClient = Database['public']['Views']['job_orders_with_clients']['Row'];

interface JobOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobOrder: JobOrderWithClient | null;
}

export const JobOrderDetailsModal: React.FC<JobOrderDetailsModalProps> = ({
  isOpen,
  onClose,
  jobOrder
}) => {
  if (!isOpen || !jobOrder) return null;

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getBillingDisplay = () => {
    if (jobOrder.billing_structure === 'monthly' && jobOrder.monthly_billing_rate) {
      return formatCurrency(jobOrder.monthly_billing_rate) + '/month';
    } else if (jobOrder.billing_structure === 'project_based' && jobOrder.project_total_value) {
      return formatCurrency(jobOrder.project_total_value) + ' (Total Project)';
    } else if (jobOrder.billing_rate) {
      return formatCurrency(jobOrder.billing_rate) + '/hour';
    }
    return 'Rate not specified';
  };

  const getPayRangeDisplay = () => {
    if (jobOrder.billing_structure === 'monthly') {
      const min = jobOrder.monthly_target_pay_min;
      const max = jobOrder.monthly_target_pay_max;
      if (min && max) {
        return `${formatCurrency(min)} - ${formatCurrency(max)}/month`;
      } else if (min) {
        return `${formatCurrency(min)}+/month`;
      }
      return 'Monthly pay not specified';
    } else {
      const min = jobOrder.target_pay_rate_min;
      const max = jobOrder.target_pay_rate_max;
      if (min && max) {
        return `${formatCurrency(min)} - ${formatCurrency(max)}/hour`;
      } else if (min) {
        return `${formatCurrency(min)}+/hour`;
      }
      return 'Hourly pay not specified';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const statusColors = {
    open: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    interviewing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    filled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    closed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white flex items-center">
                {jobOrder.title}
                {jobOrder.priority_level === 'high' && (
                  <AlertTriangle className="w-5 h-5 text-red-500 ml-2" />
                )}
                {jobOrder.contract_to_hire_potential && (
                  <Star className="w-5 h-5 text-yellow-500 ml-2" />
                )}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">{jobOrder.company_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Status and Priority */}
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${jobOrder.status ? statusColors[jobOrder.status] : 'bg-gray-100 text-gray-800'}`}>
              {jobOrder.status?.charAt(0).toUpperCase() + jobOrder.status?.slice(1)}
            </span>
            {jobOrder.priority_level && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityColors[jobOrder.priority_level]}`}>
                {jobOrder.priority_level.charAt(0).toUpperCase() + jobOrder.priority_level.slice(1)} Priority
              </span>
            )}
            {jobOrder.contract_to_hire_potential && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                Contract-to-Hire
              </span>
            )}
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location & Work Arrangement */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Location & Work Style
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Location:</span>
                  <p className="text-neutral-900 dark:text-white">{jobOrder.location || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Work Arrangement:</span>
                  <p className="text-neutral-900 dark:text-white">
                    {jobOrder.work_arrangement ? 
                      jobOrder.work_arrangement.replace('_', ' ').charAt(0).toUpperCase() + jobOrder.work_arrangement.replace('_', ' ').slice(1) : 
                      'Not specified'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Timeline
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Duration:</span>
                  <p className="text-neutral-900 dark:text-white">{jobOrder.duration || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Ideal Start Date:</span>
                  <p className="text-neutral-900 dark:text-white">{formatDate(jobOrder.ideal_start_date)}</p>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Financial Details
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Billing Rate:</span>
                  <p className="text-neutral-900 dark:text-white font-semibold">{getBillingDisplay()}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Target Pay Range:</span>
                  <p className="text-neutral-900 dark:text-white">{getPayRangeDisplay()}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Rate Type:</span>
                  <p className="text-neutral-900 dark:text-white">{jobOrder.rate_type ? jobOrder.rate_type.toUpperCase() : 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Team */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Team Assignment
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Primary Recruiter:</span>
                  <p className="text-neutral-900 dark:text-white">{jobOrder.primary_recruiter_name || 'Unassigned'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Account Manager:</span>
                  <p className="text-neutral-900 dark:text-white">{jobOrder.account_manager_name || 'Unassigned'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Job Description */}
          {jobOrder.description && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Job Description</h3>
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
                <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{jobOrder.description}</p>
              </div>
            </div>
          )}

          {/* Skills & Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Required Skills */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(jobOrder.required_skills || []).map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400"
                  >
                    {skill}
                  </span>
                ))}
                {(!jobOrder.required_skills || jobOrder.required_skills.length === 0) && (
                  <p className="text-neutral-500 dark:text-neutral-400">No specific skills listed</p>
                )}
              </div>
            </div>

            {/* Nice to Have Skills */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Nice to Have Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(jobOrder.nice_to_have_skills || []).map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                  >
                    {skill}
                  </span>
                ))}
                {(!jobOrder.nice_to_have_skills || jobOrder.nice_to_have_skills.length === 0) && (
                  <p className="text-neutral-500 dark:text-neutral-400">No additional skills specified</p>
                )}
              </div>
            </div>
          </div>

          {/* Experience Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Experience Requirements</h3>
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Years of Experience:</span>
                  <p className="text-neutral-900 dark:text-white">
                    {jobOrder.years_experience_required ? `${jobOrder.years_experience_required}+ years` : 'Not specified'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Experience Level:</span>
                  <p className="text-neutral-900 dark:text-white">{jobOrder.experience_level || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Context */}
          {jobOrder.reason_for_opening && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Context</h3>
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
                <div>
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Reason for Opening:</span>
                  <p className="text-neutral-900 dark:text-white">
                    {jobOrder.reason_for_opening.replace('_', ' ').charAt(0).toUpperCase() + jobOrder.reason_for_opening.replace('_', ' ').slice(1)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};