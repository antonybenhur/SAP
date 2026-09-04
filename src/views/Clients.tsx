import React, { useState, useEffect } from 'react';
import { Search, Plus, Download, Eye, Edit, Trash2, Building2, Star, Briefcase, AlertTriangle } from 'lucide-react';
import { clientsTable } from '../lib/db';
import { ClientModal } from '../components/Clients/ClientModal';
import { ClientDetailsModal } from '../components/Clients/ClientDetailsModal';

type Client = Record<string, any>;
type ClientStatus = 'active' | 'inactive';
type ClientTier = 'strategic' | 'active' | 'prospect' | 'past_client';

const statusColors: Record<ClientStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  inactive: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

const tierColors: Record<ClientTier, string> = {
  strategic: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  prospect: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  past_client: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
};

export const Clients: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [tierFilter, setTierFilter] = useState<ClientTier | 'all'>('all');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [detailsClient, setDetailsClient] = useState<Client | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const fetchClients = async () => {
    try {
      const data = await clientsTable.selectAll();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = () => { setSelectedClient(null); setIsModalOpen(true); };
  const handleEditClient = (client: Client) => { setSelectedClient(client); setIsModalOpen(true); };
  const handleViewDetails = (client: Client) => { setDetailsClient(client); setIsDetailsModalOpen(true); };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await clientsTable.delete(clientId);
      setClients(prev => prev.filter(c => c.id !== clientId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const handleModalSave = () => { fetchClients(); };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.primary_contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.industry && client.industry.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesTier = tierFilter === 'all' || client.client_tier === tierFilter;
    return matchesSearch && matchesStatus && matchesTier;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 min-w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search clients..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-neutral-900 dark:text-white placeholder:text-neutral-500" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ClientStatus | 'all')}
            className="px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-neutral-900 dark:text-white">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value as ClientTier | 'all')}
            className="px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-neutral-900 dark:text-white">
            <option value="all">All Tiers</option>
            <option value="strategic">Tier 1 (Strategic)</option>
            <option value="active">Tier 2 (Active)</option>
            <option value="prospect">Prospect</option>
            <option value="past_client">Past Client</option>
          </select>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-900 dark:text-white">
            <Download className="w-4 h-4" /><span>Export</span>
          </button>
          <button onClick={handleAddClient} className="flex items-center space-x-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
            <Plus className="w-4 h-4" /><span>Add Client</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500/10 rounded-lg"><Building2 className="w-6 h-6 text-blue-600" /></div>
            <div className="ml-4"><p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Clients</p><p className="text-2xl font-bold text-neutral-900 dark:text-white">{clients.length}</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <div className="p-3 bg-green-500/10 rounded-lg"><Star className="w-6 h-6 text-green-600" /></div>
            <div className="ml-4"><p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Strategic Clients</p><p className="text-2xl font-bold text-neutral-900 dark:text-white">{clients.filter(c => c.client_tier === 'strategic').length}</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <div className="p-3 bg-purple-500/10 rounded-lg"><Briefcase className="w-6 h-6 text-purple-600" /></div>
            <div className="ml-4"><p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Active Job Orders</p><p className="text-2xl font-bold text-neutral-900 dark:text-white">0</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Industry & Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Account Manager</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Tier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Added</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-700">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-900 dark:text-white">{client.company_name}{client.client_tier === 'strategic' && <Star className="w-4 h-4 text-yellow-500 inline ml-2" />}</div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">{client.website || 'No website'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div><div className="text-sm font-medium text-neutral-900 dark:text-white">{client.industry || 'Not specified'}</div><div className="text-sm text-neutral-500 dark:text-neutral-400">{client.primary_contact}</div></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900 dark:text-white">{client.account_owner_profile?.name || 'Not assigned'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${tierColors[client.client_tier as ClientTier]}`}>
                      {client.client_tier === 'strategic' ? 'Tier 1' : client.client_tier === 'active' ? 'Tier 2' : client.client_tier === 'prospect' ? 'Prospect' : 'Past Client'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statusColors[client.status as ClientStatus]}`}>{client.status.charAt(0).toUpperCase() + client.status.slice(1)}</span>
                    {client.msa_status === 'expired' && (<div className="flex items-center mt-1"><AlertTriangle className="w-3 h-3 text-red-500 mr-1" /><span className="text-xs text-red-500">MSA Expired</span></div>)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">{new Date(client.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleViewDetails(client)} className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors" title="View Details"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleEditClient(client)} className="p-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors" title="Edit Client"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteConfirm(client.id)} className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors" title="Delete Client"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredClients.length === 0 && (
          <div className="p-8 text-center"><Building2 className="w-12 h-12 text-neutral-400 mx-auto mb-4" /><p className="text-neutral-500 dark:text-neutral-400">No clients found matching your criteria.</p><button onClick={handleAddClient} className="mt-4 text-primary hover:text-primary/80 font-medium">Add your first client</button></div>
        )}
      </div>

      <ClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} client={selectedClient} onSave={handleModalSave} />
      <ClientDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} client={detailsClient} />

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Delete Client</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">Are you sure you want to delete this client? This action cannot be undone and will also remove all associated job orders.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
              <button onClick={() => deleteConfirm && handleDeleteClient(deleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
