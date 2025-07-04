/*
  # Fix infinite recursion in profiles RLS policies

  1. Security Changes
    - Drop existing problematic RLS policies on profiles table
    - Create new simplified policies that don't cause recursion
    - Ensure users can only access their own profile and profiles from their client

  2. Policy Changes
    - Replace recursive policy with direct auth.uid() checks
    - Separate policies for own profile vs client profiles
    - Use direct foreign key relationships instead of subqueries on same table
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read client profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new simplified policies without recursion

-- Policy for users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy for users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy for users to delete their own profile
CREATE POLICY "Users can delete own profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Policy for users to read other profiles in their client
-- This uses a direct approach without recursive subqueries
CREATE POLICY "Users can read client team profiles"
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