/*
  # Job Orders Management Schema

  1. New Tables
    - `job_orders`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `title` (text)
      - `description` (text)
      - `required_skills` (text array)
      - `experience_level` (text)
      - `duration` (text)
      - `billing_rate` (decimal)
      - `status` (job_order_status enum)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `job_orders` table
    - Add policies for account managers, recruiters, and administrators
*/

-- Create enum for job order status
CREATE TYPE job_order_status AS ENUM ('open', 'interviewing', 'filled', 'closed');

-- Create job_orders table
CREATE TABLE IF NOT EXISTS job_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  required_skills text[] DEFAULT '{}',
  experience_level text,
  duration text,
  billing_rate decimal(10,2),
  status job_order_status DEFAULT 'open',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE job_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Staff can view job orders"
  ON job_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('administrator', 'account_manager', 'recruiter')
    )
  );

CREATE POLICY "Account managers and administrators can manage job orders"
  ON job_orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('administrator', 'account_manager')
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_job_orders_updated_at
  BEFORE UPDATE ON job_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS job_orders_client_id_idx ON job_orders (client_id);
CREATE INDEX IF NOT EXISTS job_orders_status_idx ON job_orders (status);
CREATE INDEX IF NOT EXISTS job_orders_skills_idx ON job_orders USING GIN (required_skills);