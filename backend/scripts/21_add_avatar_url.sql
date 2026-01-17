-- Migration: Add avatar_url column to users table
-- Date: 2026-01-17
-- Description: Add avatar_url field to store user profile pictures

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON users(avatar_url) WHERE avatar_url IS NOT NULL;

-- Comment
COMMENT ON COLUMN users.avatar_url IS 'URL or R2 key for user avatar/profile picture';
