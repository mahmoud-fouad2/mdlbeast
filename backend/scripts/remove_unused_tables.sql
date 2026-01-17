-- ============================================================================
-- MDLBEAST Communications - Remove Unused Tables
-- ============================================================================
-- This script removes tables that are not needed for MDLBEAST operations:
-- - clients (not used)
-- - projects (not used)
-- - tenants (multi-tenant not needed)
-- - payment_requests (not used)
-- - supervision_reports (not used)
-- 
-- CAUTION: This will delete data permanently. Backup first!
-- ============================================================================

BEGIN;

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS supervision_reports CASCADE;
DROP TABLE IF EXISTS payment_requests CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Remove tenant_id column from users table if it exists
ALTER TABLE users DROP COLUMN IF EXISTS tenant_id CASCADE;

-- Remove tenant_id column from documents table if it exists
ALTER TABLE documents DROP COLUMN IF EXISTS tenant_id CASCADE;

COMMIT;

-- Verify tables are removed
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('clients', 'projects', 'tenants', 'payment_requests', 'supervision_reports')
ORDER BY table_name;

-- Should return 0 rows if successful
