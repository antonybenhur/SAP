import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthContainer } from './components/Auth/AuthContainer';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './views/Dashboard';
import { Candidates } from './views/Candidates';
import { Clients } from './views/Clients';
import { JobOrders } from './views/JobOrders';
import { Scheduling } from './views/Scheduling';
import { Timesheets } from './views/Timesheets';
import { UserManagement } from './views/UserManagement';
import { ComingSoon } from './views/ComingSoon';
import { useAuth } from './contexts/AuthContext';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthContainer />;
  }

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Dashboard';
      case 'candidates': return 'Candidates';
      case 'clients': return 'Clients';
      case 'job-orders': return 'Job Orders';
      case 'scheduling': return 'Scheduling';
      case 'timesheets': return 'Timesheets';
      case 'communications': return 'Communications';
      case 'user-management': return 'User Management';
      case 'settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'candidates':
        return <Candidates />;
      case 'clients':
        return <Clients />;
      case 'job-orders':
        return <JobOrders />;
      case 'scheduling':
        return <Scheduling />;
      case 'timesheets':
        return <Timesheets />;
      case 'user-management':
        return <UserManagement />;
      case 'communications':
        return (
          <ComingSoon
            title="Communications Hub"
            description="Centralized communication management is coming soon"
            features={[
              'Email templates and automation',
              'SMS notifications',
              'Interview scheduling emails',
              'Candidate status updates',
              'Client communication tracking',
              'Bulk messaging capabilities'
            ]}
          />
        );
      case 'settings':
        return (
          <ComingSoon
            title="Settings & Configuration"
            description="System settings and user preferences"
            features={[
              'User profile management',
              'Company settings',
              'Integration configurations',
              'Notification preferences',
              'Security settings',
              'Data export options'
            ]}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={getViewTitle()} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;