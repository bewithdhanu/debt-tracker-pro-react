/*
  # Create debt activities table

  1. New Tables
    - `debt_activities`
      - `id` (uuid, primary key)
      - `debt_id` (uuid, foreign key to debts)
      - `user_id` (uuid, foreign key to auth.users)
      - `activity_type` (text, enum: 'Payment', 'Interest', 'Additional Loan', 'Note')
      - `amount` (decimal)
      - `activity_date` (date)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `debt_activities` table
    - Add policies for authenticated users to manage their own activities
*/

-- Check if the table already exists before creating it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'debt_activities') THEN
    CREATE TABLE debt_activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      activity_type TEXT NOT NULL CHECK (activity_type IN ('Payment', 'Interest', 'Additional Loan', 'Note')),
      amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      activity_date DATE NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE debt_activities ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can read own debt activities"
      ON debt_activities
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert own debt activities"
      ON debt_activities
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own debt activities"
      ON debt_activities
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete own debt activities"
      ON debt_activities
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);

    -- Create indexes
    CREATE INDEX IF NOT EXISTS debt_activities_user_id_idx ON debt_activities(user_id);
    CREATE INDEX IF NOT EXISTS debt_activities_debt_id_idx ON debt_activities(debt_id);
    CREATE INDEX IF NOT EXISTS debt_activities_activity_date_idx ON debt_activities(activity_date);
  END IF;
END $$;