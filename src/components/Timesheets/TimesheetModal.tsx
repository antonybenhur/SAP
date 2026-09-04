import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle, User, Briefcase, Calendar, CalendarPlus } from 'lucide-react';
import { jobOrdersTable, profilesTable, clientsTable, timesheetsTable, timesheetEntriesTable } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';

interface TimesheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  timesheet: Record<string, any> | null;
  onSave: () => void;
}

interface DayEntry {
  date: string;
  hours: string;
  description: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDateRange(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate) return [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  if (end < start) return [];
  const dates: string[] = [];
  const d = new Date(start);
  while (d <= end) {
    dates.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function formatDateInput(d: Date): string {
  return d.toISOString().split('T')[0];
}

function defaultStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return formatDateInput(d);
}

function defaultEndDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 6);
  return formatDateInput(d);
}

export const TimesheetModal: React.FC<TimesheetModalProps> = ({ isOpen, onClose, timesheet, onSave }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [consultants, setConsultants] = useState<any[]>([]);
  const [jobOrders, setJobOrders] = useState<any[]>([]);
  const [consultantId, setConsultantId] = useState('');
  const [jobOrderId, setJobOrderId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [comments, setComments] = useState('');
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    fetchConsultants();
    fetchJobOrders();
    if (timesheet) {
      setConsultantId(timesheet.consultant_id || '');
      setJobOrderId(timesheet.job_order_id || '');
      const we = timesheet.week_ending ? timesheet.week_ending.split('T')[0] : '';
      const entries = timesheet._entries;
      if (entries && entries.length > 0) {
        const firstDate = entries[0].entry_date?.split('T')[0] || we;
        const lastDate = entries[entries.length - 1].entry_date?.split('T')[0] || we;
        setStartDate(firstDate);
        setEndDate(lastDate);
        setComments(timesheet.comments || '');
        setDayEntries(entries.map((e: any) => ({
          date: e.entry_date?.split('T')[0] || '',
          hours: e.hours?.toString() || '',
          description: e.description || '',
        })));
      } else {
        const end = we || defaultEndDate();
        const start = end;
        setStartDate(start);
        setEndDate(end);
        setComments(timesheet.comments || '');
        setDayEntries(buildEmptyEntries(start, end));
      }
    } else {
      setConsultantId(user?.role === 'consultant' ? user.id : '');
      setJobOrderId('');
      const sd = defaultStartDate();
      const ed = defaultEndDate();
      setStartDate(sd);
      setEndDate(ed);
      setComments('');
      setDayEntries(buildEmptyEntries(sd, ed));
    }
    setError('');
  }, [timesheet, isOpen]);

  function buildEmptyEntries(sd: string, ed: string): DayEntry[] {
    return getDateRange(sd, ed).map(date => ({ date, hours: '', description: '' }));
  }

  async function loadExistingEntries(timesheetId: string, sd: string, ed: string) {
    try {
      const entries = await timesheetEntriesTable.selectByTimesheet(timesheetId);
      const dates = getDateRange(sd, ed);
      if (entries.length > 0) {
        const mapped = dates.map(date => {
          const found = entries.find((e: any) => e.entry_date?.split('T')[0] === date);
          return found
            ? { date, hours: found.hours?.toString() || '', description: found.description || '' }
            : { date, hours: '', description: '' };
        });
        setDayEntries(mapped);
      } else {
        setDayEntries(dates.map(date => ({ date, hours: '', description: '' })));
      }
    } catch {
      setDayEntries(buildEmptyEntries(sd, ed));
    }
  }

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartDate(value);
      if (endDate && value > endDate) {
        setEndDate(value);
        setDayEntries(buildEmptyEntries(value, value));
      } else {
        setDayEntries(buildEmptyEntries(value, endDate));
      }
    } else {
      setEndDate(value);
      if (startDate && value < startDate) {
        setStartDate(value);
        setDayEntries(buildEmptyEntries(value, value));
      } else {
        setDayEntries(buildEmptyEntries(startDate, value));
      }
    }
  };

  const fetchConsultants = async () => {
    try {
      let data = await profilesTable.selectByRole(['consultant']);
      if (data.length === 0) {
        await profilesTable.insert({ email: 'mike.johnson@email.com', name: 'Mike Johnson', role: 'consultant', password_hash: 'consultant123' });
        await profilesTable.insert({ email: 'sarah.williams@email.com', name: 'Sarah Williams', role: 'consultant', password_hash: 'consultant123' });
        data = await profilesTable.selectByRole(['consultant']);
      }
      setConsultants(data);
    } catch (err) {
      console.error('Error loading consultants:', err);
      setError('Unable to load consultants. Please try again.');
    }
  };

  const fetchJobOrders = async () => {
    try {
      let data = await jobOrdersTable.selectAllWithClients();
      if (data.length === 0) {
        let clients = await clientsTable.selectAll();
        if (clients.length === 0) {
          await clientsTable.insert({ company_name: 'TechCorp Solutions', primary_contact: 'Alice Johnson', email: 'alice@techcorp.com', phone: '555-0100', address: '123 Tech Ave, San Francisco, CA', industry: 'Technology', status: 'active' });
          await clientsTable.insert({ company_name: 'DataFlow Systems', primary_contact: 'Bob Smith', email: 'bob@dataflow.com', phone: '555-0200', address: '456 Data Dr, New York, NY', industry: 'Finance', status: 'active' });
          clients = await clientsTable.selectAll();
        }
        const c1 = clients[0];
        const c2 = clients[1] || clients[0];
        await jobOrdersTable.insert({ client_id: c1.id, title: 'Senior React Developer', description: 'React + TypeScript developer for web applications.', required_skills: ['React', 'TypeScript'], experience_level: 'Senior', duration: '6 months', billing_rate: 120, billing_structure: 'hourly', rate_type: 'w2', status: 'open', priority_level: 'high' });
        await jobOrdersTable.insert({ client_id: c2.id, title: 'Python Backend Engineer', description: 'Python backend engineer with Django and PostgreSQL.', required_skills: ['Python', 'Django', 'PostgreSQL'], experience_level: 'Mid-Senior', duration: '12 months', billing_rate: 90, billing_structure: 'hourly', rate_type: 'c2c', status: 'interviewing', priority_level: 'medium' });
        data = await jobOrdersTable.selectAllWithClients();
      }
      setJobOrders(data.filter((j: any) => j.status === 'open' || j.status === 'interviewing' || j.status === 'filled'));
    } catch (err) {
      console.error('Error loading job orders:', err);
      setError('Unable to load job orders. Please try again.');
    }
  };

  const handleDayChange = (index: number, field: 'hours' | 'description', value: string) => {
    setDayEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const totalHours = dayEntries.reduce((sum, e) => {
    const h = parseFloat(e.hours);
    return sum + (isNaN(h) ? 0 : h);
  }, 0);

  const numDays = dayEntries.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!consultantId || !jobOrderId || !startDate || !endDate) {
      setError('Consultant, job order, start date, and end date are required.');
      setLoading(false);
      return;
    }

    if (endDate < startDate) {
      setError('End date cannot be before start date.');
      setLoading(false);
      return;
    }

    if (numDays > 31) {
      setError('Date range cannot exceed 31 days.');
      setLoading(false);
      return;
    }

    const hasAnyHours = dayEntries.some(e => e.hours !== '' && !isNaN(parseFloat(e.hours)));
    if (!hasAnyHours) {
      setError('Please enter hours for at least one day.');
      setLoading(false);
      return;
    }

    for (const entry of dayEntries) {
      if (entry.hours !== '') {
        const h = parseFloat(entry.hours);
        if (isNaN(h) || h < 0 || h > 24) {
          setError(`Hours for ${DAY_NAMES[new Date(entry.date).getDay()]} must be between 0 and 24.`);
          setLoading(false);
          return;
        }
      }
    }

    try {
      const tsData = {
        consultant_id: consultantId,
        job_order_id: jobOrderId,
        week_ending: new Date(endDate + 'T23:59:59').toISOString(),
        hours: totalHours,
        comments: comments || null,
      };

      let tsId: string;
      if (timesheet) {
        await timesheetsTable.update(timesheet.id, tsData);
        tsId = timesheet.id;
        await timesheetEntriesTable.deleteByTimesheet(tsId);
      } else {
        tsId = await timesheetsTable.insert({ ...tsData, status: 'draft' });
      }

      for (const entry of dayEntries) {
        if (entry.hours !== '' && !isNaN(parseFloat(entry.hours))) {
          await timesheetEntriesTable.insert({
            timesheet_id: tsId,
            entry_date: new Date(entry.date + 'T12:00:00').toISOString(),
            hours: parseFloat(entry.hours),
            description: entry.description || null,
          });
        }
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error saving timesheet:', err);
      setError(err.message || 'Failed to save timesheet');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isConsultant = user?.role === 'consultant';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                {timesheet ? 'Edit Timesheet' : 'New Timesheet'}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Pick a date range, then enter hours and a description for each day
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                <User className="w-4 h-4 inline mr-1" />Consultant
              </label>
              <select
                value={consultantId}
                onChange={e => setConsultantId(e.target.value)}
                disabled={isConsultant}
                className="w-full px-3 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white disabled:opacity-60 text-sm"
                required
              >
                <option value="">Select...</option>
                {consultants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                <Briefcase className="w-4 h-4 inline mr-1" />Job Order
              </label>
              <select
                value={jobOrderId}
                onChange={e => setJobOrderId(e.target.value)}
                className="w-full px-3 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
                required
              >
                <option value="">Select...</option>
                {jobOrders.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => handleDateChange('start', e.target.value)}
                className="w-full px-3 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                <CalendarPlus className="w-4 h-4 inline mr-1" />End Date
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => handleDateChange('end', e.target.value)}
                className="w-full px-3 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
                required
              />
            </div>
          </div>

          {numDays > 0 && (
            <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
              <span>{numDays} day{numDays !== 1 ? 's' : ''} in range</span>
              <span>Pick a new start or end date to adjust the grid below</span>
            </div>
          )}

          {/* Daily grid */}
          {numDays > 0 && (
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Day</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider w-28">Hours</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {dayEntries.map((entry, i) => {
                      const dayIdx = new Date(entry.date).getDay();
                      const isWeekend = dayIdx === 0 || dayIdx === 6;
                      return (
                        <tr key={i} className={isWeekend ? 'bg-neutral-50/50 dark:bg-neutral-800/30' : ''}>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className={`text-sm font-medium ${isWeekend ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-700 dark:text-neutral-200'}`}>
                              {DAY_SHORT[dayIdx]}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                            {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              max="24"
                              value={entry.hours}
                              onChange={e => handleDayChange(i, 'hours', e.target.value)}
                              placeholder="0"
                              className="w-20 px-2.5 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm text-center"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="text"
                              value={entry.description}
                              onChange={e => handleDayChange(i, 'description', e.target.value)}
                              placeholder="What did you work on?"
                              className="w-full px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-neutral-50 dark:bg-neutral-800/50 border-t-2 border-neutral-200 dark:border-neutral-700">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-right text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                        Total Hours:
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-sm font-bold">
                          {totalHours.toFixed(2)}
                        </span>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Comments</label>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none text-sm"
              placeholder="Optional notes for the approver..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium">
              {loading ? 'Saving...' : timesheet ? 'Update Timesheet' : 'Create Timesheet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
