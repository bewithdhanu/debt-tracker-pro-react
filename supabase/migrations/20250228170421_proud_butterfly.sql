/*
  # Fix activity_type constraint in debt_activities table

  1. Changes
     - Update the activity_type check constraint to only allow 'Interest' and 'Note'
     - Remove 'Payment' and 'Additional Loan' as valid types

  2. Security
     - No changes to security policies
*/

-- Update the check constraint for activity_type to only allow 'Interest' and 'Note'
ALTER TABLE debt_activities DROP CONSTRAINT IF EXISTS debt_activities_activity_type_check;
ALTER TABLE debt_activities ADD CONSTRAINT debt_activities_activity_type_check 
  CHECK (activity_type IN ('Interest', 'Note'));