-- Add trust_points_change column to equipment_history table
-- This column tracks trust points changes when equipment is returned

-- Add trust_points_change column if it doesn't exist
ALTER TABLE equipment_history 
ADD COLUMN IF NOT EXISTS trust_points_change INTEGER DEFAULT NULL;

-- Add a comment to explain the column
COMMENT ON COLUMN equipment_history.trust_points_change IS 'Trust points change when equipment was returned (positive for gains, negative for deductions, NULL if no change)';

