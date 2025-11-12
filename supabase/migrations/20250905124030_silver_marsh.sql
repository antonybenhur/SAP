/*
  # Create Job-Candidate Pipeline System

  1. New Tables
    - `submissions`
      - `id` (uuid, primary key)
      - `job_order_id` (uuid, foreign key to job_orders)
      - `candidate_id` (uuid, foreign key to candidates)
      - `submission_status` (enum)
      - `submission_date` (timestamp)
      - `job_specific_notes` (text)
      - `submitted_by` (uuid, foreign key to profiles)
      - `reviewed_by` (uuid, foreign key to profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. New Enums
    - `submission_status` enum with pipeline stages

  3. Security
    - Enable RLS on `submissions` table
    - Add policies for recruiters and account managers
    - Add policies for viewing submission data

  4. Views
    - Create view for submissions with candidate and job details
    - Create view for pipeline analytics
*/

-- Create submission status enum
CREATE TYPE submission_status AS ENUM (
  'associated',
  'under_consideration', 
  'shortlisted_for_am',
  'pending_am_review',
  'rejected_by_am',
  'approved_for_submission',
  'submitted_to_client',
  'client_reviewing',
  'interview_scheduled',
  'interview_completed',
  'offer_extended',
  'offer_accepted',
  'placement_confirmed',
  'rejected_by_client',
  'withdrawn'
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_order_id uuid NOT NULL REFERENCES job_orders(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  submission_status submission_status DEFAULT 'associated' NOT NULL,
  submission_date timestamptz DEFAULT now(),
  job_specific_notes text,
  submitted_by uuid REFERENCES profiles(id),
  reviewed_by uuid REFERENCES profiles(id),
  interview_date timestamptz,
  interview_feedback text,
  offer_amount numeric(10,2),
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique candidate per job order
  UNIQUE(job_order_id, candidate_id)
);

-- Create indexes for performance
CREATE INDEX submissions_job_order_id_idx ON submissions(job_order_id);
CREATE INDEX submissions_candidate_id_idx ON submissions(candidate_id);
CREATE INDEX submissions_status_idx ON submissions(submission_status);
CREATE INDEX submissions_submission_date_idx ON submissions(submission_date);
CREATE INDEX submissions_submitted_by_idx ON submissions(submitted_by);

-- Enable RLS
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Recruiters and managers can manage submissions"
  ON submissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('administrator', 'account_manager', 'recruiter')
    )
  );

CREATE POLICY "Recruiters and managers can view submissions"
  ON submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('administrator', 'account_manager', 'recruiter')
    )
  );

-- Create view for submissions with details
CREATE OR REPLACE VIEW submissions_with_details AS
SELECT 
  s.*,
  c.name as candidate_name,
  c.email as candidate_email,
  c.phone as candidate_phone,
  c.skills as candidate_skills,
  c.experience_years,
  c.current_rate,
  c.expected_rate,
  c.work_authorization,
  c.location as candidate_location,
  jo.title as job_title,
  jo.required_skills,
  jo.billing_rate,
  jo.target_pay_rate_min,
  jo.target_pay_rate_max,
  cl.company_name,
  submitter.name as submitted_by_name,
  reviewer.name as reviewed_by_name
FROM submissions s
LEFT JOIN candidates c ON s.candidate_id = c.id
LEFT JOIN job_orders jo ON s.job_order_id = jo.id
LEFT JOIN clients cl ON jo.client_id = cl.id
LEFT JOIN profiles submitter ON s.submitted_by = submitter.id
LEFT JOIN profiles reviewer ON s.reviewed_by = reviewer.id;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_submissions_updated_at 
  BEFORE UPDATE ON submissions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to get suggested candidates for a job
CREATE OR REPLACE FUNCTION get_suggested_candidates(job_id uuid)
RETURNS TABLE (
  candidate_id uuid,
  match_score integer,
  matching_skills text[],
  candidate_name text,
  candidate_email text,
  experience_years integer,
  current_rate numeric,
  expected_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as candidate_id,
    -- Simple scoring based on skill matches and experience
    (
      CASE 
        WHEN c.skills && jo.required_skills THEN 
          array_length(c.skills & jo.required_skills, 1) * 10
        ELSE 0 
      END +
      CASE 
        WHEN c.experience_years >= COALESCE(jo.years_experience_required, 0) THEN 20
        ELSE 0
      END +
      CASE 
        WHEN c.expected_rate <= COALESCE(jo.target_pay_rate_max, 999999) THEN 15
        ELSE 0
      END
    ) as match_score,
    c.skills & jo.required_skills as matching_skills,
    c.name as candidate_name,
    c.email as candidate_email,
    c.experience_years,
    c.current_rate,
    c.expected_rate
  FROM candidates c
  CROSS JOIN job_orders jo
  WHERE jo.id = job_id
    AND c.status = 'available'
    AND NOT EXISTS (
      SELECT 1 FROM submissions s 
      WHERE s.candidate_id = c.id AND s.job_order_id = job_id
    )
    AND (
      c.skills && jo.required_skills OR -- Has some required skills
      c.experience_years >= COALESCE(jo.years_experience_required, 0) -- Meets experience requirement
    )
  ORDER BY match_score DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;