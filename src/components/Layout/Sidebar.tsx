import React from 'react';
import {
  Users,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  Mail,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  UserCog,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { UserRole } from '../../types';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <BarChart3 className="w-5 h-5" />,
    roles: ['administrator', 'account_manager', 'recruiter', 'finance'],
  },
  {
    id: 'candidates',
    label: 'Candidates',
    icon: <Users className="w-5 h-5" />,
    roles: ['administrator', 'account_manager', 'recruiter'],
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: <Building2 className="w-5 h-5" />,
    roles: ['administrator', 'account_manager'],
  },
  {
    id: 'job-orders',
    label: 'Job Orders',
    icon: <Briefcase className="w-5 h-5" />,
    roles: ['administrator', 'account_manager', 'recruiter'],
  },
  {
    id: 'scheduling',
    label: 'Scheduling',
    icon: <Calendar className="w-5 h-5" />,
    roles: ['administrator', 'recruiter'],
  },
  {
    id: 'timesheets',
    label: 'Timesheets',
    icon: <Clock className="w-5 h-5" />,
    roles: ['administrator', 'account_manager', 'finance', 'consultant'],
  },
  {
    id: 'communications',
    label: 'Communications',
    icon: <Mail className="w-5 h-5" />,
    roles: ['administrator', 'account_manager', 'recruiter'],
  },
  {
    id: 'user-management',
    label: 'User Management',
    icon: <UserCog className="w-5 h-5" />,
    roles: ['administrator'],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const visibleMenuItems = menuItems.filter(item =>
    user?.role && item.roles.includes(user.role)
  );

  return (
    <div className="w-64 bg-card border-r border-border h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">StaffAug Pro</h1>
        <p className="text-sm text-muted-foreground mt-1">Management Platform</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary-foreground">
              {user?.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">
              {user?.role.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {visibleMenuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeView === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="text-sm font-medium">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
        
        <button
          onClick={() => onViewChange('settings')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors mb-2 ${
            activeView === 'settings'
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
        </button>
        
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};