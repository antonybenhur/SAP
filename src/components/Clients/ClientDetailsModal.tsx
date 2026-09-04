import React, { useState, useEffect } from 'react';
import { X, Building2, User, Mail, Phone, MapPin, Calendar, Activity, Globe, DollarSign, FileText, Users, Settings, AlertTriangle } from 'lucide-react';
import { clientContactsTable, profilesTable } from '../../lib/db';

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Record<string, any> | null;
}

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({ isOpen, onClose, client }) => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [accountManager, setAccountManager] = useState<any>(null);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  useEffect(() => {
    if (client) {
      fetchClientContacts();
      if (client.account_owner) fetchAccountManager();
    }
  }, [client]);

  const fetchClientContacts = async () => {
    if (!isOpen || !client) return;
    try {
      const data = await clientContactsTable.selectByClient(client.id);
      setContacts(data);
    } catch (err) { console.error('Error fetching client contacts:', err); }
  };

  const fetchAccountManager = async () => {
    if (!client?.account_owner) return;
    try {
      const data = await profilesTable.selectById(client.account_owner);
      setAccountManager(data);
    } catch (err) { console.error('Error fetching account manager:', err); }
  };

  const getStatusColor = (status: string) => status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  const getTierColor = (tier: string) => {
    switch (tier) { case 'strategic': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'; case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'; case 'prospect': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'; default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'; }
  };
  const getMSAStatusColor = (status: string) => {
    switch (status) { case 'signed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'; case 'in_negotiation': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'; case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'; default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'; }
  };

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center"><Building2 className="w-8 h-8 text-blue-600" /></div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{client.company_name}</h2>
              <p className="text-neutral-500 dark:text-neutral-400">{client.primary_contact}</p>
              {client.website && <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{client.website}</a>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6 flex items-center"><Building2 className="w-5 h-5 mr-2" />Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3"><User className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">Primary Contact</p><p className="text-neutral-900 dark:text-white">{client.primary_contact}</p></div></div>
              {client.industry && <div className="flex items-center space-x-3"><Building2 className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">Industry</p><p className="text-neutral-900 dark:text-white">{client.industry}</p></div></div>}
              {client.website && <div className="flex items-center space-x-3"><Globe className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">Website</p><a href={client.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{client.website}</a></div></div>}
              {client.address && <div className="md:col-span-2 flex items-start space-x-3"><MapPin className="w-4 h-4 text-neutral-400 mt-1" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">Address</p><p className="text-neutral-900 dark:text-white whitespace-pre-line">{client.address}</p></div></div>}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6 flex items-center"><User className="w-5 h-5 mr-2" />Account Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3"><User className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">Account Manager</p><p className="text-neutral-900 dark:text-white">{accountManager?.name || 'Not assigned'}</p></div></div>
              <div className="flex items-center space-x-3"><Activity className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">Client Tier</p><span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getTierColor(client.client_tier)}`}>{client.client_tier === 'strategic' ? 'Tier 1 (Strategic)' : client.client_tier === 'active' ? 'Tier 2 (Active)' : client.client_tier === 'prospect' ? 'Prospect' : 'Past Client'}</span></div></div>
              <div className="flex items-center space-x-3"><Activity className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">Status</p><span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(client.status)}`}>{client.status.charAt(0).toUpperCase() + client.status.slice(1)}</span></div></div>
            </div>
          </div>
          {contacts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6 flex items-center"><Users className="w-5 h-5 mr-2" />Contacts</h3>
              <div className="space-y-4">{contacts.map(contact => (
                <div key={contact.id} className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2"><h4 className="font-medium text-neutral-900 dark:text-white">{contact.name}</h4>{contact.is_primary && <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">Primary</span>}</div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">{contact.role}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-2"><Mail className="w-3 h-3 text-neutral-400" /><a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">{contact.email}</a></div>
                    {contact.phone && <div className="flex items-center space-x-2"><Phone className="w-3 h-3 text-neutral-400" /><a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">{contact.phone}</a></div>}
                  </div>
                </div>
              ))}</div>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6 flex items-center"><DollarSign className="w-5 h-5 mr-2" />Financial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3"><Calendar className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">Payment Terms</p><p className="text-neutral-900 dark:text-white">{client.payment_terms.replace('_', ' ').toUpperCase()}</p></div></div>
              <div className="flex items-center space-x-3"><DollarSign className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">Default Markup</p><p className="text-neutral-900 dark:text-white">{client.default_markup_percentage ? `${client.default_markup_percentage}%` : 'Not specified'}</p></div></div>
            </div>
          </div>
          {(client.primary_tech_stack?.length > 0 || client.typical_interview_process || client.submission_requirements) && (
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6 flex items-center"><Settings className="w-5 h-5 mr-2" />Operational Details</h3>
              <div className="space-y-4">
                {client.primary_tech_stack?.length > 0 && <div><p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Primary Technology Stack</p><div className="flex flex-wrap gap-2">{client.primary_tech_stack.map((tech: string, index: number) => <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">{tech}</span>)}</div></div>}
                {client.typical_interview_process && <div><p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Typical Interview Process</p><div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3"><p className="text-neutral-900 dark:text-white whitespace-pre-line">{client.typical_interview_process}</p></div></div>}
                {client.submission_requirements && <div><p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Submission Requirements</p><div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3"><p className="text-neutral-900 dark:text-white whitespace-pre-line">{client.submission_requirements}</p></div></div>}
              </div>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6 flex items-center"><FileText className="w-5 h-5 mr-2" />Legal & Contracts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3"><FileText className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">MSA Status</p><span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getMSAStatusColor(client.msa_status)}`}>{client.msa_status.replace('_', ' ')}</span></div></div>
              {client.msa_expiration_date && <div className="flex items-center space-x-3"><Calendar className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-500 dark:text-neutral-400">MSA Expiration</p><p className="text-neutral-900 dark:text-white">{formatDate(client.msa_expiration_date)}</p>{new Date(client.msa_expiration_date) < new Date() && <div className="flex items-center mt-1"><AlertTriangle className="w-3 h-3 text-red-500 mr-1" /><span className="text-xs text-red-500">Expired</span></div>}</div></div>}
              {client.contract_document_url && <div className="md:col-span-2"><p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Contract Document</p><button onClick={() => window.open(client.contract_document_url, '_blank')} className="flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"><FileText className="w-4 h-4" /><span>View Contract</span></button></div>}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6 flex items-center"><Calendar className="w-5 h-5 mr-2" />Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400">Client Since</p><p className="text-neutral-900 dark:text-white">{formatDate(client.created_at)}</p></div>
              <div><p className="text-sm text-neutral-500 dark:text-neutral-400">Last Updated</p><p className="text-neutral-900 dark:text-white">{formatDate(client.updated_at)}</p></div>
            </div>
          </div>
          {client.notes && <div><h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Notes</h3><div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4"><p className="text-neutral-900 dark:text-white whitespace-pre-wrap">{client.notes}</p></div></div>}
        </div>
      </div>
    </div>
  );
};
