/*
  # Add comprehensive candidate fields

  1. New Fields Added
    - `primary_skill` (text) - One or two main expertise areas
    - `certifications` (text[]) - Array of official certifications
    - `industry_experience` (text[]) - Array of industries worked in
    - `linkedin_url` (text) - LinkedIn profile URL
    - `portfolio_url` (text) - GitHub/Portfolio URL
    - `work_authorization` (enum) - Work authorization status
    - `availability_date` (date) - When candidate is available
    - `notice_period` (text) - Notice period description
    - `work_arrangement` (enum) - Preferred work arrangement
    - `willing_to_relocate` (enum) - Relocation willingness
    - `current_rate` (numeric) - Current compensation
    - `expected_rate` (numeric) - Expected compensation
    - `rate_type` (enum) - Rate type (W2, C2C, 1099)
    - `source` (text) - How candidate was found
    - `recruiter_owner` (uuid) - Assigned recruiter
    - `last_contacted_date` (date) - Last contact date
    - `address` (text) - Full address

  2. Enums Created
    - `work_authorization_status` - Citizenship/visa status options
    - `work_arrangement_preference` - Remote/hybrid/onsite options
    - `relocation_willingness` - Relocation preferences
    - `compensation_rate_type` - Rate type options

  3. Indexes Added
    - Index on primary_skill for quick filtering
    - Index on work_authorization for compliance filtering
    - Index on recruiter_owner for assignment queries
    - Index on availability_date for scheduling
</*/

-- Create enums for new fields
CREATE TYPE work_authorization_status AS ENUM (
  'citizen',
  'green_card', 
  'h1b',
  'opt',
  'tn',
  'l1',
  'other_visa',
  'needs_sponsorship'
);

CREATE TYPE work_arrangement_preference AS ENUM (
  'remote',
  'onsite',
  'hybrid',
  'flexible'
);

CREATE TYPE relocation_willingness AS ENUM (
  'yes',
  'no',
  'open_to_discussion'
);

CREATE TYPE compensation_rate_type AS ENUM (
  'w2',
  'c2c',
  '1099',
  'salary',
  'hourly'
);

-- Add new columns to candidates table
DO $$
BEGIN
  -- Personal fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'address') THEN
    ALTER TABLE candidates ADD COLUMN address text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'linkedin_url') THEN
    ALTER TABLE candidates ADD COLUMN linkedin_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'portfolio_url') THEN
    ALTER TABLE candidates ADD COLUMN portfolio_url text;
  END IF;

  -- Professional fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'primary_skill') THEN
    ALTER TABLE candidates ADD COLUMN primary_skill text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'certifications') THEN
    ALTER TABLE candidates ADD COLUMN certifications text[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'industry_experience') THEN
    ALTER TABLE candidates ADD COLUMN industry_experience text[] DEFAULT '{}';
  END IF;

  -- Logistics fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'work_authorization') THEN
    ALTER TABLE candidates ADD COLUMN work_authorization work_authorization_status;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'availability_date') THEN
    ALTER TABLE candidates ADD COLUMN availability_date date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'notice_period') THEN
    ALTER TABLE candidates ADD COLUMN notice_period text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'work_arrangement') THEN
    ALTER TABLE candidates ADD COLUMN work_arrangement work_arrangement_preference;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'willing_to_relocate') THEN
    ALTER TABLE candidates ADD COLUMN willing_to_relocate relocation_willingness;
  END IF;

  -- Compensation fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'current_rate') THEN
    ALTER TABLE candidates ADD COLUMN current_rate numeric(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'expected_rate') THEN
    ALTER TABLE candidates ADD COLUMN expected_rate numeric(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'rate_type') THEN
    ALTER TABLE candidates ADD COLUMN rate_type compensation_rate_type;
  END IF;

  -- Internal fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'source') THEN
    ALTER TABLE candidates ADD COLUMN source text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'recruiter_owner') THEN
    ALTER TABLE candidates ADD COLUMN recruiter_owner uuid REFERENCES profiles(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'last_contacted_date') THEN
    ALTER TABLE candidates ADD COLUMN last_contacted_date date;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS candidates_primary_skill_idx ON candidates (primary_skill);
CREATE INDEX IF NOT EXISTS candidates_work_authorization_idx ON candidates (work_authorization);
CREATE INDEX IF NOT EXISTS candidates_recruiter_owner_idx ON candidates (recruiter_owner);
CREATE INDEX IF NOT EXISTS candidates_availability_date_idx ON candidates (availability_date);
CREATE INDEX IF NOT EXISTS candidates_work_arrangement_idx ON candidates (work_arrangement);
CREATE INDEX IF NOT EXISTS candidates_rate_type_idx ON candidates (rate_type);
CREATE INDEX IF NOT EXISTS candidates_source_idx ON candidates (source);
CREATE INDEX IF NOT EXISTS candidates_last_contacted_idx ON candidates (last_contacted_date);

-- Add indexes for array fields
CREATE INDEX IF NOT EXISTS candidates_certifications_idx ON candidates USING gin (certifications);
CREATE INDEX IF NOT EXISTS candidates_industry_experience_idx ON candidates USING gin (industry_experience);