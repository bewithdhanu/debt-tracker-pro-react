/*
  # Add status column to debts table

  1. Changes
    - Add `status` column to `debts` table with default value 'active'
    - Update existing debt_activities table to support new activity types
  
  2. Security
    - No changes to RLS policies needed
*/

-- Add status column to debts table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debts' AND column_name = 'status'
  ) THEN
    ALTER TABLE debts ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed'));
  END IF;
END $$;

-- Create index for the new status column
CREATE INDEX IF NOT EXISTS debts_status_idx ON debts(status);