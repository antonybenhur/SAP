/*
  # Fix profile insertion during signup

  1. Security Changes
    - Add INSERT policy for profiles table to allow users to create their own profile during signup
    - This policy allows authenticated users to insert a profile record where the id matches their auth.uid()

  2. Notes
    - This resolves the "Database error saving new user" issue during signup
    - The policy ensures users can only create profiles for themselves
*/

-- Add INSERT policy for profiles to allow users to create their own profile during signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;