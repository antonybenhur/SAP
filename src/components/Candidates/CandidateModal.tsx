import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Plus, User } from 'lucide-react';
import { candidatesTable, profilesTable } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';

type Candidate = Record<string, any>;

interface CandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate?: Candidate | null;
  onSave: () => void;
}

const statusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'in_process', label: 'In Process' },
  { value: 'placed', label: 'Placed' },
  { value: 'do_not_contact', label: 'Do Not Contact' },
];

const workAuthOptions = [
  { value: 'citizen', label: 'US Citizen' },
  { value: 'green_card', label: 'Green Card' },
  { value: 'h1b', label: 'H1B' },
  { value: 'opt', label: 'OPT' },
  { value: 'tn', label: 'TN Visa' },
  { value: 'l1', label: 'L1 Visa' },
  { value: 'other_visa', label: 'Other Visa' },
  { value: 'needs_sponsorship', label: 'Needs Sponsorship' },
];

const workArrangementOptions = [
  { value: 'remote', label: 'Remote' },
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'flexible', label: 'Flexible' },
];

const relocationOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'open_to_discussion', label: 'Open to Discussion' },
];

const rateTypeOptions = [
  { value: 'w2', label: 'W2' },
  { value: 'c2c', label: 'C2C' },
  { value: '1099', label: '1099' },
  { value: 'salary', label: 'Salary' },
  { value: 'hourly', label: 'Hourly' },
];

const industryOptions = [
  'FinTech', 'Healthcare', 'Retail', 'Manufacturing', 'Technology', 'Banking',
  'Insurance', 'Real Estate', 'Education', 'Government', 'Non-Profit', 'Media',
  'Telecommunications', 'Energy', 'Transportation', 'Consulting', 'Other'
];

const sourceOptions = [
  'LinkedIn', 'Employee Referral', 'Indeed', 'Conference', 'Direct Application',
  'Recruiter Network', 'Job Board', 'Social Media', 'Cold Outreach', 'Other'
];

