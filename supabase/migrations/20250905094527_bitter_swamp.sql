/*
  # Add ID Card and Profile Photo fields to candidates

  1. New Fields
    - `id_card_url` (text) - URL/path to uploaded ID card document
    - `profile_photo_url` (text) - URL/path to uploaded profile photo

  2. Storage
    - Files will be stored in existing 'documents' bucket
    - Organized by file type: id-cards/ and profile-photos/

  3. Security
    - Same RLS policies apply as existing document storage
*/

DO $$
BEGIN
  -- Add ID card URL field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'id_card_url'
  ) THEN
    ALTER TABLE candidates ADD COLUMN id_card_url text;
  END IF;

  -- Add profile photo URL field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'profile_photo_url'
  ) THEN
    ALTER TABLE candidates ADD COLUMN profile_photo_url text;
  END IF;
END $$;