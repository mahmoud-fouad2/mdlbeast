-- Add seen_by_requester column to track if user has viewed the response
-- This enables notification badges to show unread responses

ALTER TABLE approval_requests 
ADD COLUMN IF NOT EXISTS seen_by_requester BOOLEAN DEFAULT FALSE;

-- Set existing approved/rejected requests as seen (to avoid showing old notifications)
UPDATE approval_requests 
SET seen_by_requester = TRUE 
WHERE status != 'PENDING';

-- Create index for fast notification queries
CREATE INDEX IF NOT EXISTS idx_approval_requests_seen 
ON approval_requests(requester_id, status, seen_by_requester);

COMMENT ON COLUMN approval_requests.seen_by_requester IS 'Whether requester has seen the manager response (for notification badges)';
