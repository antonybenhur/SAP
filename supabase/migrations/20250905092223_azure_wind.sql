/*
  # Create storage bucket for candidate documents

  1. Storage Setup
    - Create 'documents' bucket for CV/resume storage
    - Configure bucket as private (not public)
  
  2. Note
    - RLS policies for storage.objects cannot be created via SQL migrations
    - These must be configured through Supabase Dashboard under Storage > Policies
    - Or use Supabase CLI (not available in WebContainer)
*/

-- Create the documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents', 
  false,
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;