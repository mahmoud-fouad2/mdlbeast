# Admin System Status - Action Scripts Reference

This document maps all Admin Status buttons to their corresponding backend endpoints and functionality.

## 🟢 Active Functions (Working)

### Row 1: Core Maintenance
1. **Clear Cache** (مسح الذاكرة المؤقتة)
   - Frontend: `clearCache()`
   - Backend: `POST /api/admin/clear-cache`
   - Function: Clears server log buffer and caches

2. **Optimize Indexes** (تحسين الفهارس)
   - Frontend: `optimizeIndexes()`
   - Backend: `POST /api/admin/optimize-indexes`
   - Function: Runs `ANALYZE` on main tables (documents, users, audit_logs)

3. **Check Connection** (فحص الاتصال)
   - Frontend: `checkDatabaseConnection()`
   - Backend: `GET /api/admin/health-check`
   - Function: Tests database connectivity

4. **Restart Services** (إعادة التشغيل)
   - Frontend: `restartServices()`
   - Backend: `POST /api/admin/restart-services`
   - Function: Clears all caches and resets state

### Row 2: Advanced Tools
5. **Reset Sequences** (إعادة ضبط التسلسلات)
   - Frontend: `resetSequences()`
   - Backend: `POST /api/admin/fix-sequences` OR `POST /api/admin/reset-sequences`
   - Function: Recalculates and resets document barcode sequences (IN/OUT)

6. **Clean Temp Files** (تنظيف الملفات المؤقتة)
   - Frontend: `cleanTempFiles()`
   - Backend: `POST /api/admin/clean-temp`
   - Function: Deletes orphaned/invalid document records

7. **Check Integrity** (فحص سلامة البيانات)
   - Frontend: `checkDataIntegrity()`
   - Backend: Client-side validation
   - Function: Validates data consistency (frontend only)

8. **Analyze Performance** (تحليل الأداء)
   - Frontend: `analyzePerformance()`
   - Backend: Client-side metrics
   - Function: Measures API latency and memory usage

## 🔵 Backup System (Fully Operational)

### Backup Module (`/api/backups`)
- **Create Backup**: `POST /api/backups`
  - Creates full system backup (DB dump + uploads + settings)
  - Supports AES-256-GCM encryption
  - Supports GPG encryption
  - Auto-retention management

- **List Backups**: `GET /api/backups`
  - Lists all backups from R2 storage
  - Shows size, date, type

- **Download Backup**: `GET /api/backups/download?key=...`
  - Generates signed URL for backup download
  - 20-minute expiration

- **Delete Backup**: `DELETE /api/backups?key=...`
  - Removes backup from R2 storage

### Backup Service (`backend/src/lib/backup-service.ts`)
- `createAndUploadBackup()`: Main backup creation function
- Uses `pg_dump` for database export
- Copies `uploads/` directory
- Snapshots system settings
- Creates `.tar.gz` archive
- Encrypts if configured
- Uploads to Cloudflare R2

## 🟡 Status Monitoring

### System Status (`GET /api/admin/status`)
Returns:
- Health status
- Uptime
- Version
- Memory usage
- CPU usage
- Database query count
- Storage size
- Environment configuration (R2, Supabase, Backups)
- Last 500 log entries

### Database Stats (`GET /api/admin/db-stats`)
Returns:
- Document count
- User count
- Audit log count
- Total storage size

## 🔧 Configuration

### Environment Variables
```env
# Backups
BACKUP_ENCRYPTION=true
BACKUP_ENC_KEY=<base64-32-byte-key>
BACKUP_ENCRYPTION_GPG=false
BACKUP_GPG_RECIPIENT=<email>
BACKUP_RETENTION_COUNT=6
BACKUPS_ENABLED=true

# Storage
CF_R2_ACCESS_KEY_ID=<key>
CF_R2_SECRET_ACCESS_KEY=<secret>
CF_R2_ENDPOINT=<endpoint>
CF_R2_BUCKET=<bucket>
```

## ✅ Verification

All admin functions are **operational** and **connected**:
- ✅ Cache management works
- ✅ Index optimization works
- ✅ Database health checks work
- ✅ Sequence reset works
- ✅ Temp file cleanup works
- ✅ Backup creation works
- ✅ Backup download works
- ✅ Backup deletion works
- ✅ All scripts are present in `backend/scripts/`

## 📝 Notes

- Admin Status page requires admin role
- Backup operations require authentication
- All actions are logged
- Maintenance mode blocks regular users
- Sequences auto-fix on creation

---

**Status:** ✅ All systems operational  
**Last Verified:** 2026-01-18
