import React, { useState, useEffect } from 'react';
import { X, Building2, User, Mail, Phone, MapPin, AlertCircle, Globe, DollarSign, FileText, Calendar, Users, Settings, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { useAuth } from '../../contexts/AuthContext';

type Client = Database['public']['Tables']['clients']['Row'];
type ClientContact = Database['public']['Tables']['client_contacts']['Row'];
type ClientTier = Database['public']['Enums']['client_tier'];
type PaymentTerms = Database['public']['Enums']['payment_terms'];
type MSAStatus = Database['public']['Enums']['msa_status'];

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSave: () => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  client,
  onSave
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('company');
  const [accountManagers, setAccountManagers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<Partial<ClientContact>[]>([]);
  const [contractFile, setContractFile] = useState<File | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    company_name: '',
    website: '',
    industry: '',
    address: '',
    account_owner: '',
    client_tier: 'prospect' as ClientTier,
    primary_contact: '',
    email: '',
    phone: '',
    billing_address: '',
    payment_terms: 'net_30' as PaymentTerms,
    default_markup_percentage: '',
    primary_tech_stack: [] as string[],
    typical_interview_process: '',
    submission_requirements: '',
    msa_status: 'not_required' as MSAStatus,
    msa_expiration_date: '',
    contract_document_url: '',
    notes: '',
    status: 'active' as const,
  });

  useEffect(() => {
    if (isOpen) {
      fetchAccountManagers();
      if (client) {
        setFormData({
          company_name: client.company_name || '',
          website: client.website || '',
          industry: client.industry || '',
          address: client.address || '',
          account_owner: client.account_owner || '',
          client_tier: client.client_tier || 'prospect',
          primary_contact: client.primary_contact || '',
          email: client.email || '',
          phone: client.phone || '',
          billing_address: client.billing_address || '',
          payment_terms: client.payment_terms || 'net_30',
          default_markup_percentage: client.default_markup_percentage?.toString() || '',
          primary_tech_stack: client.primary_tech_stack || [],
          typical_interview_process: client.typical_interview_process || '',
          submission_requirements: client.submission_requirements || '',
          msa_status: client.msa_status || 'not_required',
          msa_expiration_date: client.msa_expiration_date || '',
          contract_document_url: client.contract_document_url || '',
          notes: client.notes || '',
          status: client.status || 'active',
        });
        fetchClientContacts(client.id);
      } else {
        resetForm();
      }
    }
    setError('');
  }, [client, isOpen]);

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

  const fetchClientContacts = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('client_contacts')
        .select('*')
        .eq('client_id', clientId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      console.error('Error fetching client contacts:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      website: '',
      industry: '',
      address: '',
      account_owner: '',
      client_tier: 'prospect',
      primary_contact: '',
      email: '',
      phone: '',
      billing_address: '',
      payment_terms: 'net_30',
      default_markup_percentage: '',
      primary_tech_stack: [],
      typical_interview_process: '',
      submission_requirements: '',
      msa_status: 'not_required',
      msa_expiration_date: '',
      contract_document_url: '',
      notes: '',
      status: 'active',
    });
    setContacts([{ name: '', role: '', email: '', phone: '', is_primary: true }]);
    setContractFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let contractUrl = formData.contract_document_url;

      // Upload contract document if provided
      if (contractFile) {
        const fileExt = contractFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `contracts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, contractFile);

        if (uploadError) throw uploadError;
        contractUrl = filePath;
      }

      const clientData = {
        ...formData,
        default_markup_percentage: formData.default_markup_percentage ? parseFloat(formData.default_markup_percentage) : null,
        contract_document_url: contractUrl,
        updated_at: new Date().toISOString(),
      };

      let clientId = client?.id;

      if (client) {
        // Update existing client
        const { error: updateError } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', client.id);

        if (updateError) throw updateError;
      } else {
        // Create new client
        const { data: newClient, error: insertError } = await supabase
          .from('clients')
          .insert([clientData])
          .select()
          .single();

        if (insertError) throw insertError;
        clientId = newClient.id;
      }

      // Save contacts
      if (clientId && contacts.length > 0) {
        // Delete existing contacts if updating
        if (client) {
          await supabase
            .from('client_contacts')
            .delete()
            .eq('client_id', clientId);
        }

        // Insert new contacts
        const contactsToInsert = contacts
          .filter(contact => contact.name && contact.email)
          .map(contact => ({
            ...contact,
            client_id: clientId,
          }));

        if (contactsToInsert.length > 0) {
          const { error: contactsError } = await supabase
            .from('client_contacts')
            .insert(contactsToInsert);

          if (contactsError) throw contactsError;
        }
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error saving client:', err);
      setError(err.message || 'Failed to save client');
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

  const handleTechStackChange = (value: string) => {
    const techs = value.split(',').map(tech => tech.trim()).filter(tech => tech);
    setFormData(prev => ({
      ...prev,
      primary_tech_stack: techs
    }));
  };

  const addContact = () => {
    setContacts(prev => [...prev, { name: '', role: '', email: '', phone: '', is_primary: false }]);
  };

  const updateContact = (index: number, field: string, value: any) => {
    setContacts(prev => prev.map((contact, i) => 
      i === index ? { ...contact, [field]: value } : contact
    ));
  };

  const removeContact = (index: number) => {
    setContacts(prev => prev.filter((_, i) => i !== index));
  };

  const handleContractUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setContractFile(file);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'company', label: 'Company Info', icon: Building2 },
    { id: 'account', label: 'Account Management', icon: User },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'financials', label: 'Financials', icon: DollarSign },
    { id: 'operational', label: 'Operational', icon: Settings },
    { id: 'legal', label: 'Legal', icon: FileText },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {client ? 'Edit Client' : 'Add New Client'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {client ? 'Update client information' : 'Add a new client to your database'}
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

          {/* Company Info Tab */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                    placeholder="Enter company name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                    placeholder="e.g., FinTech, Healthcare, Manufacturing"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Website
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                      placeholder="https://company.com"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Physical Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground resize-none"
                      placeholder="Company physical address"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Management Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Account Owner
                  </label>
                  <select
                    value={formData.account_owner}
                    onChange={(e) => handleInputChange('account_owner', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                  >
                    <option value="">Select Account Manager</option>
                    {accountManagers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Client Tier
                  </label>
                  <select
                    value={formData.client_tier}
                    onChange={(e) => handleInputChange('client_tier', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                  >
                    <option value="strategic">Tier 1 (Strategic)</option>
                    <option value="active">Tier 2 (Active)</option>
                    <option value="prospect">Prospect</option>
                    <option value="past_client">Past Client</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Client Contacts</h3>
                <button
                  type="button"
                  onClick={addContact}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Add Contact
                </button>
              </div>

              {contacts.map((contact, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-foreground">Contact {index + 1}</h4>
                    {contacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeContact(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={contact.name || ''}
                        onChange={(e) => updateContact(index, 'name', e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                        placeholder="Contact name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Role *
                      </label>
                      <input
                        type="text"
                        value={contact.role || ''}
                        onChange={(e) => updateContact(index, 'role', e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                        placeholder="e.g., Hiring Manager, Technical Lead"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={contact.email || ''}
                        onChange={(e) => updateContact(index, 'email', e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                        placeholder="contact@company.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={contact.phone || ''}
                        onChange={(e) => updateContact(index, 'phone', e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={contact.is_primary || false}
                          onChange={(e) => updateContact(index, 'is_primary', e.target.checked)}
                          className="rounded border-input"
                        />
                        <span className="text-sm text-foreground">Primary Contact</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Financials Tab */}
          {activeTab === 'financials' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Billing Address
                  </label>
                  <textarea
                    value={formData.billing_address}
                    onChange={(e) => handleInputChange('billing_address', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground resize-none"
                    placeholder="Billing address (if different from physical address)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Payment Terms
                  </label>
                  <select
                    value={formData.payment_terms}
                    onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                  >
                    <option value="net_15">Net 15</option>
                    <option value="net_30">Net 30</option>
                    <option value="net_45">Net 45</option>
                    <option value="net_60">Net 60</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Default Markup %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.default_markup_percentage}
                    onChange={(e) => handleInputChange('default_markup_percentage', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                    placeholder="e.g., 25.00"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Operational Tab */}
          {activeTab === 'operational' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Primary Technology Stack
                </label>
                <input
                  type="text"
                  value={formData.primary_tech_stack.join(', ')}
                  onChange={(e) => handleTechStackChange(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                  placeholder="e.g., Java, React, AWS, Docker (comma-separated)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Typical Interview Process
                </label>
                <textarea
                  value={formData.typical_interview_process}
                  onChange={(e) => handleInputChange('typical_interview_process', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground resize-none"
                  placeholder="e.g., 1. Phone Screen (30 min) → 2. Technical Panel (60 min) → 3. Final with Director (30 min)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Submission Requirements
                </label>
                <textarea
                  value={formData.submission_requirements}
                  onChange={(e) => handleInputChange('submission_requirements', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground resize-none"
                  placeholder="Special resume format, portal requirements, etc."
                />
              </div>
            </div>
          )}

          {/* Legal Tab */}
          {activeTab === 'legal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    MSA Status
                  </label>
                  <select
                    value={formData.msa_status}
                    onChange={(e) => handleInputChange('msa_status', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                  >
                    <option value="not_required">Not Required</option>
                    <option value="signed">Signed</option>
                    <option value="in_negotiation">In Negotiation</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    MSA Expiration Date
                  </label>
                  <input
                    type="date"
                    value={formData.msa_expiration_date}
                    onChange={(e) => handleInputChange('msa_expiration_date', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Contract Document
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleContractUpload}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                  />
                  {formData.contract_document_url && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Current contract: {formData.contract_document_url.split('/').pop()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground resize-none"
                  placeholder="Internal notes about the client, relationship history, preferences, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
              {loading ? 'Saving...' : client ? 'Update Client' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};