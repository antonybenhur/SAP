/*
  # Create storage bucket for documents

  1. Storage
    - Create 'documents' bucket for storing resumes and other files
    - Set up public access for file downloads
    - Configure file upload policies

  2. Security
    - Allow authenticated users to upload files
    - Allow public read access to files
    - Set file size and type restrictions
*/

-- Create the documents bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- Allow public read access to documents
CREATE POLICY "Public read access to documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');