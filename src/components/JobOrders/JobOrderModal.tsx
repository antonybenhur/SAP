import React, { useState, useEffect } from 'react';
import { X, Briefcase, Building2, DollarSign, Calendar, Users, AlertCircle, FileText, MapPin, Clock, User, Target, Settings, Plus } from 'lucide-react';
import { jobOrdersTable, clientsTable, profilesTable } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';

interface JobOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobOrder: Record<string, any> | null;
  onSave: () => void;
}

export const JobOrderModal: React.FC<JobOrderModalProps> = ({ isOpen, onClose, jobOrder, onSave }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('core');
  const [clients, setClients] = useState<any[]>([]);
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [accountManagers, setAccountManagers] = useState<any[]>([]);
  const [requiredSkillInput, setRequiredSkillInput] = useState('');
  const [niceToHaveSkillInput, setNiceToHaveSkillInput] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({
    client_id: '', title: '', description: '', required_skills: [], nice_to_have_skills: [],
    experience_level: '', years_experience_required: '', location: '', work_arrangement: '',
    duration: '', ideal_start_date: '', billing_rate: '', billing_structure: 'hourly',
    monthly_billing_rate: '', project_total_value: '', monthly_target_pay_min: '', monthly_target_pay_max: '',
    target_pay_rate_min: '', target_pay_rate_max: '', rate_type: '', status: 'open',
    priority_level: 'medium', primary_recruiter_id: '', account_manager_id: '',
    reason_for_opening: '', contract_to_hire_potential: false,
  });

  useEffect(() => {
    if (isOpen) {
      fetchClients(); fetchRecruiters(); fetchAccountManagers();
      if (jobOrder) {
        setFormData({
          client_id: jobOrder.client_id || '', title: jobOrder.title || '', description: jobOrder.description || '',
          required_skills: jobOrder.required_skills || [], nice_to_have_skills: jobOrder.nice_to_have_skills || [],
          experience_level: jobOrder.experience_level || '', years_experience_required: jobOrder.years_experience_required?.toString() || '',
          location: jobOrder.location || '', work_arrangement: jobOrder.work_arrangement || '', duration: jobOrder.duration || '',
          ideal_start_date: jobOrder.ideal_start_date || '', billing_rate: jobOrder.billing_rate?.toString() || '',
          billing_structure: jobOrder.billing_structure || 'hourly', monthly_billing_rate: jobOrder.monthly_billing_rate?.toString() || '',
          project_total_value: jobOrder.project_total_value?.toString() || '', monthly_target_pay_min: jobOrder.monthly_target_pay_min?.toString() || '',
          monthly_target_pay_max: jobOrder.monthly_target_pay_max?.toString() || '', target_pay_rate_min: jobOrder.target_pay_rate_min?.toString() || '',
          target_pay_rate_max: jobOrder.target_pay_rate_max?.toString() || '', rate_type: jobOrder.rate_type || '',
          status: jobOrder.status || 'open', priority_level: jobOrder.priority_level || 'medium',
          primary_recruiter_id: jobOrder.primary_recruiter_id || '', account_manager_id: jobOrder.account_manager_id || '',
          reason_for_opening: jobOrder.reason_for_opening || '', contract_to_hire_potential: jobOrder.contract_to_hire_potential || false,
        });
      } else { resetForm(); }
    }
    setError('');
  }, [jobOrder, isOpen]);

  const fetchClients = async () => { try { const data = await clientsTable.selectAll(); setClients(data.filter(c => c.status === 'active')); } catch (err) { console.error(err); } };
  const fetchRecruiters = async () => { try { const data = await profilesTable.selectByRole(['administrator', 'recruiter']); setRecruiters(data); } catch (err) { console.error(err); } };
  const fetchAccountManagers = async () => { try { const data = await profilesTable.selectByRole(['administrator', 'account_manager']); setAccountManagers(data); } catch (err) { console.error(err); } };

  const resetForm = () => {
    setFormData({ client_id: '', title: '', description: '', required_skills: [], nice_to_have_skills: [], experience_level: '', years_experience_required: '', location: '', work_arrangement: '', duration: '', ideal_start_date: '', billing_rate: '', billing_structure: 'hourly', monthly_billing_rate: '', project_total_value: '', monthly_target_pay_min: '', monthly_target_pay_max: '', target_pay_rate_min: '', target_pay_rate_max: '', rate_type: '', status: 'open', priority_level: 'medium', primary_recruiter_id: '', account_manager_id: '', reason_for_opening: '', contract_to_hire_potential: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const jobOrderData = {
        ...formData,
        billing_rate: formData.billing_rate ? parseFloat(formData.billing_rate) : null,
        target_pay_rate_min: formData.target_pay_rate_min ? parseFloat(formData.target_pay_rate_min) : null,
        target_pay_rate_max: formData.target_pay_rate_max ? parseFloat(formData.target_pay_rate_max) : null,
        monthly_billing_rate: formData.monthly_billing_rate ? parseFloat(formData.monthly_billing_rate) : null,
        project_total_value: formData.project_total_value ? parseFloat(formData.project_total_value) : null,
        monthly_target_pay_min: formData.monthly_target_pay_min ? parseFloat(formData.monthly_target_pay_min) : null,
        monthly_target_pay_max: formData.monthly_target_pay_max ? parseFloat(formData.monthly_target_pay_max) : null,
        years_experience_required: formData.years_experience_required ? parseInt(formData.years_experience_required) : null,
        work_arrangement: formData.work_arrangement || null, rate_type: formData.rate_type || null,
        reason_for_opening: formData.reason_for_opening || null, primary_recruiter_id: formData.primary_recruiter_id || null,
        account_manager_id: formData.account_manager_id || null, created_by: user?.id,
      };
      if (jobOrder) { await jobOrdersTable.update(jobOrder.id, jobOrderData); }
      else { await jobOrdersTable.insert(jobOrderData); }
      onSave(); onClose();
    } catch (err: any) { console.error('Error saving job order:', err); setError(err.message || 'Failed to save job order'); }
    finally { setLoading(false); }
  };

  const handleInputChange = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
  const addToSkillsArray = (field: string, value: string) => { if (value.trim() && !formData[field].includes(value.trim())) setFormData(prev => ({ ...prev, [field]: [...prev[field], value.trim()] })); };
  const removeFromSkillsArray = (field: string, valueToRemove: string) => setFormData(prev => ({ ...prev, [field]: prev[field].filter((s: string) => s !== valueToRemove) }));

  if (!isOpen) return null;

  const tabs = [
    { id: 'core', label: 'Core Details', icon: Briefcase }, { id: 'requirements', label: 'Requirements', icon: Target },
    { id: 'logistics', label: 'Logistics', icon: MapPin }, { id: 'financials', label: 'Financials', icon: DollarSign },
    { id: 'internal', label: 'Internal', icon: Users }, { id: 'context', label: 'Context', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-3"><div className="p-2 bg-blue-500/10 rounded-lg"><Briefcase className="w-6 h-6 text-blue-600" /></div><div><h2 className="text-xl font-bold text-neutral-900 dark:text-white">{jobOrder ? 'Edit Job Order' : 'Create New Job Order'}</h2><p className="text-sm text-neutral-500 dark:text-neutral-400">{jobOrder ? 'Update job order details' : 'Add a new job order'}</p></div></div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="border-b border-neutral-200 dark:border-neutral-700"><div className="flex overflow-x-auto">{tabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}><Icon className="w-4 h-4" /><span>{tab.label}</span></button>; })}</div></div>
        <form onSubmit={handleSubmit} className="p-6">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center mb-6"><AlertCircle className="w-5 h-5 text-red-500 mr-2" /><span className="text-sm text-red-600">{error}</span></div>}

          {activeTab === 'core' && (
            <div className="space-y-6">
              <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"><Building2 className="w-4 h-4 inline mr-2" />Client *</label><select value={formData.client_id} onChange={e => handleInputChange('client_id', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" required><option value="">Select a client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Job Title *</label><input type="text" value={formData.title} onChange={e => handleInputChange('title', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="e.g., Senior React Developer" required /></div>
              <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"><FileText className="w-4 h-4 inline mr-2" />Job Description</label><textarea value={formData.description} onChange={e => handleInputChange('description', e.target.value)} rows={6} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none" placeholder="Detailed job description..." /></div>
            </div>
          )}

          {activeTab === 'requirements' && (
            <div className="space-y-6">
              <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Required Skills *</label><div className="flex gap-2 mb-3"><input type="text" value={requiredSkillInput} onChange={e => setRequiredSkillInput(e.target.value)} onKeyPress={e => { if (e.key === 'Enter') { e.preventDefault(); addToSkillsArray('required_skills', requiredSkillInput); setRequiredSkillInput(''); } }} className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="Add a skill and press Enter" /><button type="button" onClick={() => { addToSkillsArray('required_skills', requiredSkillInput); setRequiredSkillInput(''); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"><Plus className="w-4 h-4" /></button></div><div className="flex flex-wrap gap-2">{formData.required_skills.map((skill: string, index: number) => <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">{skill}<button type="button" onClick={() => removeFromSkillsArray('required_skills', skill)} className="ml-2"><X className="w-3 h-3" /></button></span>)}</div></div>
              <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Nice-to-Have Skills</label><div className="flex gap-2 mb-3"><input type="text" value={niceToHaveSkillInput} onChange={e => setNiceToHaveSkillInput(e.target.value)} onKeyPress={e => { if (e.key === 'Enter') { e.preventDefault(); addToSkillsArray('nice_to_have_skills', niceToHaveSkillInput); setNiceToHaveSkillInput(''); } }} className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="Add a skill and press Enter" /><button type="button" onClick={() => { addToSkillsArray('nice_to_have_skills', niceToHaveSkillInput); setNiceToHaveSkillInput(''); }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"><Plus className="w-4 h-4" /></button></div><div className="flex flex-wrap gap-2">{formData.nice_to_have_skills.map((skill: string, index: number) => <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">{skill}<button type="button" onClick={() => removeFromSkillsArray('nice_to_have_skills', skill)} className="ml-2"><X className="w-3 h-3" /></button></span>)}</div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Years of Experience Required</label><input type="number" min="0" max="30" value={formData.years_experience_required} onChange={e => handleInputChange('years_experience_required', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="e.g., 5" /></div>
                <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Experience Level</label><select value={formData.experience_level} onChange={e => handleInputChange('experience_level', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="">Select level</option><option value="Entry Level">Entry Level</option><option value="Mid Level">Mid Level</option><option value="Senior Level">Senior Level</option><option value="Lead Level">Lead Level</option><option value="Executive Level">Executive Level</option></select></div>
              </div>
            </div>
          )}

          {activeTab === 'logistics' && (
            <div className="space-y-6">
              <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"><MapPin className="w-4 h-4 inline mr-2" />Location</label><input type="text" value={formData.location} onChange={e => handleInputChange('location', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="e.g., New York, NY or Remote" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Work Arrangement</label><select value={formData.work_arrangement} onChange={e => handleInputChange('work_arrangement', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="">Select arrangement</option><option value="on_site">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Fully Remote</option></select></div>
                <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"><Calendar className="w-4 h-4 inline mr-2" />Duration</label><select value={formData.duration} onChange={e => handleInputChange('duration', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="">Select duration</option><option value="3 months">3 months</option><option value="6 months">6 months</option><option value="12 months">12 months</option><option value="18 months">18 months</option><option value="24 months">24 months</option><option value="Permanent">Permanent</option><option value="Contract-to-Hire">Contract-to-Hire</option></select></div>
              </div>
              <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"><Clock className="w-4 h-4 inline mr-2" />Ideal Start Date</label><input type="date" value={formData.ideal_start_date} onChange={e => handleInputChange('ideal_start_date', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" /></div>
            </div>
          )}

          {activeTab === 'financials' && (
            <div className="space-y-6">
              <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Billing Structure</label><select value={formData.billing_structure} onChange={e => handleInputChange('billing_structure', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="hourly">Hourly Billing</option><option value="monthly">Monthly Billing</option><option value="project_based">Project-Based</option></select></div>
              {formData.billing_structure === 'hourly' && (<><div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"><DollarSign className="w-4 h-4 inline mr-2" />Billing Rate ($/hour)</label><input type="number" step="0.01" min="0" value={formData.billing_rate} onChange={e => handleInputChange('billing_rate', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="e.g., 85.00" /></div><div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Target Pay Rate Range ($/hour)</label><div className="grid grid-cols-2 gap-4"><input type="number" step="0.01" min="0" value={formData.target_pay_rate_min} onChange={e => handleInputChange('target_pay_rate_min', e.target.value)} className="px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="Min" /><input type="number" step="0.01" min="0" value={formData.target_pay_rate_max} onChange={e => handleInputChange('target_pay_rate_max', e.target.value)} className="px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="Max" /></div></div></>)}
              {formData.billing_structure === 'monthly' && (<><div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"><DollarSign className="w-4 h-4 inline mr-2" />Monthly Billing Rate ($)</label><input type="number" step="0.01" min="0" value={formData.monthly_billing_rate} onChange={e => handleInputChange('monthly_billing_rate', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="e.g., 15000.00" /></div><div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Target Monthly Pay Range ($)</label><div className="grid grid-cols-2 gap-4"><input type="number" step="0.01" min="0" value={formData.monthly_target_pay_min} onChange={e => handleInputChange('monthly_target_pay_min', e.target.value)} className="px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="Min" /><input type="number" step="0.01" min="0" value={formData.monthly_target_pay_max} onChange={e => handleInputChange('monthly_target_pay_max', e.target.value)} className="px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="Max" /></div></div></>)}
              {formData.billing_structure === 'project_based' && <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"><DollarSign className="w-4 h-4 inline mr-2" />Total Project Value ($)</label><input type="number" step="0.01" min="0" value={formData.project_total_value} onChange={e => handleInputChange('project_total_value', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="e.g., 50000.00" /></div>}
              <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Rate Type</label><select value={formData.rate_type} onChange={e => handleInputChange('rate_type', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="">Select rate type</option><option value="w2">W2</option><option value="c2c">Corp-to-Corp</option><option value="1099">1099</option></select></div>
            </div>
          )}

          {activeTab === 'internal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Status</label><select value={formData.status} onChange={e => handleInputChange('status', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="open">Open</option><option value="interviewing">Interviewing</option><option value="filled">Filled</option><option value="closed">Closed</option></select></div>
                <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Priority Level</label><select value={formData.priority_level} onChange={e => handleInputChange('priority_level', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"><User className="w-4 h-4 inline mr-2" />Primary Recruiter</label><select value={formData.primary_recruiter_id} onChange={e => handleInputChange('primary_recruiter_id', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="">Select recruiter</option>{recruiters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"><User className="w-4 h-4 inline mr-2" />Account Manager</label><select value={formData.account_manager_id} onChange={e => handleInputChange('account_manager_id', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="">Select account manager</option>{accountManagers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
              </div>
            </div>
          )}

          {activeTab === 'context' && (
            <div className="space-y-6">
              <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Reason for Opening</label><select value={formData.reason_for_opening} onChange={e => handleInputChange('reason_for_opening', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="">Select reason</option><option value="new_project">New Project</option><option value="backfill">Backfill</option><option value="team_growth">Team Growth</option><option value="expansion">Expansion</option></select></div>
              <div><label className="flex items-center space-x-2"><input type="checkbox" checked={formData.contract_to_hire_potential} onChange={e => handleInputChange('contract_to_hire_potential', e.target.checked)} className="rounded" /><span className="text-sm text-neutral-700 dark:text-neutral-300">Contract-to-Hire Potential</span></label></div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-700 mt-8">
            <button type="button" onClick={onClose} className="px-6 py-3 text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">{loading ? 'Saving...' : jobOrder ? 'Update Job Order' : 'Create Job Order'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
