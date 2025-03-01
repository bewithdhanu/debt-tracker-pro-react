/*
  # Add columns to debt_activities table

  1. Changes
    - Add `months` column to store number of months for interest calculations
    - Add `closing_debt` column to track when a debt is being closed
  
  2. Security
    - No changes to security policies
*/

-- Add months column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debt_activities' AND column_name = 'months'
  ) THEN
    ALTER TABLE debt_activities ADD COLUMN months INTEGER;
  END IF;
END $$;

-- Add closing_debt column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debt_activities' AND column_name = 'closing_debt'
  ) THEN
    ALTER TABLE debt_activities ADD COLUMN closing_debt BOOLEAN DEFAULT FALSE;
  END IF;
END $$;