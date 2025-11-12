/*
  # Fix profiles table constraints

  1. Changes
    - Remove foreign key constraint from profiles table
    - Add conditional checks for existing policies
    - Ensure proper error handling for duplicate objects

  2. Security
    - Maintain existing RLS policies
    - Keep authentication trigger function
*/

-- Remove the foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
END $$;

-- Create policies only if they don't exist
DO $$
BEGIN
  -- Users can view their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  -- Users can update their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  -- Administrators can view all profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Administrators can view all profiles'
  ) THEN
    CREATE POLICY "Administrators can view all profiles"
      ON profiles
      FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM profiles profiles_1
        WHERE profiles_1.id = auth.uid() 
        AND profiles_1.role = 'administrator'::user_role
      ));
  END IF;

  -- Administrators can manage all profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Administrators can manage all profiles'
  ) THEN
    CREATE POLICY "Administrators can manage all profiles"
      ON profiles
      FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM profiles profiles_1
        WHERE profiles_1.id = auth.uid() 
        AND profiles_1.role = 'administrator'::user_role
      ));
  END IF;
END $$;