/*
  # Candidate Management Schema

  1. New Tables
    - `candidates`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `location` (text)
      - `skills` (text array)
      - `experience_years` (integer)
      - `status` (candidate_status enum)
      - `resume_url` (text, optional)
      - `notes` (text, optional)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `candidates` table
    - Add policies for recruiters, account managers, and administrators
*/

-- Create enum for candidate status
CREATE TYPE candidate_status AS ENUM ('available', 'in_process', 'placed', 'do_not_contact');

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  location text,
  skills text[] DEFAULT '{}',
  experience_years integer DEFAULT 0,
  status candidate_status DEFAULT 'available',
  resume_url text,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Recruiters and managers can view candidates"
  ON candidates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('administrator', 'account_manager', 'recruiter')
    )
  );

CREATE POLICY "Recruiters and managers can manage candidates"
  ON candidates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('administrator', 'account_manager', 'recruiter')
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS candidates_skills_idx ON candidates USING GIN (skills);
CREATE INDEX IF NOT EXISTS candidates_status_idx ON candidates (status);
CREATE INDEX IF NOT EXISTS candidates_name_idx ON candidates (name);
CREATE INDEX IF NOT EXISTS candidates_email_idx ON candidates (email);