/*
  # Client Management Schema

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `company_name` (text)
      - `primary_contact` (text)
      - `email` (text)
      - `phone` (text)
      - `address` (text)
      - `status` (client_status enum)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `clients` table
    - Add policies for account managers and administrators
*/

-- Create enum for client status
CREATE TYPE client_status AS ENUM ('active', 'inactive');

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  primary_contact text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  status client_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Account managers and administrators can view clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role IN ('administrator', 'account_manager', 'recruiter', 'finance')
    )
  );

CREATE POLICY "Account managers and administrators can manage clients"
  ON clients
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
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();