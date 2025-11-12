import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Video, Phone, MapPin, Plus, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { ScheduleInterviewModal } from '../components/JobOrders/ScheduleInterviewModal';

type InterviewWithDetails = Database['public']['Views']['interviews_with_details']['Row'];

// Calendar View Component
const CalendarView: React.FC<{ 
  interviews: InterviewWithDetails[];
  onInterviewClick: (interview: InterviewWithDetails) => void;
}> = ({ interviews, onInterviewClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };
  
  const getInterviewsForDate = (date: Date | null) => {
    if (!date) return [];
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return interviews.filter(interview => {
      if (!interview.interview_date) return false;
      const interviewDate = new Date(interview.interview_date);
      return interviewDate >= startOfDay && interviewDate <= endOfDay;
    });
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };
  
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return (
    <div className="calendar-container">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {days.map((date, index) => {
          const dayInterviews = date ? getInterviewsForDate(date) : [];
          
          return (
            <div
              key={index}
              className={`min-h-[100px] p-2 border border-neutral-200 dark:border-neutral-700 ${
                date ? 'bg-white dark:bg-neutral-900' : 'bg-neutral-50 dark:bg-neutral-800'
              } ${isToday(date) ? 'ring-2 ring-blue-500' : ''}`}
            >
              {date && (
                <>
                  <div className={`text-sm font-medium mb-1 ${
                    isToday(date) 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-neutral-900 dark:text-white'
                  }`}>
                    {date.getDate()}
                  </div>
                  
                  {/* Interview indicators */}
                  <div className="space-y-1">
                    {dayInterviews.slice(0, 3).map((interview) => (
                      <div
                        key={interview.id}
                        className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity ${
                          interview.interview_type === 'video' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            : interview.interview_type === 'phone'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                        }`}
                        title={`${interview.candidate_name} - ${interview.interview_date ? new Date(interview.interview_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}`}
                        onClick={() => onInterviewClick(interview)}
                      >
                        {interview.candidate_name}
                        {interview.interview_date && (
                          <span className="text-blue-600 dark:text-blue-400 ml-1">
                            {new Date(interview.interview_date).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        )}
                      </div>
                    ))}
                    {dayInterviews.length > 3 && (
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        +{dayInterviews.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Scheduling: React.FC = () => {
  const [interviews, setInterviews] = useState<InterviewWithDetails[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<InterviewWithDetails | null>(null);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('interviews_with_details')
          .select('*')
          .order('interview_date', { ascending: true });

        if (error) throw error;
        setInterviews(data || []);
      } catch (error) {
        console.error('Error fetching interviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();

    // Listen for new interviews being scheduled
    const handleInterviewScheduled = () => {
      fetchInterviews();
    };

    window.addEventListener('interviewScheduled', handleInterviewScheduled);
    return () => {
      window.removeEventListener('interviewScheduled', handleInterviewScheduled);
    };
  }, []);

  const getInterviewsForDate = (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return interviews.filter(interview => {
      if (!interview.interview_date) return false;
      const interviewDate = new Date(interview.interview_date);
      return interviewDate >= startOfDay && interviewDate <= endOfDay;
    });
  };

  const handleInterviewClick = (interview: InterviewWithDetails) => {
    setSelectedInterview(interview);
    setIsInterviewModalOpen(true);
  };

  const handleInterviewUpdated = () => {
    // Refresh interviews when modal closes
    const fetchInterviews = async () => {
      try {
        const { data, error } = await supabase
          .from('interviews_with_details')
          .select('*')
          .order('interview_date', { ascending: true });

        if (error) throw error;
        setInterviews(data || []);
      } catch (error) {
        console.error('Error fetching interviews:', error);
      }
    };
    fetchInterviews();
  };

  const getInterviewIcon = (type: string | null) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'in_person':
        return <MapPin className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getInterviewTypeColor = (type: string | null) => {
    switch (type) {
      case 'video':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'phone':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_person':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const filteredInterviews = interviews.filter(interview =>
    (interview.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (interview.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (interview.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  const todayInterviews = getInterviewsForDate(new Date());
  const upcomingInterviews = interviews.filter(interview => {
    if (!interview.interview_date) return false;
    const interviewDate = new Date(interview.interview_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return interviewDate > today;
  }).slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading interviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Interview Scheduling</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Manage and track all scheduled interviews</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search interviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 text-neutral-900 dark:text-white placeholder:text-neutral-500"
            />
          </div>
          
          <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Filter className="w-4 h-4 inline mr-1" />
              List
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Today's Interviews</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {todayInterviews.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">This Week</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {interviews.filter(interview => {
                  if (!interview.interview_date) return false;
                  const interviewDate = new Date(interview.interview_date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                  return interviewDate >= today && interviewDate <= weekFromNow;
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Video className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Video Calls</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {interviews.filter(interview => interview.interview_type === 'video').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Scheduled</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {interviews.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar/List View */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
            {viewMode === 'calendar' ? (
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  Interview Calendar
                </h3>
                <CalendarView interviews={filteredInterviews} onInterviewClick={handleInterviewClick} />
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  Interview List
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Candidate
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Position
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          Stage
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                      {filteredInterviews.map((interview) => (
                        <tr key={interview.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-900 dark:text-white">
                              {interview.candidate_name}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-900 dark:text-white">
                              {interview.job_title}
                            </div>
                            <div className="text-sm text-neutral-500 dark:text-neutral-400">
                              {interview.company_name}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-900 dark:text-white">
                              {interview.interview_date ? new Date(interview.interview_date).toLocaleDateString() : 'TBD'}
                            </div>
                            <div className="text-sm text-neutral-500 dark:text-neutral-400">
                              {interview.interview_date ? new Date(interview.interview_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getInterviewTypeColor(interview.interview_type)}`}>
                              {getInterviewIcon(interview.interview_type)}
                              <span className="ml-1 capitalize">{interview.interview_type?.replace('_', ' ')}</span>
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-900 dark:text-white">
                              {interview.interview_stage}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Interviews */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Today's Schedule
            </h3>
            {todayInterviews.length === 0 ? (
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">No interviews scheduled for today</p>
            ) : (
              <div className="space-y-3">
                {todayInterviews.map((interview) => (
                  <div key={interview.id} className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div className={`p-2 rounded-lg ${getInterviewTypeColor(interview.interview_type)}`}>
                      {getInterviewIcon(interview.interview_type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">
                        {interview.candidate_name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {interview.interview_date ? new Date(interview.interview_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'} • {interview.interview_stage}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Interviews */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Upcoming Interviews
            </h3>
            {upcomingInterviews.length === 0 ? (
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">No upcoming interviews</p>
            ) : (
              <div className="space-y-3">
                {upcomingInterviews.map((interview) => (
                  <div key={interview.id} className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div className={`p-2 rounded-lg ${getInterviewTypeColor(interview.interview_type)}`}>
                      {getInterviewIcon(interview.interview_type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">
                        {interview.candidate_name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {interview.interview_date ? new Date(interview.interview_date).toLocaleDateString() : 'TBD'} • {interview.interview_date ? new Date(interview.interview_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interview Modal */}
      {selectedInterview && (
        <ScheduleInterviewModal
          isOpen={isInterviewModalOpen}
          onClose={() => {
            setIsInterviewModalOpen(false);
            setSelectedInterview(null);
          }}
          candidate={{
            id: selectedInterview.candidate_id || '',
            name: selectedInterview.candidate_name || '',
            email: selectedInterview.candidate_email || '',
          }}
          jobOrder={{
            id: selectedInterview.job_order_id || '',
            title: selectedInterview.job_title || '',
            company_name: selectedInterview.company_name || '',
          }}
          onSchedule={handleInterviewUpdated}
          editingInterview={selectedInterview}
        />
      )}
    </div>
  );
};