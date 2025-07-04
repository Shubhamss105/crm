/*
  # Initial CRM Schema

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `name` (text)
      - `domain` (text, unique)
      - `settings` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `name` (text)
      - `role` (text)
      - `team` (text)
      - `avatar_url` (text)
      - `phone` (text)
      - `location` (text)
      - `bio` (text)
      - `timezone` (text)
      - `language` (text)
      - `date_format` (text)
      - `client_id` (uuid, references clients)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `leads`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `company` (text)
      - `source` (text)
      - `score` (integer)
      - `status` (text)
      - `assigned_to` (text)
      - `location` (text)
      - `notes` (text)
      - `tags` (text array)
      - `client_id` (uuid, references clients)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for client-based data isolation
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text UNIQUE NOT NULL,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'sales' CHECK (role IN ('admin', 'manager', 'sales', 'marketing')),
  team text DEFAULT 'Sales',
  avatar_url text,
  phone text,
  location text,
  bio text,
  timezone text DEFAULT 'America/New_York',
  language text DEFAULT 'en',
  date_format text DEFAULT 'MM/DD/YYYY',
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  source text DEFAULT 'manual' CHECK (source IN ('website', 'email', 'social', 'referral', 'manual')),
  score integer DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted')),
  assigned_to text,
  location text,
  notes text,
  tags text[] DEFAULT '{}',
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policies for clients table
CREATE POLICY "Users can read their own client data"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own client data"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policies for profiles table
CREATE POLICY "Users can read profiles in their client"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Policies for leads table
CREATE POLICY "Users can read leads in their client"
  ON leads
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert leads in their client"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update leads in their client"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete leads in their client"
  ON leads
  FOR DELETE
  TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_clients_domain ON clients(domain);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();