-- 06_add_documents_tenant.sql
-- Add tenant_id to documents table and index it

ALTER TABLE documents ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
