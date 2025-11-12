export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'administrator' | 'account_manager' | 'recruiter' | 'finance' | 'consultant';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  experience_years: number;
  status: CandidateStatus;
  resume_url?: string;
  created_at: string;
  updated_at: string;
}

export type CandidateStatus = 'available' | 'in_process' | 'placed' | 'do_not_contact';

export interface Client {
  id: string;
  company_name: string;
  primary_contact: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface JobOrder {
  id: string;
  client_id: string;
  title: string;
  description: string;
  required_skills: string[];
  experience_level: string;
  duration: string;
  billing_rate: number;
  status: JobOrderStatus;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export type JobOrderStatus = 'open' | 'interviewing' | 'filled' | 'closed';

export interface Timesheet {
  id: string;
  consultant_id: string;
  job_order_id: string;
  week_ending: string;
  hours: number;
  status: TimesheetStatus;
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  comments?: string;
}

export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface KPI {
  name: string;
  value: number | string;
  change?: number;
  format: 'number' | 'currency' | 'percentage' | 'days';
  trend?: 'up' | 'down' | 'stable';
}