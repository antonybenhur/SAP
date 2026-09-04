import React, { useState, useEffect } from 'react';
import { X, Building2, User, Mail, Phone, MapPin, AlertCircle, Globe, DollarSign, FileText, Calendar, Users, Settings, Activity } from 'lucide-react';
import { clientsTable, clientContactsTable, profilesTable } from '../../lib/db';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Record<string, any> | null;
  onSave: () => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, client, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('company');
  const [accountManagers, setAccountManagers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<Partial<Record<string, any>>[]>([]);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({
    company_name: '', website: '', industry: '', address: '', account_owner: '',
    client_tier: 'prospect', primary_contact: '', email: '', phone: '',
    billing_address: '', payment_terms: 'net_30', default_markup_percentage: '',
    primary_tech_stack: [], typical_interview_process: '', submission_requirements: '',
    msa_status: 'not_required', msa_expiration_date: '', contract_document_url: '',
    notes: '', status: 'active',
  });

  useEffect(() => {
    if (isOpen) {
      fetchAccountManagers();
      if (client) {
        setFormData({
          company_name: client.company_name || '', website: client.website || '', industry: client.industry || '',
          address: client.address || '', account_owner: client.account_owner || '', client_tier: client.client_tier || 'prospect',
          primary_contact: client.primary_contact || '', email: client.email || '', phone: client.phone || '',
          billing_address: client.billing_address || '', payment_terms: client.payment_terms || 'net_30',
          default_markup_percentage: client.default_markup_percentage?.toString() || '', primary_tech_stack: client.primary_tech_stack || [],
          typical_interview_process: client.typical_interview_process || '', submission_requirements: client.submission_requirements || '',
          msa_status: client.msa_status || 'not_required', msa_expiration_date: client.msa_expiration_date || '',
          contract_document_url: client.contract_document_url || '', notes: client.notes || '', status: client.status || 'active',
        });
        fetchClientContacts(client.id);
      } else { resetForm(); }
    }
    setError('');
  }, [client, isOpen]);

  const fetchAccountManagers = async () => {
    try {
      const data = await profilesTable.selectByRole(['administrator', 'account_manager']);
      setAccountManagers(data);
    } catch (err) { console.error('Error fetching account managers:', err); }
  };

  const fetchClientContacts = async (clientId: string) => {
    try {
      const data = await clientContactsTable.selectByClient(clientId);
      setContacts(data.length > 0 ? data : [{ name: '', role: '', email: '', phone: '', is_primary: true }]);
    } catch (err) { console.error('Error fetching client contacts:', err); }
  };

  const resetForm = () => {
    setFormData({
      company_name: '', website: '', industry: '', address: '', account_owner: '', client_tier: 'prospect',
      primary_contact: '', email: '', phone: '', billing_address: '', payment_terms: 'net_30',
      default_markup_percentage: '', primary_tech_stack: [], typical_interview_process: '', submission_requirements: '',
      msa_status: 'not_required', msa_expiration_date: '', contract_document_url: '', notes: '', status: 'active',
    });
    setContacts([{ name: '', role: '', email: '', phone: '', is_primary: true }]);
    setContractFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      let contractUrl = formData.contract_document_url;
      if (contractFile) { contractUrl = URL.createObjectURL(contractFile); }

      const clientData = {
        ...formData,
        default_markup_percentage: formData.default_markup_percentage ? parseFloat(formData.default_markup_percentage) : null,
        contract_document_url: contractUrl,
      };

      let clientId = client?.id;
      if (client) { await clientsTable.update(client.id, clientData); }
      else {
        clientId = crypto.randomUUID();
        await clientsTable.insert({ ...clientData, id: clientId });
      }

      if (clientId && contacts.length > 0) {
        if (client) await clientContactsTable.deleteByClient(clientId);
        for (const contact of contacts) {
          if (contact.name && contact.email) {
            await clientContactsTable.insert({ ...contact, client_id: clientId });
          }
        }
      }

      onSave(); onClose();
    } catch (err: any) { console.error('Error saving client:', err); setError(err.message || 'Failed to save client'); }
    finally { setLoading(false); }
  };

  const handleInputChange = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleTechStackChange = (value: string) => setFormData(prev => ({ ...prev, primary_tech_stack: value.split(',').map(t => t.trim()).filter(Boolean) }));
  const addContact = () => setContacts(prev => [...prev, { name: '', role: '', email: '', phone: '', is_primary: false }]);
  const updateContact = (index: number, field: string, value: any) => setContacts(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  const removeContact = (index: number) => setContacts(prev => prev.filter((_, i) => i !== index));
  const handleContractUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) setContractFile(file); };

  if (!isOpen) return null;

  const tabs = [
    { id: 'company', label: 'Company Info', icon: Building2 }, { id: 'account', label: 'Account Management', icon: User },
    { id: 'contacts', label: 'Contacts', icon: Users }, { id: 'financials', label: 'Financials', icon: DollarSign },
    { id: 'operational', label: 'Operational', icon: Settings }, { id: 'legal', label: 'Legal', icon: FileText },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-3"><div className="p-2 bg-blue-500/10 rounded-lg"><Building2 className="w-6 h-6 text-blue-600" /></div><div><h2 className="text-xl font-bold text-neutral-900 dark:text-white">{client ? 'Edit Client' : 'Add New Client'}</h2><p className="text-sm text-neutral-500 dark:text-neutral-400">{client ? 'Update client information' : 'Add a new client to your database'}</p></div></div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="border-b border-neutral-200 dark:border-neutral-700"><div className="flex overflow-x-auto">{tabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}><Icon className="w-4 h-4" /><span>{tab.label}</span></button>; })}</div></div>
        <form onSubmit={handleSubmit} className="p-6">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center mb-6"><AlertCircle className="w-5 h-5 text-red-500 mr-2" /><span className="text-sm text-red-600">{error}</span></div>}

          {activeTab === 'company' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Company Name *</label><input type="text" value={formData.company_name} onChange={e => handleInputChange('company_name', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" required /></div>
                <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Industry</label><input type="text" value={formData.industry} onChange={e => handleInputChange('industry', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="e.g., FinTech" /></div>
                <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Website</label><div className="relative"><Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><input type="url" value={formData.website} onChange={e => handleInputChange('website', e.target.value)} className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="https://company.com" /></div></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Physical Address</label><div className="relative"><MapPin className="w-4 h-4 absolute left-3 top-3 text-neutral-400" /><textarea value={formData.address} onChange={e => handleInputChange('address', e.target.value)} rows={3} className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none" placeholder="Company physical address" /></div></div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Account Owner</label><select value={formData.account_owner} onChange={e => handleInputChange('account_owner', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="">Select Account Manager</option>{accountManagers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Client Tier</label><select value={formData.client_tier} onChange={e => handleInputChange('client_tier', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="strategic">Tier 1 (Strategic)</option><option value="active">Tier 2 (Active)</option><option value="prospect">Prospect</option><option value="past_client">Past Client</option></select></div>
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between"><h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Client Contacts</h3><button type="button" onClick={addContact} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Add Contact</button></div>
              {contacts.map((contact, index) => (
                <div key={index} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4"><h4 className="font-medium text-neutral-900 dark:text-white">Contact {index + 1}</h4>{contacts.length > 1 && <button type="button" onClick={() => removeContact(index)} className="text-red-600 hover:text-red-800">Remove</button>}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Name *</label><input type="text" value={contact.name || ''} onChange={e => updateContact(index, 'name', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" /></div>
                    <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Role *</label><input type="text" value={contact.role || ''} onChange={e => updateContact(index, 'role', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" /></div>
                    <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Email *</label><input type="email" value={contact.email || ''} onChange={e => updateContact(index, 'email', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" /></div>
                    <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Phone</label><input type="tel" value={contact.phone || ''} onChange={e => updateContact(index, 'phone', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" /></div>
                    <div className="md:col-span-2"><label className="flex items-center space-x-2"><input type="checkbox" checked={contact.is_primary || false} onChange={e => updateContact(index, 'is_primary', e.target.checked)} className="rounded" /><span className="text-sm text-neutral-700 dark:text-neutral-300">Primary Contact</span></label></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'financials' && (
            <div className="space-y-6">
              <div className="md:col-span-2"><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Billing Address</label><textarea value={formData.billing_address} onChange={e => handleInputChange('billing_address', e.target.value)} rows={3} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none" placeholder="Billing address" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Payment Terms</label><select value={formData.payment_terms} onChange={e => handleInputChange('payment_terms', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="net_15">Net 15</option><option value="net_30">Net 30</option><option value="net_45">Net 45</option><option value="net_60">Net 60</option></select></div>
                <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Default Markup %</label><input type="number" step="0.01" min="0" max="100" value={formData.default_markup_percentage} onChange={e => handleInputChange('default_markup_percentage', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="e.g., 25.00" /></div>
              </div>
            </div>
          )}

          {activeTab === 'operational' && (
            <div className="space-y-6">
              <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Primary Technology Stack</label><input type="text" value={formData.primary_tech_stack.join(', ')} onChange={e => handleTechStackChange(e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" placeholder="e.g., Java, React, AWS (comma-separated)" /></div>
              <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Typical Interview Process</label><textarea value={formData.typical_interview_process} onChange={e => handleInputChange('typical_interview_process', e.target.value)} rows={4} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none" placeholder="e.g., 1. Phone Screen → 2. Technical Panel → 3. Final" /></div>
              <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Submission Requirements</label><textarea value={formData.submission_requirements} onChange={e => handleInputChange('submission_requirements', e.target.value)} rows={3} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none" placeholder="Special resume format, portal requirements, etc." /></div>
            </div>
          )}

          {activeTab === 'legal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">MSA Status</label><select value={formData.msa_status} onChange={e => handleInputChange('msa_status', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="not_required">Not Required</option><option value="signed">Signed</option><option value="in_negotiation">In Negotiation</option><option value="expired">Expired</option></select></div>
                <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">MSA Expiration Date</label><input type="date" value={formData.msa_expiration_date} onChange={e => handleInputChange('msa_expiration_date', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Contract Document</label><input type="file" accept=".pdf,.doc,.docx" onChange={handleContractUpload} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white" />{formData.contract_document_url && <p className="text-sm text-neutral-500 mt-2">Current contract: {formData.contract_document_url.split('/').pop()}</p>}</div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Notes</label><textarea value={formData.notes} onChange={e => handleInputChange('notes', e.target.value)} rows={6} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none" placeholder="Internal notes..." /></div>
              <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Status</label><select value={formData.status} onChange={e => handleInputChange('status', e.target.value)} className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-700 mt-8">
            <button type="button" onClick={onClose} className="px-6 py-3 text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">{loading ? 'Saving...' : client ? 'Update Client' : 'Add Client'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
