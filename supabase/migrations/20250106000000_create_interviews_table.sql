/*
  # Create Interviews Table for Scheduling System

  1. New Tables
    - `interviews`
      - `id` (uuid, primary key)
      - `submission_id` (uuid, foreign key to submissions)
      - `candidate_id` (uuid, foreign key to candidates)
      - `job_order_id` (uuid, foreign key to job_orders)
      - `interview_date` (timestamptz)
      - `duration_minutes` (integer)
      - `interview_type` (enum: video, phone, in_person)
      - `interview_stage` (enum: phone_screen, technical, panel, final)
      - `location` (text, for in-person interviews)
      - `meeting_link` (text, for video interviews)
      - `notes` (text)
      - `interviewers` (text[])
      - `status` (enum: scheduled, completed, cancelled, rescheduled)
      - `feedback` (text)
      - `created_by` (uuid, foreign key to profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. New Enums
    - `interview_type` enum
    - `interview_stage` enum
    - `interview_status` enum

  3. Security
    - Enable RLS on `interviews` table
    - Add policies for recruiters and account managers
    - Add policies for viewing interview data

  4. Views
    - Create view for interviews with candidate and job details
*/

-- Create enums if they don't exist
DO $$ BEGIN
  -- Create interview type enum
  CREATE TYPE interview_type AS ENUM (
    'video',
    'phone', 
    'in_person'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  -- Create interview stage enum
  CREATE TYPE interview_stage AS ENUM (
    'phone_screen',
    'technical',
    'panel',
    'final'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  -- Create interview status enum
  CREATE TYPE interview_status AS ENUM (
    'scheduled',
    'completed',
    'cancelled',
    'rescheduled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES submissions(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_order_id uuid NOT NULL REFERENCES job_orders(id) ON DELETE CASCADE,
  interview_date timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60 NOT NULL,
  interview_type interview_type DEFAULT 'video' NOT NULL,
  interview_stage interview_stage DEFAULT 'phone_screen' NOT NULL,
  location text,
  meeting_link text,
  notes text,
  interviewers text[] DEFAULT '{}',
  status interview_status DEFAULT 'scheduled' NOT NULL,
  feedback text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS interviews_submission_id_idx;
DROP INDEX IF EXISTS interviews_candidate_id_idx;
DROP INDEX IF EXISTS interviews_job_order_id_idx;
DROP INDEX IF EXISTS interviews_interview_date_idx;
DROP INDEX IF EXISTS interviews_status_idx;
DROP INDEX IF EXISTS interviews_created_by_idx;

-- Create indexes for performance
CREATE INDEX interviews_submission_id_idx ON interviews(submission_id);
CREATE INDEX interviews_candidate_id_idx ON interviews(candidate_id);
CREATE INDEX interviews_job_order_id_idx ON interviews(job_order_id);
CREATE INDEX interviews_interview_date_idx ON interviews(interview_date);
CREATE INDEX interviews_status_idx ON interviews(status);
CREATE INDEX interviews_created_by_idx ON interviews(created_by);

-- Drop existing policies
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Recruiters and managers can manage interviews" ON interviews;
    DROP POLICY IF EXISTS "Recruiters and managers can view interviews" ON interviews;
EXCEPTION
    WHEN undefined_table THEN 
        -- Handle case where table doesn't exist yet
        NULL;
END $$;

-- Enable RLS
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Create new policies
DO $$ 
BEGIN
    -- Create management policy
    CREATE POLICY "Recruiters and managers can manage interviews"
        ON interviews
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND (
                    profiles.role IN ('administrator', 'account_manager', 'recruiter')
                    OR (
                        profiles.role = 'consultant' 
                        AND interviews.candidate_id IN (
                            SELECT id FROM candidates WHERE created_by = auth.uid()
                        )
                    )
                )
            )
        );

    -- Create view policy
    CREATE POLICY "Recruiters and managers can view interviews"
        ON interviews
        FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND (
                    profiles.role IN ('administrator', 'account_manager', 'recruiter')
                    OR (
                        profiles.role = 'consultant' 
                        AND interviews.candidate_id IN (
                            SELECT id FROM candidates WHERE created_by = auth.uid()
                        )
                    )
                )
            )
        );
EXCEPTION
    WHEN duplicate_object THEN 
        -- Handle case where policies already exist
        NULL;
END $$;

-- Drop and recreate view for interviews with details
DROP VIEW IF EXISTS interviews_with_details;
CREATE VIEW interviews_with_details AS
SELECT 
  i.*,
  c.name as candidate_name,
  c.email as candidate_email,
  c.phone as candidate_phone,
  jo.title as job_title,
  jo.description as job_description,
  cl.company_name,
  cl.primary_contact as client_contact,
  s.submission_status,
  p.name as created_by_name,
  p.email as created_by_email
FROM interviews i
LEFT JOIN candidates c ON i.candidate_id = c.id
LEFT JOIN job_orders jo ON i.job_order_id = jo.id
LEFT JOIN clients cl ON jo.client_id = cl.id
LEFT JOIN submissions s ON (i.submission_id = s.id OR (i.candidate_id = s.candidate_id AND i.job_order_id = s.job_order_id))
LEFT JOIN profiles p ON i.created_by = p.id;

-- Drop existing trigger and policies if they exist
DROP TRIGGER IF EXISTS update_interviews_updated_at ON interviews;
DROP POLICY IF EXISTS "Recruiters and managers can manage interviews" ON interviews;
DROP POLICY IF EXISTS "Recruiters and managers can view interviews" ON interviews;

-- Create trigger for updated_at
CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE interviews IS 'Stores interview scheduling information linked to candidate submissions';
COMMENT ON COLUMN interviews.submission_id IS 'Optional link to submission record';
COMMENT ON COLUMN interviews.interview_date IS 'Date and time of the interview';
COMMENT ON COLUMN interviews.duration_minutes IS 'Duration of interview in minutes';
COMMENT ON COLUMN interviews.interviewers IS 'Array of interviewer names/emails';
