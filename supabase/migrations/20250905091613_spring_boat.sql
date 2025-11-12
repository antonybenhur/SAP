/*
  # Update user role to administrator

  1. Changes
    - Update antonybenhur@gmail.com role from consultant to administrator
    - This will give the user full access to all features in the application

  2. Security
    - Updates existing user profile
    - Grants administrator privileges
*/

UPDATE profiles 
SET role = 'administrator'::user_role,
    updated_at = now()
WHERE email = 'antonybenhur@gmail.com';