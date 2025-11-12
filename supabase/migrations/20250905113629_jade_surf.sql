/*
  # Enhance Job Orders with Comprehensive Fields

  1. New Enums
    - work_arrangement_type: on_site, hybrid, remote
    - priority_level: high, medium, low
    - rate_type: w2, c2c, 1099
    - reason_for_opening: new_project, backfill, team_growth, expansion

  2. New Fields Added to job_orders
    - location (text)
    - work_arrangement (work_arrangement_type)
    - ideal_start_date (date)
    - contract_to_hire_potential (boolean)
    - priority_level (priority_level)
    - primary_recruiter_id (uuid, references profiles)
    - account_manager_id (uuid, references profiles)
    - reason_for_opening (reason_for_opening)
    - years_experience_required (integer)
    - nice_to_have_skills (text[])
    - target_pay_rate_min (numeric)
    - target_pay_rate_max (numeric)
    - rate_type (rate_type)

  3. Indexes
    - Added indexes for filtering and performance
*/

-- Create new enums
CREATE TYPE work_arrangement_type AS ENUM ('on_site', 'hybrid', 'remote');
CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE rate_type AS ENUM ('w2', 'c2c', '1099');
CREATE TYPE reason_for_opening AS ENUM ('new_project', 'backfill', 'team_growth', 'expansion');

-- Add new fields to job_orders table
DO $$
BEGIN
  -- Location
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_orders' AND column_name = 'location'
  ) THEN
    ALTER TABLE job_orders ADD COLUMN location text;
  END IF;

  -- Work arrangement
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_orders' AND column_name = 'work_arrangement'
  ) THEN
    ALTER TABLE job_orders ADD COLUMN work_arrangement work_arrangement_type;
  END IF;

  -- Ideal start date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_orders' AND column_name = 'ideal_start_date'
  ) THEN
    ALTER TABLE job_orders ADD COLUMN ideal_start_date date;
  END IF;

  -- Contract to hire potential
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_orders' AND column_name = 'contract_to_hire_potential'
  ) THEN
    ALTER TABLE job_orders ADD COLUMN contract_to_hire_potential boolean DEFAULT false;
  END IF;

  -- Priority level
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_orders' AND column_name = 'priority_level'
  ) THEN
    ALTER TABLE job_orders ADD COLUMN priority_level priority_level DEFAULT 'medium';
  END IF;

  -- Primary recruiter
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_orders' AND column_name = 'primary_recruiter_id'
  ) THEN
    ALTER TABLE job_orders ADD COLUMN primary_recruiter_id uuid REFERENCES profiles(id);
  END IF;

  -- Account manager
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_orders' AND column_name = 'account_manager_id'
  ) THEN
    ALTER TABLE job_orders ADD COLUMN account_manager_id uuid REFERENCES profiles(id);
  END IF;

  -- Reason for opening
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_orders' AND column_name = 'reason_for_opening'
  ) THEN
    ALTER TABLE job_orders ADD COLUMN reason_for_opening reason_for_opening;
  END IF;

  -- Years experience required
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_orders' AND column_name = 'years_experience_required'
  ) THEN
    ALTER TABLE job_orders ADD COLUMN years_experience_required integer;
  END IF;

  -- Nice to have skills
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_orders' AND column_name = 'nice_to_have_skills'
  ) THEN
    ALTER TABLE job_orders ADD COLUMN nice_to_have_skills text[] DEFAULT '{}';
  END IF;

  -- Target pay rate range
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_orders' AND column_name = 'target_pay_rate_min'
  ) THEN
    ALTER TABLE job_orders ADD COLUMN target_pay_rate_min numeric(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_orders' AND column_name = 'target_pay_rate_max'
  ) THEN
    ALTER TABLE job_orders ADD COLUMN target_pay_rate_max numeric(10,2);
  END IF;

  -- Rate type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_orders' AND column_name = 'rate_type'
  ) THEN
    ALTER TABLE job_orders ADD COLUMN rate_type rate_type;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS job_orders_location_idx ON job_orders(location);
CREATE INDEX IF NOT EXISTS job_orders_work_arrangement_idx ON job_orders(work_arrangement);
CREATE INDEX IF NOT EXISTS job_orders_priority_level_idx ON job_orders(priority_level);
CREATE INDEX IF NOT EXISTS job_orders_primary_recruiter_idx ON job_orders(primary_recruiter_id);
CREATE INDEX IF NOT EXISTS job_orders_account_manager_idx ON job_orders(account_manager_id);
CREATE INDEX IF NOT EXISTS job_orders_ideal_start_date_idx ON job_orders(ideal_start_date);
CREATE INDEX IF NOT EXISTS job_orders_rate_type_idx ON job_orders(rate_type);
CREATE INDEX IF NOT EXISTS job_orders_nice_to_have_skills_idx ON job_orders USING gin(nice_to_have_skills);

-- Update the job_orders_with_clients view to include new fields
DROP VIEW IF EXISTS job_orders_with_clients;

CREATE VIEW job_orders_with_clients AS
SELECT 
  jo.*,
  c.company_name,
  c.primary_contact,
  c.email as client_email,
  pr.name as primary_recruiter_name,
  pr.email as primary_recruiter_email,
  am.name as account_manager_name,
  am.email as account_manager_email
FROM job_orders jo
LEFT JOIN clients c ON jo.client_id = c.id
LEFT JOIN profiles pr ON jo.primary_recruiter_id = pr.id
LEFT JOIN profiles am ON jo.account_manager_id = am.id;