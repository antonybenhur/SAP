import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Check, X, Eye, AlertCircle, Plus, Pencil, Trash2, Send, FileText } from 'lucide-react';
import { timesheetsTable, timesheetEntriesTable } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { TimesheetModal } from '../components/Timesheets/TimesheetModal';

type TimesheetWithDetails = Record<string, any>;
type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

const statusColors: Record<TimesheetStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

const statusIcons: Record<TimesheetStatus, React.ReactNode> = {
  draft: <Clock className="w-4 h-4" />,
  submitted: <AlertCircle className="w-4 h-4" />,
  approved: <Check className="w-4 h-4" />,
  rejected: <X className="w-4 h-4" />,
};

export const Timesheets: React.FC = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<TimesheetStatus | 'all'>('all');
  const [timesheets, setTimesheets] = useState<TimesheetWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<Record<string, any> | null>(null);
  const [selectedTimesheet, setSelectedTimesheet] = useState<TimesheetWithDetails | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TimesheetWithDetails | null>(null);
  const [rejectModal, setRejectModal] = useState<TimesheetWithDetails | null>(null);
  const [rejectComments, setRejectComments] = useState('');
  const [viewingEntries, setViewingEntries] = useState<Record<string, any>[]>([]);

  const fetchTimesheets = useCallback(async () => {
    try {
      const data = await timesheetsTable.selectAllWithDetails();
      setTimesheets(data);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTimesheets(); }, [fetchTimesheets]);

  const filteredTimesheets = timesheets.filter(t => statusFilter === 'all' || t.status === statusFilter);
  const canApprove = user?.role === 'account_manager' || user?.role === 'administrator';
  const canManage = canApprove;
  const isConsultant = user?.role === 'consultant';

  const handleApprove = async (id: string) => {
    await timesheetsTable.updateStatus(id, 'approved');
    fetchTimesheets();
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    await timesheetsTable.updateStatus(rejectModal.id, 'rejected', rejectComments);
    setRejectModal(null);
    setRejectComments('');
    fetchTimesheets();
  };

  const handleSubmit = async (id: string) => {
    await timesheetsTable.updateStatus(id, 'submitted');
    fetchTimesheets();
  };

  const handleDelete = async (id: string) => {
    await timesheetsTable.delete(id);
    setDeleteConfirm(null);
    fetchTimesheets();
  };

  const openCreate = () => {
    setEditingTimesheet(null);
    setModalOpen(true);
  };

  const openEdit = async (ts: TimesheetWithDetails) => {
    const entries = await timesheetEntriesTable.selectByTimesheet(ts.id);
    setEditingTimesheet({ ...ts, _entries: entries });
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TimesheetStatus | 'all')}
            className="px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-neutral-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Timesheet</span>
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-500/10 rounded-lg"><AlertCircle className="w-6 h-6 text-yellow-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Pending</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{timesheets.filter(t => t.status === 'submitted').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <div className="p-3 bg-green-500/10 rounded-lg"><Check className="w-6 h-6 text-green-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Approved</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{timesheets.filter(t => t.status === 'approved').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <div className="p-3 bg-red-500/10 rounded-lg"><X className="w-6 h-6 text-red-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Rejected</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{timesheets.filter(t => t.status === 'rejected').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500/10 rounded-lg"><Clock className="w-6 h-6 text-blue-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Approved Hours</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{timesheets.filter(t => t.status === 'approved').reduce((sum, t) => sum + (t.hours || 0), 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timesheets table */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Consultant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-700">
              {filteredTimesheets.map((ts) => (
                <tr key={ts.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-900 dark:text-white">{ts.consultant_name || `Consultant #${ts.consultant_id}`}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">{ts.job_title || `Job #${ts.job_order_id}`}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                    {ts.week_ending ? new Date(ts.week_ending).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">{ts.hours} hrs</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${ts.status ? statusColors[ts.status as TimesheetStatus] : 'bg-gray-100 text-gray-800'}`}>
                      {ts.status && statusIcons[ts.status as TimesheetStatus]}
                      <span className="ml-1 capitalize">{ts.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                    {ts.submitted_at ? new Date(ts.submitted_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <button onClick={async () => { setViewingEntries(await timesheetEntriesTable.selectByTimesheet(ts.id)); setSelectedTimesheet(ts); }} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors" title="View details">
                        <Eye className="w-4 h-4" />
                      </button>
                      {(ts.status === 'draft' || isConsultant) && ts.status !== 'approved' && ts.status !== 'submitted' && (
                        <button onClick={() => openEdit(ts)} className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {canManage && ts.status !== 'approved' && ts.status !== 'submitted' && (
                        <button onClick={() => openEdit(ts)} className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {ts.status === 'draft' && (
                        <button onClick={() => handleSubmit(ts.id)} className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md transition-colors" title="Submit for approval">
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      {canApprove && ts.status === 'submitted' && (
                        <>
                          <button onClick={() => handleApprove(ts.id)} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors" title="Approve">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setRejectModal(ts); setRejectComments(''); }} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Reject">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {ts.status !== 'approved' && (
                        <button onClick={() => setDeleteConfirm(ts)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTimesheets.length === 0 && (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
            <p className="text-neutral-500 dark:text-neutral-400">No timesheets found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      <TimesheetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        timesheet={editingTimesheet}
        onSave={fetchTimesheets}
      />

      {/* View details modal */}
      {selectedTimesheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="ts-details-title">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-neutral-200 pb-4 dark:border-neutral-700">
              <div>
                <h2 id="ts-details-title" className="text-xl font-semibold text-neutral-900 dark:text-white">Timesheet Details</h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{selectedTimesheet.consultant_name || `Consultant #${selectedTimesheet.consultant_id}`}</p>
              </div>
              <button onClick={() => setSelectedTimesheet(null)} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 py-6">
              <div><p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Job</p><p className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">{selectedTimesheet.job_title || `Job #${selectedTimesheet.job_order_id}`}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Client</p><p className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">{selectedTimesheet.client_name || 'Not specified'}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Period End</p><p className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">{selectedTimesheet.week_ending ? new Date(selectedTimesheet.week_ending).toLocaleDateString() : 'N/A'}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Hours</p><p className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">{selectedTimesheet.hours} hours</p></div>
              <div><p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Status</p><p className="mt-1 text-sm font-medium capitalize text-neutral-900 dark:text-white">{selectedTimesheet.status}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Submitted</p><p className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">{selectedTimesheet.submitted_at ? new Date(selectedTimesheet.submitted_at).toLocaleDateString() : 'Not submitted'}</p></div>
              {selectedTimesheet.approved_at && (
                <div><p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Approved</p><p className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">{new Date(selectedTimesheet.approved_at).toLocaleDateString()}</p></div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">Daily Breakdown</p>
              {viewingEntries.length > 0 ? (
                <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">Day</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">Hours</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                      {viewingEntries.map((e, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 whitespace-nowrap">
                            {new Date(e.entry_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-3 py-2 text-sm font-medium text-neutral-900 dark:text-white">{e.hours} hrs</td>
                          <td className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">{e.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 text-center">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">No daily breakdown was saved with this timesheet. Edit and re-save it to add daily hours and descriptions.</p>
                </div>
              )}
            </div>
            {selectedTimesheet.comments && (
              <div className="rounded-lg bg-neutral-100 p-4 dark:bg-neutral-800">
                <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Comments</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-900 dark:text-white">{selectedTimesheet.comments}</p>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button onClick={() => setSelectedTimesheet(null)} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg"><Trash2 className="w-5 h-5 text-red-600" /></div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Delete Timesheet?</h2>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              Are you sure you want to delete this timesheet for {deleteConfirm.consultant_name || 'this consultant'} (period ending {deleteConfirm.week_ending ? new Date(deleteConfirm.week_ending).toLocaleDateString() : 'N/A'})? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject with comments modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-700">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Reject Timesheet</h2>
              <button onClick={() => { setRejectModal(null); setRejectComments(''); }} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-5 h-5" /></button>
            </div>
            <div className="py-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                Provide a reason for rejecting this timesheet. The consultant will see these comments.
              </p>
              <textarea
                value={rejectComments}
                onChange={e => setRejectComments(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-red-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none"
                placeholder="e.g., Hours do not match approved schedule..."
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setRejectModal(null); setRejectComments(''); }} className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
              <button onClick={handleReject} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">Reject Timesheet</button>
            </div>
          </div>
        </div>
      )}

      {/* Rejected timesheet comments section */}
      {filteredTimesheets.some(t => t.status === 'rejected' && t.comments) && (
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Rejection Feedback</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {filteredTimesheets.filter(t => t.status === 'rejected' && t.comments).map(ts => (
                <div key={ts.id} className="border-l-4 border-red-500 pl-4">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    {ts.consultant_name || `Consultant #${ts.consultant_id}`} - Period ending {ts.week_ending ? new Date(ts.week_ending).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{ts.comments}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
