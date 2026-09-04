import React, { useState, useEffect } from 'react';
import { X, Edit, Save } from 'lucide-react';
import { profilesTable } from '../../lib/db';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Record<string, any>;
  onUserUpdated: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onUserUpdated }) => {
  const [formData, setFormData] = useState({ name: '', email: '', role: 'consultant' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles = [
    { value: 'administrator', label: 'Administrator' },
    { value: 'account_manager', label: 'Account Manager' },
    { value: 'recruiter', label: 'Recruiter' },
    { value: 'finance', label: 'Finance' },
    { value: 'consultant', label: 'Consultant' },
  ];

  useEffect(() => {
    if (isOpen) { setFormData({ name: user.name || '', email: user.email || '', role: user.role || 'consultant' }); setError(null); }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      await profilesTable.update(user.id, { name: formData.name, email: formData.email, role: formData.role });
      onUserUpdated(); onClose();
    } catch (error: any) { console.error('Error updating user:', error); setError(error.message || 'Failed to update user.'); }
    finally { setLoading(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white flex items-center gap-2"><Edit className="w-5 h-5" />Edit User</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"><p className="text-sm text-red-600 dark:text-red-400">{error}</p></div>}
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Full Name *</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white" /></div>
            <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email Address *</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white" /></div>
            <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Role *</label><select name="role" value={formData.role} onChange={handleInputChange} required className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white">{roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Save className="w-4 h-4" />}{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
