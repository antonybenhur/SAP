/*
  # Add flexible billing structure to job orders

  1. New Fields
    - `billing_structure` (enum: 'hourly', 'monthly', 'project_based')
    - `monthly_billing_rate` (numeric for monthly rates)
    - `project_total_value` (numeric for project-based billing)
    - `monthly_target_pay_min` and `monthly_target_pay_max` (for monthly pay ranges)

  2. Updates
    - Add new enum type for billing structure
    - Add new columns to job_orders table
    - Update indexes for performance
*/

-- Create billing structure enum
CREATE TYPE billing_structure AS ENUM ('hourly', 'monthly', 'project_based');

-- Add new columns to job_orders table
ALTER TABLE job_orders 
ADD COLUMN billing_structure billing_structure DEFAULT 'hourly',
ADD COLUMN monthly_billing_rate numeric(10,2),
ADD COLUMN project_total_value numeric(12,2),
ADD COLUMN monthly_target_pay_min numeric(10,2),
ADD COLUMN monthly_target_pay_max numeric(10,2);

-- Add indexes for performance
CREATE INDEX job_orders_billing_structure_idx ON job_orders(billing_structure);

-- Update the view to include new billing fields
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