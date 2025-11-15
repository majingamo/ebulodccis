-- Add 5 Borrower Accounts to Supabase
-- Run this in Supabase SQL Editor

INSERT INTO borrowers (id, password, name, email, course, year_level, status) 
VALUES 
  ('23-140133', 'student1', 'Gabriel Gamo', 'gabrielgamo@mmsu.edu.ph', 'BS Information Technology', '3rd Year', 'active'),
  ('23-140143', 'student2', 'Sherwin Angelo Pesado', 'sherwinangelopesado@mmsu.edu.ph', 'BS Information Technology', '3rd Year', 'active'),
  ('23-140147', 'student3', 'Ace John Reyes', 'acejohnreyes@mmsu.edu.ph', 'BS Information Technology', '3rd Year', 'active'),
  ('23-140096', 'student4', 'Lebron Amores', 'lebronamores@mmsu.edu.ph', 'BS Information Technology', '3rd Year', 'active');

-- Verify the accounts were added
SELECT id, name, email, course, year_level, status FROM borrowers WHERE id IN ('23-140133', '23-140143', '23-140147', '23-140096');

