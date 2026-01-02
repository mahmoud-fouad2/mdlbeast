# Render Deployment Steps - URGENT

## Problem
Backend on Render is returning 500 error when updating tenant signature because:
1. The backend code hasn't been deployed yet (still old version without signature_url support)
2. OR the database migration hasn't been run on the live Postgres

## Solution

### Step 1: Trigger Render Deploy
Go to Render Dashboard → Your Backend Service → **Manual Deploy** → Deploy latest commit

Wait for deployment to complete (usually 2-3 minutes)

### Step 2: Run Migration on Live Database
Once deployed, go to Render → Backend Service → **Shell** and run:

```bash
cd /opt/render/project/src/backend
node scripts/run_migrations.js
```

This will apply:
- `03_create_modules_tables.sql` (creates tenants table with signature_url)
- `15_add_tenant_signature.sql` (adds signature_url column if missing)
- `14_create_approvals_system.sql` (creates approvals system)

### Step 3: Verify
After migration completes, test uploading tenant signature from the UI.

## Alternative (if run_migrations.js fails on Render)
If the Node.js script doesn't work in Render shell, use psql directly:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /opt/render/project/src/backend/scripts/15_add_tenant_signature.sql
```

## What Changed
- Added `signature_url TEXT` column to `tenants` table
- Updated `/api/tenants/:id` PUT endpoint to accept `signature_url`
- Frontend now uploads signature images to `uploads/signatures/` folder on R2
- Approvals system uses tenant signature when approving requests

## Current Status
✅ Local database: Migration applied successfully
❌ Render database: Migration pending (needs manual run)
✅ Frontend: Built and ready to deploy
⏳ Backend: Needs deployment to Render
