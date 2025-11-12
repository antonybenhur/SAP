/*
  # Enhanced Client Management System

  1. New Tables
    - `client_contacts` - Multiple contacts per client with roles
    - Enhanced `clients` table with comprehensive fields
  
  2. New Enums
    - `client_tier` - Strategic, Active, Prospect, Past Client
    - `msa_status` - Signed, In Negotiation, Expired, Not Required
    - `payment_terms` - Net 15, Net 30, Net 45, Net 60
  
  3. Security
    - Enable RLS on new tables
    - Add policies for account managers and administrators
  
  4. Indexes
    - Performance indexes for filtering and searching
*/

-- Create enums for structured data
CREATE TYPE client_tier AS ENUM ('strategic', 'active', 'prospect', 'past_client');
CREATE TYPE msa_status AS ENUM ('signed', 'in_negotiation', 'expired', 'not_required');
CREATE TYPE payment_terms AS ENUM ('net_15', 'net_30', 'net_45', 'net_60');

-- Add new fields to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS account_owner uuid REFERENCES profiles(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_tier client_tier DEFAULT 'prospect';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_address text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_terms payment_terms DEFAULT 'net_30';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS default_markup_percentage numeric(5,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS primary_tech_stack text[];
ALTER TABLE clients ADD COLUMN IF NOT EXISTS typical_interview_process text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS submission_requirements text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS msa_status msa_status DEFAULT 'not_required';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS msa_expiration_date date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_document_url text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes text;

-- Create client_contacts table
CREATE TABLE IF NOT EXISTS client_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  email text NOT NULL,
  phone text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for client_contacts
CREATE POLICY "Account managers and administrators can manage client contacts"
  ON client_contacts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('administrator', 'account_manager')
    )
  );

CREATE POLICY "Staff can view client contacts"
  ON client_contacts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('administrator', 'account_manager', 'recruiter', 'finance')
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS clients_account_owner_idx ON clients(account_owner);
CREATE INDEX IF NOT EXISTS clients_client_tier_idx ON clients(client_tier);
CREATE INDEX IF NOT EXISTS clients_industry_idx ON clients(industry);
CREATE INDEX IF NOT EXISTS clients_msa_status_idx ON clients(msa_status);
CREATE INDEX IF NOT EXISTS clients_msa_expiration_idx ON clients(msa_expiration_date);
CREATE INDEX IF NOT EXISTS clients_tech_stack_idx ON clients USING gin(primary_tech_stack);

CREATE INDEX IF NOT EXISTS client_contacts_client_id_idx ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS client_contacts_email_idx ON client_contacts(email);
CREATE INDEX IF NOT EXISTS client_contacts_is_primary_idx ON client_contacts(is_primary);

-- Add trigger for updated_at
CREATE TRIGGER update_client_contacts_updated_at
  BEFORE UPDATE ON client_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();