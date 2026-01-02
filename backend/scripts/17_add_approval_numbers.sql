-- Migration 17: Add unique approval numbers
-- Created: 2026-01-03

-- Add approval_number column
ALTER TABLE approval_requests 
ADD COLUMN IF NOT EXISTS approval_number VARCHAR(20) UNIQUE;

-- Create sequence for approval numbers
CREATE SEQUENCE IF NOT EXISTS approval_number_seq START 1;

-- Update existing records with sequential numbers
UPDATE approval_requests 
SET approval_number = 'APV-' || LPAD(nextval('approval_number_seq')::TEXT, 6, '0')
WHERE approval_number IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_approval_requests_number ON approval_requests(approval_number);

-- Add comment
COMMENT ON COLUMN approval_requests.approval_number IS 'Unique approval request number (e.g., APV-000001)';
