export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      candidates: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          location: string | null
          address: string | null
          linkedin_url: string | null
          portfolio_url: string | null
          skills: string[]
          primary_skill: string | null
          certifications: string[]
          industry_experience: string[]
          experience_years: number
          status: 'available' | 'in_process' | 'placed' | 'do_not_contact'
          work_authorization: 'citizen' | 'green_card' | 'h1b' | 'opt' | 'tn' | 'l1' | 'other_visa' | 'needs_sponsorship' | null
          availability_date: string | null
          notice_period: string | null
          work_arrangement: 'remote' | 'onsite' | 'hybrid' | 'flexible' | null
          willing_to_relocate: 'yes' | 'no' | 'open_to_discussion' | null
          current_rate: number | null
          expected_rate: number | null
          rate_type: 'w2' | 'c2c' | '1099' | 'salary' | 'hourly' | null
          source: string | null
          recruiter_owner: string | null
          last_contacted_date: string | null
          resume_url: string | null
          notes: string | null
          created_by: string | null
          id_card_url: string | null
          profile_photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          location?: string | null
          address?: string | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          skills?: string[]
          primary_skill?: string | null
          certifications?: string[]
          industry_experience?: string[]
          experience_years?: number
          status?: 'available' | 'in_process' | 'placed' | 'do_not_contact'
          work_authorization?: 'citizen' | 'green_card' | 'h1b' | 'opt' | 'tn' | 'l1' | 'other_visa' | 'needs_sponsorship' | null
          availability_date?: string | null
          notice_period?: string | null
          work_arrangement?: 'remote' | 'onsite' | 'hybrid' | 'flexible' | null
          willing_to_relocate?: 'yes' | 'no' | 'open_to_discussion' | null
          current_rate?: number | null
          expected_rate?: number | null
          rate_type?: 'w2' | 'c2c' | '1099' | 'salary' | 'hourly' | null
          source?: string | null
          recruiter_owner?: string | null
          last_contacted_date?: string | null
          resume_url?: string | null
          notes?: string | null
          created_by?: string | null
          id_card_url?: string | null
          profile_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          location?: string | null
          address?: string | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          skills?: string[]
          primary_skill?: string | null
          certifications?: string[]
          industry_experience?: string[]
          experience_years?: number
          status?: 'available' | 'in_process' | 'placed' | 'do_not_contact'
          work_authorization?: 'citizen' | 'green_card' | 'h1b' | 'opt' | 'tn' | 'l1' | 'other_visa' | 'needs_sponsorship' | null
          availability_date?: string | null
          notice_period?: string | null
          work_arrangement?: 'remote' | 'onsite' | 'hybrid' | 'flexible' | null
          willing_to_relocate?: 'yes' | 'no' | 'open_to_discussion' | null
          current_rate?: number | null
          expected_rate?: number | null
          rate_type?: 'w2' | 'c2c' | '1099' | 'salary' | 'hourly' | null
          source?: string | null
          recruiter_owner?: string | null
          last_contacted_date?: string | null
          resume_url?: string | null
          notes?: string | null
          created_by?: string | null
          id_card_url?: string | null
          profile_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          company_name: string
          primary_contact: string
          email: string
          phone: string | null
          address: string | null
          website: string | null
          industry: string | null
          account_owner: string | null
          client_tier: 'strategic' | 'active' | 'prospect' | 'past_client'
          billing_address: string | null
          payment_terms: 'net_15' | 'net_30' | 'net_45' | 'net_60'
          default_markup_percentage: number | null
          primary_tech_stack: string[]
          typical_interview_process: string | null
          submission_requirements: string | null
          msa_status: 'signed' | 'in_negotiation' | 'expired' | 'not_required'
          msa_expiration_date: string | null
          contract_document_url: string | null
          notes: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          primary_contact: string
          email: string
          phone?: string | null
          address?: string | null
          website?: string | null
          industry?: string | null
          account_owner?: string | null
          client_tier?: 'strategic' | 'active' | 'prospect' | 'past_client'
          billing_address?: string | null
          payment_terms?: 'net_15' | 'net_30' | 'net_45' | 'net_60'
          default_markup_percentage?: number | null
          primary_tech_stack?: string[]
          typical_interview_process?: string | null
          submission_requirements?: string | null
          msa_status?: 'signed' | 'in_negotiation' | 'expired' | 'not_required'
          msa_expiration_date?: string | null
          contract_document_url?: string | null
          notes?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          primary_contact?: string
          email?: string
          phone?: string | null
          address?: string | null
          website?: string | null
          industry?: string | null
          account_owner?: string | null
          client_tier?: 'strategic' | 'active' | 'prospect' | 'past_client'
          billing_address?: string | null
          payment_terms?: 'net_15' | 'net_30' | 'net_45' | 'net_60'
          default_markup_percentage?: number | null
          primary_tech_stack?: string[]
          typical_interview_process?: string | null
          submission_requirements?: string | null
          msa_status?: 'signed' | 'in_negotiation' | 'expired' | 'not_required'
          msa_expiration_date?: string | null
          contract_document_url?: string | null
          notes?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      client_contacts: {
        Row: {
          id: string
          client_id: string
          name: string
          role: string
          email: string
          phone: string | null
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          role: string
          email: string
          phone?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          role?: string
          email?: string
          phone?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      job_orders: {
        Row: {
          id: string
          client_id: string
          title: string
          description: string | null
          required_skills: string[]
          nice_to_have_skills: string[]
          experience_level: string | null
          years_experience_required: number | null
          location: string | null
          work_arrangement: 'on_site' | 'hybrid' | 'remote' | null
          duration: string | null
          ideal_start_date: string | null
          billing_rate: number | null
          billing_structure: 'hourly' | 'monthly' | 'project_based' | null
          monthly_billing_rate: number | null
          project_total_value: number | null
          monthly_target_pay_min: number | null
          monthly_target_pay_max: number | null
          target_pay_rate_min: number | null
          target_pay_rate_max: number | null
          rate_type: 'w2' | 'c2c' | '1099' | null
          status: 'open' | 'interviewing' | 'filled' | 'closed'
          priority_level: 'high' | 'medium' | 'low'
          primary_recruiter_id: string | null
          account_manager_id: string | null
          reason_for_opening: 'new_project' | 'backfill' | 'team_growth' | 'expansion' | null
          contract_to_hire_potential: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          title: string
          description?: string | null
          required_skills?: string[]
          nice_to_have_skills?: string[]
          experience_level?: string | null
          years_experience_required?: number | null
          location?: string | null
          work_arrangement?: 'on_site' | 'hybrid' | 'remote' | null
          duration?: string | null
          ideal_start_date?: string | null
          billing_rate?: number | null
          billing_structure?: 'hourly' | 'monthly' | 'project_based' | null
          monthly_billing_rate?: number | null
          project_total_value?: number | null
          monthly_target_pay_min?: number | null
          monthly_target_pay_max?: number | null
          target_pay_rate_min?: number | null
          target_pay_rate_max?: number | null
          rate_type?: 'w2' | 'c2c' | '1099' | null
          status?: 'open' | 'interviewing' | 'filled' | 'closed'
          priority_level?: 'high' | 'medium' | 'low'
          primary_recruiter_id?: string | null
          account_manager_id?: string | null
          reason_for_opening?: 'new_project' | 'backfill' | 'team_growth' | 'expansion' | null
          contract_to_hire_potential?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          title?: string
          description?: string | null
          required_skills?: string[]
          nice_to_have_skills?: string[]
          experience_level?: string | null
          years_experience_required?: number | null
          location?: string | null
          work_arrangement?: 'on_site' | 'hybrid' | 'remote' | null
          duration?: string | null
          ideal_start_date?: string | null
          billing_rate?: number | null
          billing_structure?: 'hourly' | 'monthly' | 'project_based' | null
          monthly_billing_rate?: number | null
          project_total_value?: number | null
          monthly_target_pay_min?: number | null
          monthly_target_pay_max?: number | null
          target_pay_rate_min?: number | null
          target_pay_rate_max?: number | null
          rate_type?: 'w2' | 'c2c' | '1099' | null
          status?: 'open' | 'interviewing' | 'filled' | 'closed'
          priority_level?: 'high' | 'medium' | 'low'
          primary_recruiter_id?: string | null
          account_manager_id?: string | null
          reason_for_opening?: 'new_project' | 'backfill' | 'team_growth' | 'expansion' | null
          contract_to_hire_potential?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      interviews: {
        Row: {
          id: string
          submission_id: string | null
          candidate_id: string
          job_order_id: string
          interview_date: string
          duration_minutes: number
          interview_type: 'video' | 'phone' | 'in_person'
          interview_stage: 'phone_screen' | 'technical' | 'panel' | 'final'
          location: string | null
          meeting_link: string | null
          notes: string | null
          interviewers: string[]
          status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
          feedback: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          submission_id?: string | null
          candidate_id: string
          job_order_id: string
          interview_date: string
          duration_minutes?: number
          interview_type?: 'video' | 'phone' | 'in_person'
          interview_stage?: 'phone_screen' | 'technical' | 'panel' | 'final'
          location?: string | null
          meeting_link?: string | null
          notes?: string | null
          interviewers?: string[]
          status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
          feedback?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          submission_id?: string | null
          candidate_id?: string
          job_order_id?: string
          interview_date?: string
          duration_minutes?: number
          interview_type?: 'video' | 'phone' | 'in_person'
          interview_stage?: 'phone_screen' | 'technical' | 'panel' | 'final'
          location?: string | null
          meeting_link?: string | null
          notes?: string | null
          interviewers?: string[]
          status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
          feedback?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: 'administrator' | 'account_manager' | 'recruiter' | 'finance' | 'consultant'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'administrator' | 'account_manager' | 'recruiter' | 'finance' | 'consultant'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'administrator' | 'account_manager' | 'recruiter' | 'finance' | 'consultant'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      timesheets: {
        Row: {
          id: string
          consultant_id: string
          job_order_id: string
          week_ending: string
          hours: number
          status: 'draft' | 'submitted' | 'approved' | 'rejected'
          submitted_at: string | null
          approved_at: string | null
          approved_by: string | null
          comments: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          consultant_id: string
          job_order_id: string
          week_ending: string
          hours?: number
          status?: 'draft' | 'submitted' | 'approved' | 'rejected'
          submitted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          consultant_id?: string
          job_order_id?: string
          week_ending?: string
          hours?: number
          status?: 'draft' | 'submitted' | 'approved' | 'rejected'
          submitted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      job_orders_with_clients: {
        Row: {
          id: string | null
          client_id: string | null
          title: string | null
          description: string | null
          required_skills: string[] | null
          nice_to_have_skills: string[] | null
          experience_level: string | null
          years_experience_required: number | null
          location: string | null
          work_arrangement: 'on_site' | 'hybrid' | 'remote' | null
          duration: string | null
          ideal_start_date: string | null
          billing_rate: number | null
          target_pay_rate_min: number | null
          target_pay_rate_max: number | null
          rate_type: 'w2' | 'c2c' | '1099' | null
          status: 'open' | 'interviewing' | 'filled' | 'closed' | null
          priority_level: 'high' | 'medium' | 'low' | null
          primary_recruiter_id: string | null
          account_manager_id: string | null
          reason_for_opening: 'new_project' | 'backfill' | 'team_growth' | 'expansion' | null
          contract_to_hire_potential: boolean | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          company_name: string | null
          primary_contact: string | null
          client_email: string | null
          primary_recruiter_name: string | null
          primary_recruiter_email: string | null
          account_manager_name: string | null
          account_manager_email: string | null
        }
      }
      timesheets_with_details: {
        Row: {
          id: string | null
          consultant_id: string | null
          job_order_id: string | null
          week_ending: string | null
          hours: number | null
          status: 'draft' | 'submitted' | 'approved' | 'rejected' | null
          submitted_at: string | null
          approved_at: string | null
          approved_by: string | null
          comments: string | null
          created_at: string | null
          updated_at: string | null
          consultant_name: string | null
          consultant_email: string | null
          job_title: string | null
          client_name: string | null
        }
      }
      interviews_with_details: {
        Row: {
          id: string | null
          submission_id: string | null
          candidate_id: string | null
          job_order_id: string | null
          interview_date: string | null
          duration_minutes: number | null
          interview_type: 'video' | 'phone' | 'in_person' | null
          interview_stage: 'phone_screen' | 'technical' | 'panel' | 'final' | null
          location: string | null
          meeting_link: string | null
          notes: string | null
          interviewers: string[] | null
          status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | null
          feedback: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          candidate_name: string | null
          candidate_email: string | null
          candidate_phone: string | null
          job_title: string | null
          job_description: string | null
          company_name: string | null
          client_contact: string | null
          submission_status: string | null
          created_by_name: string | null
          created_by_email: string | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      candidate_status: 'available' | 'in_process' | 'placed' | 'do_not_contact'
      client_status: 'active' | 'inactive'
      client_tier: 'strategic' | 'active' | 'prospect' | 'past_client'
      compensation_rate_type: 'w2' | 'c2c' | '1099' | 'salary' | 'hourly'
      job_order_status: 'open' | 'interviewing' | 'filled' | 'closed'
      msa_status: 'signed' | 'in_negotiation' | 'expired' | 'not_required'
      payment_terms: 'net_15' | 'net_30' | 'net_45' | 'net_60'
      priority_level: 'high' | 'medium' | 'low'
      rate_type: 'w2' | 'c2c' | '1099'
      reason_for_opening: 'new_project' | 'backfill' | 'team_growth' | 'expansion'
      relocation_willingness: 'yes' | 'no' | 'open_to_discussion'
      timesheet_status: 'draft' | 'submitted' | 'approved' | 'rejected'
      user_role: 'administrator' | 'account_manager' | 'recruiter' | 'finance' | 'consultant'
      work_arrangement_preference: 'remote' | 'onsite' | 'hybrid' | 'flexible'
      work_arrangement_type: 'on_site' | 'hybrid' | 'remote'
      work_authorization_status: 'citizen' | 'green_card' | 'h1b' | 'opt' | 'tn' | 'l1' | 'other_visa' | 'needs_sponsorship'
      billing_structure: 'hourly' | 'monthly' | 'project_based'
      interview_type: 'video' | 'phone' | 'in_person'
      interview_stage: 'phone_screen' | 'technical' | 'panel' | 'final'
      interview_status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
    }
  }
}