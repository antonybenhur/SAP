import React, { useState, useEffect } from 'react';
import { Search, Plus, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { candidatesTable } from '../lib/db';
import { CandidateModal } from '../components/Candidates/CandidateModal';
import { CandidateDetailsModal } from '../components/Candidates/CandidateDetailsModal';

type Candidate = Record<string, any>;
type CandidateStatus = 'available' | 'in_process' | 'placed' | 'do_not_contact';

const statusColors: Record<CandidateStatus, string> = {
  available: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  in_process: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  placed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  do_not_contact: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

export const Candidates: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | 'all'>('all');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [detailsCandidate, setDetailsCandidate] = useState<Candidate | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const fetchCandidates = async () => {
    try {
      const data = await candidatesTable.selectAll();
      setCandidates(data);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleAddCandidate = () => {
    setSelectedCandidate(null);
    setIsModalOpen(true);
  };

  const handleEditCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsModalOpen(true);
  };

  const handleViewDetails = (candidate: Candidate) => {
    setDetailsCandidate(candidate);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    try {
      await candidatesTable.delete(candidateId);
      setCandidates(prev => prev.filter(c => c.id !== candidateId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting candidate:', error);
    }
  };

  const handleModalSave = () => {
    fetchCandidates();
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (candidate.skills || []).some((skill: string) => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 min-w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-neutral-900 dark:text-white placeholder:text-neutral-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CandidateStatus | 'all')}
            className="px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-neutral-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="in_process">In Process</option>
            <option value="placed">Placed</option>
            <option value="do_not_contact">Do Not Contact</option>
          </select>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-900 dark:text-white">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button onClick={handleAddCandidate} className="flex items-center space-x-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Photo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Candidate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Primary Skill</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Skills</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Work Auth</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-700">
              {filteredCandidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex-shrink-0 h-12 w-12">
                      {candidate.profile_photo_url ? (
                        <img className="h-12 w-12 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700" src={candidate.profile_photo_url} alt={candidate.name} />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">{candidate.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-neutral-900 dark:text-white">{candidate.name}</div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">{candidate.location}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-neutral-900 dark:text-white">{candidate.email}</div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">{candidate.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-900 dark:text-white">{candidate.primary_skill || 'Not specified'}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">{candidate.experience_years} years exp.</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(candidate.skills || []).slice(0, 3).map((skill: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">{skill}</span>
                      ))}
                      {(candidate.skills || []).length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">+{candidate.skills.length - 3} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900 dark:text-white">{candidate.work_authorization ? candidate.work_authorization.replace('_', ' ').toUpperCase() : 'Not specified'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statusColors[candidate.status as CandidateStatus]}`}>{candidate.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleViewDetails(candidate)} className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors" title="View Details"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleEditCandidate(candidate)} className="p-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteConfirm(candidate.id)} className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCandidates.length === 0 && (
          <div className="p-8 text-center"><p className="text-neutral-500 dark:text-neutral-400">No candidates found matching your criteria.</p></div>
        )}
      </div>

      <CandidateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} candidate={selectedCandidate} onSave={handleModalSave} />
      <CandidateDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} candidate={detailsCandidate} />

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Delete Candidate</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">Are you sure you want to delete this candidate? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
              <button onClick={() => deleteConfirm && handleDeleteCandidate(deleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
