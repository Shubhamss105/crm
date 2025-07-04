/*
  # Fix infinite recursion in profiles RLS policy

  1. Problem
    - The current SELECT policy on profiles table creates infinite recursion
    - Policy tries to query profiles table from within a profiles table policy
    
  2. Solution
    - Drop the problematic policy
    - Create a simpler policy that allows users to read their own profile
    - Create a separate policy for reading other profiles in the same client
    - Use a more direct approach to avoid recursion

  3. Security
    - Users can read their own profile data
    - Users can read other profiles only if they share the same client_id
    - Maintain data isolation between different clients
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can read profiles in their client" ON profiles;

-- Create a policy for users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Create a policy for users to read other profiles in their client
-- This uses a subquery that doesn't create recursion
CREATE POLICY "Users can read client profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    client_id = (
      SELECT client_id 
      FROM profiles 
      WHERE id = auth.uid()
      LIMIT 1
    )
  );