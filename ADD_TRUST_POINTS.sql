-- Add trust_points column to borrowers table
-- This script adds the trust_points column and sets default value to 20 for all existing borrowers

-- Add trust_points column if it doesn't exist
ALTER TABLE borrowers 
ADD COLUMN IF NOT EXISTS trust_points INTEGER DEFAULT 20;

-- Update all existing borrowers to have 20 trust points if they don't have a value
UPDATE borrowers 
SET trust_points = 20 
WHERE trust_points IS NULL;

-- Ensure trust_points cannot be negative (enforce minimum of 0)
ALTER TABLE borrowers 
ADD CONSTRAINT check_trust_points_min CHECK (trust_points >= 0);

