import React, { useState } from 'react';
import { useEffect } from 'react';
import { Clock, Check, X, Eye, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';

type TimesheetWithDetails = Database['public']['Views']['timesheets_with_details']['Row'];
type TimesheetStatus = Database['public']['Enums']['timesheet_status'];

const statusColors: Record<TimesheetStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

const statusIcons: Record<TimesheetStatus, React.ReactNode> = {
  draft: <Clock className="w-4 h-4" />,
  submitted: <AlertCircle className="w-4 h-4" />,
  approved: <Check className="w-4 h-4" />,
  rejected: <X className="w-4 h-4" />,
};

export const Timesheets: React.FC = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<TimesheetStatus | 'all'>('all');
  const [timesheets, setTimesheets] = useState<TimesheetWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimesheets = async () => {
      try {
        const { data, error } = await supabase
          .from('timesheets_with_details')
          .select('*')
          .order('week_ending', { ascending: false });

        if (error) throw error;
        setTimesheets(data || []);
      } catch (error) {
        console.error('Error fetching timesheets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimesheets();
  }, []);

  const filteredTimesheets = timesheets.filter(timesheet => 
    statusFilter === 'all' || timesheet.status === statusFilter
  );

  const canApprove = user?.role === 'account_manager' || user?.role === 'administrator';
  const isConsultant = user?.role === 'consultant';

  const handleApprove = async (timesheetId: string) => {
    // In real app, this would make API call to approve timesheet
    console.log('Approving timesheet:', timesheetId);
  };

  const handleReject = async (timesheetId: string) => {
    // In real app, this would make API call to reject timesheet
    console.log('Rejecting timesheet:', timesheetId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TimesheetStatus | 'all')}
            className="px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-neutral-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        {isConsultant && (
          <button className="flex items-center space-x-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
            <Clock className="w-4 h-4" />
            <span>New Timesheet</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Pending</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {timesheets.filter(t => t.status === 'submitted').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Approved</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {timesheets.filter(t => t.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <div className="p-3 bg-red-500/10 rounded-lg">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Rejected</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {timesheets.filter(t => t.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Hours</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {timesheets.filter(t => t.status === 'approved').reduce((sum, t) => sum + (t.hours || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timesheets Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Consultant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Week Ending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Submitted
                </th>
                {canApprove && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Actions
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  View
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-700">
              {filteredTimesheets.map((timesheet) => (
                <tr key={timesheet.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-900 dark:text-white">
                      {timesheet.consultant_name || `Consultant #${timesheet.consultant_id}`}
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                      {timesheet.job_title || `Job #${timesheet.job_order_id}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                    {timesheet.week_ending ? new Date(timesheet.week_ending).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                    {timesheet.hours} hours
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${timesheet.status ? statusColors[timesheet.status] : 'bg-gray-100 text-gray-800'}`}>
                        {timesheet.status && statusIcons[timesheet.status]}
                        <span className="ml-1">{timesheet.status}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                    {timesheet.submitted_at ? new Date(timesheet.submitted_at).toLocaleDateString() : 'N/A'}
                  </td>
                  {canApprove && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                      {timesheet.status === 'submitted' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => timesheet.id && handleApprove(timesheet.id)}
                            className="p-1 text-green-600 hover:text-green-900 transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => timesheet.id && handleReject(timesheet.id)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                    <button className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTimesheets.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-neutral-500 dark:text-neutral-400">No timesheets found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Comments Section for rejected timesheets */}
      {filteredTimesheets.some(t => t.status === 'rejected' && t.comments) && (
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Recent Comments</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {filteredTimesheets
                .filter(t => t.status === 'rejected' && t.comments)
                .map(timesheet => (
                  <div key={timesheet.id} className="border-l-4 border-destructive pl-4">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      Timesheet #{timesheet.id} - Week ending {timesheet.week_ending ? new Date(timesheet.week_ending).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{timesheet.comments}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};