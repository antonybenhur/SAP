import React, { useState, useEffect } from 'react';
import { Search, Plus, Download, Eye, Edit, Trash2, Briefcase, Building2, DollarSign, Users, AlertTriangle, Star, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { JobOrderModal } from '../components/JobOrders/JobOrderModal';
import { JobOrderDetailsModal } from '../components/JobOrders/JobOrderDetailsModal';
import { JobPipelineModal } from '../components/JobOrders/JobPipelineModal';

type JobOrder = Database['public']['Tables']['job_orders']['Row'];
type JobOrderWithClient = Database['public']['Views']['job_orders_with_clients']['Row'];
type JobOrderStatus = Database['public']['Enums']['job_order_status'];

const statusColors: Record<JobOrderStatus, string> = {
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

export const JobOrders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobOrderStatus | 'all'>('all');
  const [jobOrders, setJobOrders] = useState<JobOrderWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJobOrder, setSelectedJobOrder] = useState<JobOrder | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [detailsJobOrder, setDetailsJobOrder] = useState<JobOrderWithClient | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [pipelineJobOrder, setPipelineJobOrder] = useState<JobOrderWithClient | null>(null);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);

  useEffect(() => {
    const fetchJobOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('job_orders_with_clients')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setJobOrders(data || []);
      } catch (error) {
        console.error('Error fetching job orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobOrders();
  }, []);

  const handleAddJobOrder = () => {
    setSelectedJobOrder(null);
    setIsModalOpen(true);
  };

  const handleEditJobOrder = async (jobOrderId: string) => {
    try {
      const { data, error } = await supabase
        .from('job_orders')
        .select('*')
        .eq('id', jobOrderId)
        .single();

      if (error) throw error;
      setSelectedJobOrder(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching job order for edit:', error);
    }
  };

  const handleViewDetails = (jobOrder: JobOrderWithClient) => {
    setDetailsJobOrder(jobOrder);
    setIsDetailsModalOpen(true);
  };

  const handleViewPipeline = (jobOrder: JobOrderWithClient) => {
    setPipelineJobOrder(jobOrder);
    setIsPipelineModalOpen(true);
  };

  const handleDeleteJobOrder = async (jobOrderId: string) => {
    try {
      const { error } = await supabase
        .from('job_orders')
        .delete()
        .eq('id', jobOrderId);

      if (error) throw error;

      setJobOrders(prev => prev.filter(jo => jo.id !== jobOrderId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting job order:', error);
    }
  };

  const handleModalSave = () => {
    // Refresh job orders list
    const fetchJobOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('job_orders_with_clients')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setJobOrders(data || []);
      } catch (error) {
        console.error('Error fetching job orders:', error);
      }
    };
    fetchJobOrders();
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getBillingDisplay = (jobOrder: JobOrderWithClient) => {
    if (jobOrder.billing_structure === 'monthly' && jobOrder.monthly_billing_rate) {
      return formatCurrency(jobOrder.monthly_billing_rate) + '/mo';
    } else if (jobOrder.billing_structure === 'project_based' && jobOrder.project_total_value) {
      return formatCurrency(jobOrder.project_total_value) + ' (Project)';
    } else if (jobOrder.billing_rate) {
      return formatCurrency(jobOrder.billing_rate) + '/hr';
    }
    return 'Rate not specified';
  };

  const getPayRangeDisplay = (jobOrder: JobOrderWithClient) => {
    if (jobOrder.billing_structure === 'monthly') {
      const min = jobOrder.monthly_target_pay_min;
      const max = jobOrder.monthly_target_pay_max;
      if (min && max) {
        return `${formatCurrency(min)} - ${formatCurrency(max)}/mo`;
      } else if (min) {
        return `${formatCurrency(min)}+/mo`;
      }
      return 'Monthly pay not specified';
    } else {
      const min = jobOrder.target_pay_rate_min;
      const max = jobOrder.target_pay_rate_max;
      if (min && max) {
        return `${formatCurrency(min)} - ${formatCurrency(max)}/hr`;
      } else if (min) {
        return `${formatCurrency(min)}+/hr`;
      }
      return 'Hourly pay not specified';
    }
  };

  const filteredJobOrders = jobOrders.filter(jobOrder => {
    const matchesSearch = (jobOrder.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (jobOrder.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (jobOrder.required_skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) || false);
    
    const matchesStatus = statusFilter === 'all' || jobOrder.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
          {/* Search */}
          <div className="relative flex-1 min-w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search job orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-neutral-900 dark:text-white placeholder:text-neutral-500"
            />
          </div>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as JobOrderStatus | 'all')}
            className="px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-neutral-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="interviewing">Interviewing</option>
            <option value="filled">Filled</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-900 dark:text-white">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <button 
            onClick={handleAddJobOrder}
            className="flex items-center space-x-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Job Order</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Briefcase className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Open Jobs</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {jobOrders.filter(jo => jo.status === 'open').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Interviewing</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {jobOrders.filter(jo => jo.status === 'interviewing').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Filled</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {jobOrders.filter(jo => jo.status === 'filled').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Avg. Rate</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                ${Math.round(jobOrders.reduce((sum, jo) => sum + (jo.billing_rate || 0), 0) / (jobOrders.length || 1))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Job Orders Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Client & Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Skills & Experience
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Financial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Status & Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-700">
              {filteredJobOrders.map((jobOrder) => (
                <tr key={jobOrder.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-900 dark:text-white flex items-center">
                          {jobOrder.title}
                          {jobOrder.priority_level === 'high' && (
                            <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
                          )}
                          {jobOrder.contract_to_hire_potential && (
                            <Star className="w-4 h-4 text-yellow-500 ml-2" />
                          )}
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          {jobOrder.duration || 'Duration not specified'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-neutral-900 dark:text-white">
                        {jobOrder.company_name}
                      </div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        {jobOrder.location || 'Location not specified'}
                      </div>
                      <div className="text-xs text-neutral-400 dark:text-neutral-500">
                        {jobOrder.work_arrangement ? 
                          jobOrder.work_arrangement.replace('_', ' ').charAt(0).toUpperCase() + jobOrder.work_arrangement.replace('_', ' ').slice(1) : 
                          ''
                        }
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(jobOrder.required_skills || []).slice(0, 2).map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400"
                        >
                          {skill}
                        </span>
                      ))}
                      {(jobOrder.required_skills || []).length > 2 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                          +{(jobOrder.required_skills || []).length - 2} more
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {jobOrder.years_experience_required ? `${jobOrder.years_experience_required}+ years` : jobOrder.experience_level || 'Experience not specified'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-neutral-900 dark:text-white">
                        {getBillingDisplay(jobOrder)}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {getPayRangeDisplay(jobOrder)}
                      </div>
                      <div className="text-xs text-neutral-400 dark:text-neutral-500">
                        {jobOrder.rate_type ? jobOrder.rate_type.toUpperCase() : ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${jobOrder.status ? statusColors[jobOrder.status] : 'bg-gray-100 text-gray-800'}`}>
                        {jobOrder.status?.charAt(0).toUpperCase() + jobOrder.status?.slice(1)}
                      </span>
                      {jobOrder.priority_level && (
                        <div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${priorityColors[jobOrder.priority_level]}`}>
                            {jobOrder.priority_level.charAt(0).toUpperCase() + jobOrder.priority_level.slice(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      <div>R: {jobOrder.primary_recruiter_name || 'Unassigned'}</div>
                      <div>AM: {jobOrder.account_manager_name || 'Unassigned'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewPipeline(jobOrder)}
                        className="p-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
                        title="Manage Candidates"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleViewDetails(jobOrder)}
                        className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => jobOrder.id && handleEditJobOrder(jobOrder.id)}
                        className="p-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
                        title="Edit Job Order"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(jobOrder.id || '')}
                        className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                        title="Delete Job Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredJobOrders.length === 0 && (
          <div className="p-8 text-center">
            <Briefcase className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-500 dark:text-neutral-400">No job orders found matching your criteria.</p>
            <button
              onClick={handleAddJobOrder}
              className="mt-4 text-primary hover:text-primary/80 font-medium"
            >
              Create your first job order
            </button>
          </div>
        )}
      </div>

      {/* Job Order Modal */}
      <JobOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        jobOrder={selectedJobOrder}
        onSave={handleModalSave}
      />

      {/* Job Order Details Modal */}
      <JobOrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        jobOrder={detailsJobOrder}
      />

      {/* Job Pipeline Modal */}
      <JobPipelineModal
        isOpen={isPipelineModalOpen}
        onClose={() => setIsPipelineModalOpen(false)}
        jobOrder={pipelineJobOrder}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Delete Job Order
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Are you sure you want to delete this job order? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteConfirm && handleDeleteJobOrder(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};