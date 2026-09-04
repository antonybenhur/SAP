import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { profilesTable } from '../../lib/db';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onUserCreated }) => {
  const [formData, setFormData] = useState({ email: '', name: '', role: 'consultant', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const roles = [
    { value: 'administrator', label: 'Administrator' },
    { value: 'account_manager', label: 'Account Manager' },
    { value: 'recruiter', label: 'Recruiter' },
    { value: 'finance', label: 'Finance' },
    { value: 'consultant', label: 'Consultant' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      await profilesTable.insert({ email: formData.email, name: formData.name, role: formData.role, password_hash: formData.password || 'password123' });
      setSuccess(true); onUserCreated();
    } catch (error: any) { console.error('Error creating user:', error); setError(error.message || 'Failed to create user.'); }
    finally { setLoading(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleClose = () => { setFormData({ email: '', name: '', role: 'consultant', password: '' }); setSuccess(false); setError(null); onClose(); };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white flex items-center gap-2"><UserPlus className="w-5 h-5" />Create User</h2>
          <button onClick={handleClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"><X className="w-5 h-5" /></button>
        </div>
        {success ? (
          <div className="p-6"><div className="text-center"><div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-green-600 dark:text-green-400" /></div><h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">User Created Successfully!</h3><p className="text-neutral-600 dark:text-neutral-400 mb-4">The user can now sign in with their email and password.</p><button onClick={handleClose} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Close</button></div></div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"><p className="text-sm text-red-600 dark:text-red-400">{error}</p></div>}
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email Address *</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white" placeholder="user@company.com" /></div>
              <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Full Name *</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white" placeholder="John Doe" /></div>
              <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Role *</label><select name="role" value={formData.role} onChange={handleInputChange} required className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white">{roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Password</label><input type="text" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white" placeholder="Default: password123" /></div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={handleClose} className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <UserPlus className="w-4 h-4" />}{loading ? 'Creating...' : 'Create User'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
