/*
  # Timesheets Management Schema

  1. New Tables
    - `timesheets`
      - `id` (uuid, primary key)
      - `consultant_id` (uuid, references profiles)
      - `job_order_id` (uuid, references job_orders)
      - `week_ending` (date)
      - `hours` (decimal)
      - `status` (timesheet_status enum)
      - `submitted_at` (timestamp, optional)
      - `approved_at` (timestamp, optional)
      - `approved_by` (uuid, references profiles, optional)
      - `comments` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `timesheets` table
    - Add policies for consultants to manage their own timesheets
    - Add policies for managers to approve timesheets
*/

-- Create enum for timesheet status
CREATE TYPE timesheet_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');

-- Create timesheets table
CREATE TABLE IF NOT EXISTS timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  job_order_id uuid REFERENCES job_orders(id) ON DELETE CASCADE,
  week_ending date NOT NULL,
  hours decimal(5,2) NOT NULL DEFAULT 0,
  status timesheet_status DEFAULT 'draft',
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid REFERENCES profiles(id),
  comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Consultants can manage their own timesheets"
  ON timesheets
  FOR ALL
  TO authenticated
  USING (consultant_id = auth.uid());

CREATE POLICY "Managers can view all timesheets"
  ON timesheets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('administrator', 'account_manager', 'finance')
    )
  );

CREATE POLICY "Managers can approve timesheets"
  ON timesheets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('administrator', 'account_manager', 'finance')
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_timesheets_updated_at
  BEFORE UPDATE ON timesheets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS timesheets_consultant_id_idx ON timesheets (consultant_id);
CREATE INDEX IF NOT EXISTS timesheets_job_order_id_idx ON timesheets (job_order_id);
CREATE INDEX IF NOT EXISTS timesheets_status_idx ON timesheets (status);
CREATE INDEX IF NOT EXISTS timesheets_week_ending_idx ON timesheets (week_ending);

-- Unique constraint to prevent duplicate timesheets for same consultant/week
CREATE UNIQUE INDEX IF NOT EXISTS timesheets_consultant_week_unique 
ON timesheets (consultant_id, job_order_id, week_ending);