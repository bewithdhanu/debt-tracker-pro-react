/*
  # Create debts table

  1. New Tables
    - `debts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `contact_id` (uuid, references contacts)
      - `principal_amount` (decimal, not null)
      - `interest_rate` (decimal, not null)
      - `debt_date` (date, not null)
      - `type` (text, not null)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `debts` table
    - Add policies for authenticated users to manage their own debts
*/

CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  principal_amount DECIMAL(12,2) NOT NULL CHECK (principal_amount > 0),
  interest_rate DECIMAL(5,2) NOT NULL CHECK (interest_rate >= 0),
  debt_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('I Owe', 'Owe Me')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own debts
CREATE POLICY "Users can read own debts"
  ON debts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own debts
CREATE POLICY "Users can insert own debts"
  ON debts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own debts
CREATE POLICY "Users can update own debts"
  ON debts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to delete their own debts
CREATE POLICY "Users can delete own debts"
  ON debts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS debts_user_id_idx ON debts(user_id);
CREATE INDEX IF NOT EXISTS debts_contact_id_idx ON debts(contact_id);
CREATE INDEX IF NOT EXISTS debts_type_idx ON debts(type);
CREATE INDEX IF NOT EXISTS debts_debt_date_idx ON debts(debt_date);