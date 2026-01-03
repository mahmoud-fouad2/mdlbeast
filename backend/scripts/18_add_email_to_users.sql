-- Migration 18: Add email column to users table
-- This enables email notifications for approval requests

-- Add email column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE users ADD COLUMN email VARCHAR(255);
    
    -- Add unique constraint
    CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
    
    RAISE NOTICE 'Added email column to users table';
  ELSE
    RAISE NOTICE 'Email column already exists in users table';
  END IF;
END $$;

-- Note: Email is optional, so no NOT NULL constraint
-- Admins should update user emails through the user management interface
