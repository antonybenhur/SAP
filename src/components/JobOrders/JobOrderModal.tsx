import React, { useState, useEffect } from 'react';
import { X, Briefcase, Building2, DollarSign, Calendar, Users, AlertCircle, FileText, MapPin, Clock, User, Target, Settings, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { useAuth } from '../../contexts/AuthContext';

type JobOrder = Database['public']['Tables']['job_orders']['Row'];
type JobOrderStatus = Database['public']['Enums']['job_order_status'];
type WorkArrangementType = Database['public']['Enums']['work_arrangement_type'];
type PriorityLevel = Database['public']['Enums']['priority_level'];
type RateType = Database['public']['Enums']['rate_type'];
type ReasonForOpening = Database['public']['Enums']['reason_for_opening'];
type Client = Database['public']['Tables']['clients']['Row'];

interface JobOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobOrder: JobOrder | null;
  onSave: () => void;
}

export const JobOrderModal: React.FC<JobOrderModalProps> = ({
  isOpen,
  onClose,
  jobOrder,
  onSave
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('core');
  const [clients, setClients] = useState<Client[]>([]);
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [accountManagers, setAccountManagers] = useState<any[]>([]);
  
  // Input state for skills
  const [requiredSkillInput, setRequiredSkillInput] = useState('');
  const [niceToHaveSkillInput, setNiceToHaveSkillInput] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    description: '',
    required_skills: [] as string[],
    nice_to_have_skills: [] as string[],
    experience_level: '',
    years_experience_required: '',
    location: '',
    work_arrangement: '' as WorkArrangementType | '',
    duration: '',
    ideal_start_date: '',
    billing_rate: '',
    target_pay_rate_min: '',
    target_pay_rate_max: '',
    rate_type: '' as RateType | '',
    status: 'open' as JobOrderStatus,
    priority_level: 'medium' as PriorityLevel,
    primary_recruiter_id: '',
    account_manager_id: '',
    reason_for_opening: '' as ReasonForOpening | '',
    contract_to_hire_potential: false,
  });

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchRecruiters();
      fetchAccountManagers();
      if (jobOrder) {
        setFormData({
          client_id: jobOrder.client_id || '',
          title: jobOrder.title || '',
          description: jobOrder.description || '',
          required_skills: jobOrder.required_skills || [],
          nice_to_have_skills: jobOrder.nice_to_have_skills || [],
          experience_level: jobOrder.experience_level || '',
          years_experience_required: jobOrder.years_experience_required?.toString() || '',
          location: jobOrder.location || '',
          work_arrangement: jobOrder.work_arrangement || '',
          duration: jobOrder.duration || '',
          ideal_start_date: jobOrder.ideal_start_date || '',
          billing_rate: jobOrder.billing_rate?.toString() || '',
          target_pay_rate_min: jobOrder.target_pay_rate_min?.toString() || '',
          target_pay_rate_max: jobOrder.target_pay_rate_max?.toString() || '',
          rate_type: jobOrder.rate_type || '',
          status: jobOrder.status || 'open',
          priority_level: jobOrder.priority_level || 'medium',
          primary_recruiter_id: jobOrder.primary_recruiter_id || '',
          account_manager_id: jobOrder.account_manager_id || '',
          reason_for_opening: jobOrder.reason_for_opening || '',
          contract_to_hire_potential: jobOrder.contract_to_hire_potential || false,
        });
      } else {
        resetForm();
      }
    }
    setError('');
  }, [jobOrder, isOpen]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, company_name')
        .eq('status', 'active')
        .order('company_name');

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchRecruiters = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('role', ['administrator', 'recruiter'])
        .order('name');

      if (error) throw error;
      setRecruiters(data || []);
    } catch (err) {
      console.error('Error fetching recruiters:', err);
    }
  };

  const fetchAccountManagers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('role', ['administrator', 'account_manager'])
        .order('name');

      if (error) throw error;
      setAccountManagers(data || []);
    } catch (err) {
      console.error('Error fetching account managers:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      title: '',
      description: '',
      required_skills: [],
      nice_to_have_skills: [],
      experience_level: '',
      years_experience_required: '',
      location: '',
      work_arrangement: '',
      duration: '',
      ideal_start_date: '',
      billing_rate: '',
      target_pay_rate_min: '',
      target_pay_rate_max: '',
      rate_type: '',
      status: 'open',
      priority_level: 'medium',
      primary_recruiter_id: '',
      account_manager_id: '',
      reason_for_opening: '',
      contract_to_hire_potential: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const jobOrderData = {
        ...formData,
        billing_rate: formData.billing_rate ? parseFloat(formData.billing_rate) : null,
        target_pay_rate_min: formData.target_pay_rate_min ? parseFloat(formData.target_pay_rate_min) : null,
        target_pay_rate_max: formData.target_pay_rate_max ? parseFloat(formData.target_pay_rate_max) : null,
        years_experience_required: formData.years_experience_required ? parseInt(formData.years_experience_required) : null,
        work_arrangement: formData.work_arrangement || null,
        rate_type: formData.rate_type || null,
        reason_for_opening: formData.reason_for_opening || null,
        primary_recruiter_id: formData.primary_recruiter_id || null,
        account_manager_id: formData.account_manager_id || null,
        created_by: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (jobOrder) {
        // Update existing job order
        const { error: updateError } = await supabase
          .from('job_orders')
          .update(jobOrderData)
          .eq('id', jobOrder.id);

        if (updateError) throw updateError;
      } else {
        // Create new job order
        const { error: insertError } = await supabase
          .from('job_orders')
          .insert([jobOrderData]);

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error saving job order:', err);
      setError(err.message || 'Failed to save job order');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addToSkillsArray = (field: 'required_skills' | 'nice_to_have_skills', value: string) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  const removeFromSkillsArray = (field: 'required_skills' | 'nice_to_have_skills', valueToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(skill => skill !== valueToRemove)
    }));
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'core', label: 'Core Details', icon: Briefcase },
    { id: 'requirements', label: 'Requirements', icon: Target },
    { id: 'logistics', label: 'Logistics', icon: MapPin },
    { id: 'financials', label: 'Financials', icon: DollarSign },
    { id: 'internal', label: 'Internal', icon: Users },
    { id: 'context', label: 'Context', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {jobOrder ? 'Edit Job Order' : 'Create New Job Order'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {jobOrder ? 'Update job order details' : 'Add a new job order to the system'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-neutral-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center mb-6">
              <AlertCircle className="w-5 h-5 text-destructive mr-2" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          {/* Core Details Tab */}
          {activeTab === 'core' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Client *
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) => handleInputChange('client_id', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                  placeholder="e.g., Senior React Developer"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Job Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground resize-none"
                  placeholder="Detailed job description, responsibilities, and requirements..."
                />
              </div>
            </div>
          )}

          {/* Requirements Tab */}
          {activeTab === 'requirements' && (
            <div className="space-y-6">
                              <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Required Skills *
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={requiredSkillInput}
                      onChange={(e) => setRequiredSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToSkillsArray('required_skills', requiredSkillInput), setRequiredSkillInput(''))}
                      className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder:text-muted-foreground"
                      placeholder="Add a skill and press Enter"
                    />
                    <button
                      type="button"
                      onClick={() => {addToSkillsArray('required_skills', requiredSkillInput); setRequiredSkillInput('');}}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.required_skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeFromSkillsArray('required_skills', skill)}
                          className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nice-to-Have Skills
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={niceToHaveSkillInput}
                    onChange={(e) => setNiceToHaveSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToSkillsArray('nice_to_have_skills', niceToHaveSkillInput), setNiceToHaveSkillInput(''))}
                    className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder:text-muted-foreground"
                    placeholder="Add a skill and press Enter"
                  />
                  <button
                    type="button"
                    onClick={() => {addToSkillsArray('nice_to_have_skills', niceToHaveSkillInput); setNiceToHaveSkillInput('');}}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.nice_to_have_skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeFromSkillsArray('nice_to_have_skills', skill)}
                        className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Skills that are a bonus but not mandatory
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Years of Experience Required
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={formData.years_experience_required}
                    onChange={(e) => handleInputChange('years_experience_required', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                    placeholder="e.g., 5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Experience Level
                  </label>
                  <select
                    value={formData.experience_level}
                    onChange={(e) => handleInputChange('experience_level', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                  >
                    <option value="">Select level</option>
                    <option value="Entry Level">Entry Level</option>
                    <option value="Mid Level">Mid Level</option>
                    <option value="Senior Level">Senior Level</option>
                    <option value="Lead Level">Lead Level</option>
                    <option value="Executive Level">Executive Level</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Logistics Tab */}
          {activeTab === 'logistics' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                  placeholder="e.g., New York, NY or Remote"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Work Arrangement
                  </label>
                  <select
                    value={formData.work_arrangement}
                    onChange={(e) => handleInputChange('work_arrangement', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                  >
                    <option value="">Select arrangement</option>
                    <option value="on_site">On-site</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="remote">Fully Remote</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Duration
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                  >
                    <option value="">Select duration</option>
                    <option value="3 months">3 months</option>
                    <option value="6 months">6 months</option>
                    <option value="12 months">12 months</option>
                    <option value="18 months">18 months</option>
                    <option value="24 months">24 months</option>
                    <option value="Permanent">Permanent</option>
                    <option value="Contract-to-Hire">Contract-to-Hire</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Ideal Start Date
                </label>
                <input
                  type="date"
                  value={formData.ideal_start_date}
                  onChange={(e) => handleInputChange('ideal_start_date', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                />
              </div>
            </div>
          )}

          {/* Financials Tab */}
          {activeTab === 'financials' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Billing Structure
                </label>
                <select
                  value={formData.billing_structure}
                  onChange={(e) => handleInputChange('billing_structure', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                >
                  <option value="hourly">Hourly Billing</option>
                  <option value="monthly">Monthly Billing</option>
                  <option value="project_based">Project-Based</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  How you will bill the client for this position
                </p>
              </div>

              {/* Hourly Billing Fields */}
              {formData.billing_structure === 'hourly' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <DollarSign className="w-4 h-4 inline mr-2" />
                      Billing Rate ($/hour)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.billing_rate}
                      onChange={(e) => handleInputChange('billing_rate', e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                      placeholder="e.g., 85.00"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      What you charge the client per hour
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Target Pay Rate Range ($/hour)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.target_pay_rate_min}
                          onChange={(e) => handleInputChange('target_pay_rate_min', e.target.value)}
                          className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                          placeholder="Min hourly rate"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.target_pay_rate_max}
                          onChange={(e) => handleInputChange('target_pay_rate_max', e.target.value)}
                          className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                          placeholder="Max hourly rate"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      What you plan to pay the candidate per hour
                    </p>
                  </div>
                </>
              )}

              {/* Monthly Billing Fields */}
              {formData.billing_structure === 'monthly' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <DollarSign className="w-4 h-4 inline mr-2" />
                      Monthly Billing Rate ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.monthly_billing_rate}
                      onChange={(e) => handleInputChange('monthly_billing_rate', e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                      placeholder="e.g., 15000.00"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      What you charge the client per month
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Target Monthly Pay Range ($)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.monthly_target_pay_min}
                          onChange={(e) => handleInputChange('monthly_target_pay_min', e.target.value)}
                          className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                          placeholder="Min monthly pay"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.monthly_target_pay_max}
                          onChange={(e) => handleInputChange('monthly_target_pay_max', e.target.value)}
                          className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                          placeholder="Max monthly pay"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      What you plan to pay the candidate per month
                    </p>
                  </div>
                </>
              )}

              {/* Project-Based Billing Fields */}
              {formData.billing_structure === 'project_based' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Total Project Value ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.project_total_value}
                    onChange={(e) => handleInputChange('project_total_value', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                    placeholder="e.g., 50000.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Total value of the project contract
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Rate Type
                </label>
                <select
                  value={formData.rate_type}
                  onChange={(e) => handleInputChange('rate_type', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                >
                  <option value="">Select rate type</option>
                  <option value="w2">W2</option>
                  <option value="c2c">Corp-to-Corp</option>
                  <option value="1099">1099</option>
                </select>
              </div>
            </div>
          )}

          {/* Internal Tab */}
          {activeTab === 'internal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                  >
                    <option value="open">Open</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="filled">Filled</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority_level}
                    onChange={(e) => handleInputChange('priority_level', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Primary Recruiter
                  </label>
                  <select
                    value={formData.primary_recruiter_id}
                    onChange={(e) => handleInputChange('primary_recruiter_id', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                  >
                    <option value="">Select recruiter</option>
                    {recruiters.map((recruiter) => (
                      <option key={recruiter.id} value={recruiter.id}>
                        {recruiter.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Account Manager
                  </label>
                  <select
                    value={formData.account_manager_id}
                    onChange={(e) => handleInputChange('account_manager_id', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                  >
                    <option value="">Select account manager</option>
                    {accountManagers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Context Tab */}
          {activeTab === 'context' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Reason for Opening
                </label>
                <select
                  value={formData.reason_for_opening}
                  onChange={(e) => handleInputChange('reason_for_opening', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                >
                  <option value="">Select reason</option>
                  <option value="new_project">New Project</option>
                  <option value="backfill">Backfill</option>
                  <option value="team_growth">Team Growth</option>
                  <option value="expansion">Expansion</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.contract_to_hire_potential}
                    onChange={(e) => handleInputChange('contract_to_hire_potential', e.target.checked)}
                    className="rounded border-input"
                  />
                  <span className="text-sm text-foreground">Contract-to-Hire Potential</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Check if this position has potential to convert to permanent
                </p>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-muted-foreground border border-input rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Saving...' : jobOrder ? 'Update Job Order' : 'Create Job Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};