/*
  # Fix clients table RLS policy for user registration

  1. Security Changes
    - Add INSERT policy for clients table to allow authenticated users to create organizations
    - This enables new user registration with client creation

  2. Policy Details
    - Allow authenticated users to insert new client records
    - Required for the sign-up process to work properly
*/

-- Add INSERT policy for clients table to allow authenticated users to create organizations
CREATE POLICY "Authenticated users can create clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);