export const CandidateModal: React.FC<CandidateModalProps> = ({ isOpen, onClose, candidate, onSave }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recruiters, setRecruiters] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({
    name: '', email: '', phone: '', location: '', address: '', linkedin_url: '', portfolio_url: '',
    experience_years: 0, primary_skill: '', skills: [], certifications: [], industry_experience: [],
    work_authorization: null, availability_date: '', notice_period: '', work_arrangement: null, willing_to_relocate: null,
    current_rate: '', expected_rate: '', rate_type: null,
    status: 'available', recruiter_owner: '', source: '', last_contacted_date: '', notes: '',
    resume_url: '', id_card_url: '', profile_photo_url: '',
  });
  const [skillInput, setSkillInput] = useState('');
  const [certificationInput, setCertificationInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) fetchRecruiters();
  }, [isOpen]);

  const fetchRecruiters = async () => {
    try {
      const data = await profilesTable.selectByRole(['recruiter', 'account_manager', 'administrator']);
      setRecruiters(data.map((r: any) => ({ id: r.id, name: r.name })));
    } catch (err) { console.error('Error fetching recruiters:', err); }
  };

  useEffect(() => {
    if (candidate) {
      setFormData({
        name: candidate.name || '', email: candidate.email || '', phone: candidate.phone || '',
        location: candidate.location || '', address: candidate.address || '',
        linkedin_url: candidate.linkedin_url || '', portfolio_url: candidate.portfolio_url || '',
        experience_years: candidate.experience_years || 0, primary_skill: candidate.primary_skill || '',
        skills: candidate.skills || [], certifications: candidate.certifications || [], industry_experience: candidate.industry_experience || [],
        work_authorization: candidate.work_authorization, availability_date: candidate.availability_date || '',
        notice_period: candidate.notice_period || '', work_arrangement: candidate.work_arrangement, willing_to_relocate: candidate.willing_to_relocate,
        current_rate: candidate.current_rate?.toString() || '', expected_rate: candidate.expected_rate?.toString() || '',
        rate_type: candidate.rate_type, status: candidate.status || 'available',
        recruiter_owner: candidate.recruiter_owner || '', source: candidate.source || '',
        last_contacted_date: candidate.last_contacted_date || '', notes: candidate.notes || '',
        resume_url: candidate.resume_url || '', id_card_url: candidate.id_card_url || '', profile_photo_url: candidate.profile_photo_url || '',
      });
    } else {
      setFormData({
        name: '', email: '', phone: '', location: '', address: '', linkedin_url: '', portfolio_url: '',
        experience_years: 0, primary_skill: '', skills: [], certifications: [], industry_experience: [],
        work_authorization: null, availability_date: '', notice_period: '', work_arrangement: null, willing_to_relocate: null,
        current_rate: '', expected_rate: '', rate_type: null,
        status: 'available', recruiter_owner: user?.id || '', source: '', last_contacted_date: '', notes: '',
        resume_url: '', id_card_url: '', profile_photo_url: '',
      });
    }
    setError(''); setActiveTab('personal');
  }, [candidate, isOpen, user]);

  const handleInputChange = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  const addToArray = (field: string, value: string) => {
    if (value.trim() && !formData[field].includes(value.trim())) setFormData(prev => ({ ...prev, [field]: [...prev[field], value.trim()] }));
  };
  const removeFromArray = (field: string, valueToRemove: string) => setFormData(prev => ({ ...prev, [field]: prev[field].filter((item: string) => item !== valueToRemove) }));

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const fileType = event.target.dataset.fileType as 'resume' | 'id_card' | 'profile_photo';
    if (!file || !fileType) return;
    setUploading(true); setError('');
    try {
      const url = URL.createObjectURL(file);
      const fieldName = fileType === 'resume' ? 'resume_url' : fileType === 'id_card' ? 'id_card_url' : 'profile_photo_url';
      setFormData(prev => ({ ...prev, [fieldName]: url }));
    } catch (err: any) { setError(err.message || 'Failed to upload file'); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const candidateData = {
        ...formData,
        current_rate: formData.current_rate ? parseFloat(formData.current_rate) : null,
        expected_rate: formData.expected_rate ? parseFloat(formData.expected_rate) : null,
        availability_date: formData.availability_date || null,
        last_contacted_date: formData.last_contacted_date || null,
        created_by: user?.id,
      };
      if (candidate) { await candidatesTable.update(candidate.id, candidateData); }
      else { await candidatesTable.insert(candidateData); }
      onSave(); onClose();
    } catch (err: any) { setError(err.message || 'Failed to save candidate'); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'personal', label: 'Personal' }, { id: 'professional', label: 'Professional' },
    { id: 'logistics', label: 'Logistics' }, { id: 'compensation', label: 'Compensation' },
    { id: 'internal', label: 'Internal' }, { id: 'documents', label: 'Documents' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{candidate ? 'Edit Candidate' : 'Add New Candidate'}</h2>
          <button onClick={onClose} className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="border-b border-neutral-200 dark:border-neutral-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}>{tab.label}</button>
            ))}
          </nav>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6">
            {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-6">{error}</div>}

            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Full Name *</label><input type="text" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" required /></div>
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Email Address *</label><input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" required /></div>
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Phone Number</label><input type="tel" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" /></div>
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Location</label><input type="text" value={formData.location} onChange={e => handleInputChange('location', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="City, State" /></div>
                </div>
                <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Address</label><textarea value={formData.address} onChange={e => handleInputChange('address', e.target.value)} rows={2} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="Full address" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">LinkedIn Profile URL</label><input type="url" value={formData.linkedin_url} onChange={e => handleInputChange('linkedin_url', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="https://linkedin.com/in/..." /></div>
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Portfolio/GitHub URL</label><input type="url" value={formData.portfolio_url} onChange={e => handleInputChange('portfolio_url', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="https://github.com/..." /></div>
                </div>
              </div>
            )}

            {activeTab === 'professional' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Years of Experience</label><input type="number" min="0" max="50" value={formData.experience_years} onChange={e => handleInputChange('experience_years', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" /></div>
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Primary Skill</label><input type="text" value={formData.primary_skill} onChange={e => handleInputChange('primary_skill', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="e.g., React Development" /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Skills</label>
                  <div className="flex gap-2 mb-3"><input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyPress={e => { if (e.key === 'Enter') { e.preventDefault(); addToArray('skills', skillInput); setSkillInput(''); } }} className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="Add a skill and press Enter" /><button type="button" onClick={() => { addToArray('skills', skillInput); setSkillInput(''); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"><Plus className="w-4 h-4" /></button></div>
                  <div className="flex flex-wrap gap-2">{formData.skills.map((skill: string, index: number) => <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">{skill}<button type="button" onClick={() => removeFromArray('skills', skill)} className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"><X className="w-3 h-3" /></button></span>)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Certifications</label>
                  <div className="flex gap-2 mb-3"><input type="text" value={certificationInput} onChange={e => setCertificationInput(e.target.value)} onKeyPress={e => { if (e.key === 'Enter') { e.preventDefault(); addToArray('certifications', certificationInput); setCertificationInput(''); } }} className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="e.g., AWS Certified Developer" /><button type="button" onClick={() => { addToArray('certifications', certificationInput); setCertificationInput(''); }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"><Plus className="w-4 h-4" /></button></div>
                  <div className="flex flex-wrap gap-2">{formData.certifications.map((cert: string, index: number) => <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">{cert}<button type="button" onClick={() => removeFromArray('certifications', cert)} className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"><X className="w-3 h-3" /></button></span>)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Industry Experience</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{industryOptions.map(industry => <label key={industry} className="flex items-center"><input type="checkbox" checked={formData.industry_experience.includes(industry)} onChange={e => { if (e.target.checked) addToArray('industry_experience', industry); else removeFromArray('industry_experience', industry); }} className="mr-2" /><span className="text-sm text-neutral-700 dark:text-neutral-300">{industry}</span></label>)}</div>
                </div>
              </div>
            )}

            {activeTab === 'logistics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Work Authorization Status</label><select value={formData.work_authorization || ''} onChange={e => handleInputChange('work_authorization', e.target.value || null)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="">Select work authorization</option>{workAuthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Availability Date</label><input type="date" value={formData.availability_date} onChange={e => handleInputChange('availability_date', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" /></div>
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Notice Period</label><input type="text" value={formData.notice_period} onChange={e => handleInputChange('notice_period', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="e.g., 2 weeks" /></div>
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Preferred Work Arrangement</label><select value={formData.work_arrangement || ''} onChange={e => handleInputChange('work_arrangement', e.target.value || null)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="">Select work arrangement</option>{workArrangementOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Willingness to Relocate</label><select value={formData.willing_to_relocate || ''} onChange={e => handleInputChange('willing_to_relocate', e.target.value || null)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="">Select relocation preference</option>{relocationOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                </div>
              </div>
            )}

            {activeTab === 'compensation' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Current Rate/Salary</label><input type="number" step="0.01" value={formData.current_rate} onChange={e => handleInputChange('current_rate', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" /></div>
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Expected Rate/Salary</label><input type="number" step="0.01" value={formData.expected_rate} onChange={e => handleInputChange('expected_rate', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" /></div>
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Rate Type</label><select value={formData.rate_type || ''} onChange={e => handleInputChange('rate_type', e.target.value || null)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="">Select rate type</option>{rateTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                </div>
              </div>
            )}

            {activeTab === 'internal' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Status</label><select value={formData.status} onChange={e => handleInputChange('status', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">{statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Recruiter Owner</label><select value={formData.recruiter_owner} onChange={e => handleInputChange('recruiter_owner', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="">Select recruiter</option>{recruiters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Source</label><select value={formData.source} onChange={e => handleInputChange('source', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="">Select source</option>{sourceOptions.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Last Contacted Date</label><input type="date" value={formData.last_contacted_date} onChange={e => handleInputChange('last_contacted_date', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" /></div>
                </div>
                <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Notes</label><textarea value={formData.notes} onChange={e => handleInputChange('notes', e.target.value)} rows={4} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="Additional notes..." /></div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                {['profile_photo', 'resume', 'id_card'].map(type => {
                  const fieldName = type === 'resume' ? 'resume_url' : type === 'id_card' ? 'id_card_url' : 'profile_photo_url';
                  const label = type === 'resume' ? 'Resume/CV' : type === 'id_card' ? 'ID Card' : 'Profile Photo';
                  const accept = type === 'resume' ? '.pdf,.doc,.docx' : type === 'id_card' ? '.pdf,image/jpeg,image/png' : 'image/jpeg,image/png';
                  return (
                    <div key={type}>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{label}</label>
                      <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-6">
                        {formData[fieldName] ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {type === 'profile_photo' ? <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden mr-3"><img src={formData[fieldName]} alt="Profile" className="w-full h-full object-cover" /></div> : <FileText className="w-8 h-8 text-blue-600 mr-3" />}
                              <div><p className="text-sm font-medium text-neutral-900 dark:text-white">{label} uploaded</p></div>
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => window.open(formData[fieldName], '_blank')} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">View</button>
                              <button type="button" onClick={() => handleInputChange(fieldName, '')} className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">Remove</button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            {type === 'profile_photo' ? <User className="w-12 h-12 text-neutral-400 mx-auto mb-4" /> : <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />}
                            <label className="cursor-pointer"><span className="text-blue-600 hover:text-blue-700 font-medium">{uploading ? 'Uploading...' : 'Click to upload'}</span><input type="file" className="hidden" accept={accept} data-file-type={type} onChange={handleFileUpload} disabled={uploading} /></label>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{loading ? 'Saving...' : candidate ? 'Update Candidate' : 'Add Candidate'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
