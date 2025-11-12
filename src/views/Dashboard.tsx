import React from 'react';
import { useState, useEffect } from 'react';
import { KPICard } from '../components/Dashboard/KPICard';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, Briefcase, DollarSign, Clock } from 'lucide-react';

interface KPI {
  name: string;
  value: number | string;
  change?: number;
  format: 'number' | 'currency' | 'percentage' | 'days';
  trend?: 'up' | 'down' | 'stable';
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch candidates count
        const { count: candidatesCount } = await supabase
          .from('candidates')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'available');

        // Fetch job orders count
        const { count: jobOrdersCount } = await supabase
          .from('job_orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open');

        // Fetch placed candidates count
        const { count: placedCount } = await supabase
          .from('candidates')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'placed');

        // Fetch approved timesheets for revenue calculation
        const { data: approvedTimesheets } = await supabase
          .from('timesheets_with_details')
          .select('hours')
          .eq('status', 'approved');

        const totalHours = approvedTimesheets?.reduce((sum, ts) => sum + (ts.hours || 0), 0) || 0;
        const estimatedRevenue = totalHours * 85; // Average rate

        const dashboardKPIs: KPI[] = [
          {
            name: 'Active Candidates',
            value: candidatesCount || 0,
            format: 'number',
            trend: 'up',
            change: 12,
          },
          {
            name: 'Open Job Orders',
            value: jobOrdersCount || 0,
            format: 'number',
            trend: 'stable',
          },
          {
            name: 'Monthly Revenue',
            value: estimatedRevenue,
            format: 'currency',
            trend: 'up',
            change: 8,
          },
          {
            name: 'Placed Consultants',
            value: placedCount || 0,
            format: 'number',
            trend: 'up',
            change: 5,
          },
        ];

        setKpis(dashboardKPIs);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Fallback to mock data
        setKpis([
          { name: 'Active Candidates', value: 10, format: 'number', trend: 'up' },
          { name: 'Open Job Orders', value: 4, format: 'number', trend: 'stable' },
          { name: 'Monthly Revenue', value: 25000, format: 'currency', trend: 'up' },
          { name: 'Placed Consultants', value: 2, format: 'number', trend: 'up' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getRelevantKPIs = () => {
    switch (user?.role) {
      case 'administrator':
        return kpis;
      case 'account_manager':
        return kpis.slice(0, 3);
      case 'recruiter':
        return kpis.filter(kpi => 
          ['Active Candidates', 'Open Job Orders', 'Placed Consultants'].includes(kpi.name)
        );
      case 'finance':
        return kpis.filter(kpi => 
          ['Monthly Revenue', 'Placed Consultants'].includes(kpi.name)
        );
      default:
        return kpis.slice(0, 2);
    }
  };

  const relevantKPIs = getRelevantKPIs();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-neutral-900 text-white rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-neutral-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-neutral-700 rounded w-2/3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6 animate-pulse">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-neutral-900 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name}!
        </h2>
        <p className="text-neutral-300">
          Here's what's happening with your staff augmentation operations today.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relevantKPIs.map((kpi, index) => (
          <KPICard key={index} kpi={kpi} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.role !== 'consultant' && (
          <>
            <div className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="flex items-center">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Add New</p>
                  <p className="text-lg font-semibold text-foreground">Candidate</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="flex items-center">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Briefcase className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Create</p>
                  <p className="text-lg font-semibold text-foreground">Job Order</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="flex items-center">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Review</p>
                  <p className="text-lg font-semibold text-foreground">Timesheets</p>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition-all duration-200 cursor-pointer">
          <div className="flex items-center">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">View</p>
              <p className="text-lg font-semibold text-foreground">Reports</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-foreground">New candidate John Doe added to the system</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-foreground">Job order for Senior React Developer created</p>
                <p className="text-xs text-muted-foreground">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-foreground">Timesheet approved for consultant Jane Smith</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};