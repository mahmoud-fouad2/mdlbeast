# MDLBEAST System - API Endpoints Flowchart

## 📡 Complete Endpoint Mapping (Frontend ↔ Backend)

### 🔐 Authentication (`/api/auth`)
- **POST /api/auth/login** → Login user with credentials
  - Frontend: `apiClient.login()`
  - Backend: `/backend/src/routes/auth.ts`
- **POST /api/auth/logout** → Logout user
  - Frontend: `apiClient.logout()`  
  - Backend: `/backend/src/routes/auth.ts`
- **POST /api/auth/refresh** → Refresh JWT token
  - Frontend: `apiClient.refreshToken()`
  - Backend: `/backend/src/routes/auth.ts`
- **GET /api/auth/me** → Get current user info
  - Frontend: `apiClient.getCurrentUser()`
  - Backend: `/backend/src/routes/auth.ts`
- **PUT /api/auth/change-password** → Change password
  - Frontend: `apiClient.changePassword()`
  - Backend: `/backend/src/routes/auth.ts`

### 📄 Documents (`/api/documents`)
- **GET /api/documents** → List documents with filters
  - Frontend: `apiClient.getDocuments()`
  - Backend: `/backend/src/routes/documents.ts`
- **POST /api/documents** → Create new document  
  - Frontend: `apiClient.createDocument()`
  - Backend: `/backend/src/routes/documents.ts`
- **GET /api/documents/:id** → Get document by ID
  - Frontend: `apiClient.getDocumentById()`
  - Backend: `/backend/src/routes/documents.ts`
- **PUT /api/documents/:id** → Update document
  - Frontend: `apiClient.updateDocument()`
  - Backend: `/backend/src/routes/documents.ts`
- **DELETE /api/documents/:id** → Delete document
  - Frontend: `apiClient.deleteDocument()`
  - Backend: `/backend/src/routes/documents.ts`

### 👥 Users (`/api/users`)
- **GET /api/users** → List all users
  - Frontend: `apiClient.getUsers()`
  - Backend: `/backend/src/routes/users.ts`
- **POST /api/users** → Create new user
  - Frontend: `apiClient.createUser()`
  - Backend: `/backend/src/routes/users.ts`
- **PUT /api/users/:id** → Update user
  - Frontend: `apiClient.updateUser()`
  - Backend: `/backend/src/routes/users.ts`
- **DELETE /api/users/:id** → Delete user
  - Frontend: `apiClient.deleteUser()`
  - Backend: `/backend/src/routes/users.ts`
- **GET /api/users/managers** → Get managers list
  - Frontend: `apiClient.request('/users/managers')`
  - Backend: `/backend/src/routes/users.ts`

### 📝 Approvals System (`/api/approvals`)
- **GET /api/approvals/my-requests** → Get my approval requests
  - Frontend: `apiClient.getMyApprovalRequests()`
  - Backend: `/backend/src/routes/approvals.ts`
- **GET /api/approvals/pending** → Get pending approvals
  - Frontend: `apiClient.getPendingApprovals()`
  - Backend: `/backend/src/routes/approvals.ts`
- **POST /api/approvals** → Create approval request
  - Frontend: `apiClient.createApprovalRequest()`
  - Backend: `/backend/src/routes/approvals.ts`
- **PUT /api/approvals/:id** → Update approval status
  - Frontend: `apiClient.updateApprovalRequest()`
  - Backend: `/backend/src/routes/approvals.ts`
- **GET /api/approvals/:id/attachment-url** → Get signed attachment URL
  - Frontend: `apiClient.getApprovalAttachmentUrl()`
  - Backend: `/backend/src/routes/approvals.ts`
- **GET /api/approvals/notifications/count** → Get notification count
  - Frontend: `apiClient.getApprovalsNotificationCount()`
  - Backend: `/backend/src/routes/approvals.ts`

### 💬 Internal Communications (`/api/internal-comm`)
- **GET /api/internal-comm** → Get messages
  - Frontend: `apiClient.request('/internal-comm')`
  - Backend: `/backend/src/routes/internalMessages.ts`
- **POST /api/internal-comm** → Send message
  - Frontend: `apiClient.request('/internal-comm', {method: 'POST'})`
  - Backend: `/backend/src/routes/internalMessages.ts`
- **PUT /api/internal-comm/:id** → Edit message
  - Frontend: Custom request
  - Backend: `/backend/src/routes/internalMessages.ts`
- **DELETE /api/internal-comm/:id** → Delete message
  - Frontend: Custom request
  - Backend: `/backend/src/routes/internalMessages.ts`
- **GET /api/internal-comm/users** → Get users for mentions
  - Frontend: `apiClient.request('/internal-comm/users')`
  - Backend: `/backend/src/routes/internalMessages.ts`

### 📊 Audit Logs (`/api/audit`)
- **GET /api/audit** → Get audit logs with pagination
  - Frontend: `apiClient.getAuditLogs()`
  - Backend: `/backend/src/routes/audit.ts`
- **POST /api/audit/clear** → Clear all audit logs
  - Frontend: Custom request
  - Backend: `/backend/src/routes/audit.ts`

### 📤 Uploads (`/api/uploads`)
- **POST /api/uploads** → Upload file to R2/S3
  - Frontend: `apiClient.uploadFile()`
  - Backend: `/backend/src/routes/uploads.ts`
- **DELETE /api/uploads** → Delete uploaded file
  - Frontend: `apiClient.deleteUpload()`
  - Backend: `/backend/src/routes/uploads.ts`

### 🏷️ Barcodes (`/api/barcodes`)
- **GET /api/barcodes/search** → Search document by barcode
  - Frontend: Custom request
  - Backend: `/backend/src/routes/barcodes.ts`
- **GET /api/barcodes/timeline/:id** → Get document timeline
  - Frontend: Custom request
  - Backend: `/backend/src/routes/barcodes.ts`

### ✏️ Stamp Service (`/api/stamp`)
- **POST /api/stamp** → Stamp/Sign PDF document
  - Frontend: Custom request
  - Backend: `/backend/src/routes/stamp.ts`

### 💾 Backups (`/api/backups`) ⚠️ NEEDS ADMIN
- **GET /api/backups** → List all backups
  - Frontend: `apiClient.listBackups()`
  - Backend: `/backend/src/routes/backups.ts`
  - **Issue**: Returns 404 if not admin
- **POST /api/backups** → Create full backup
  - Frontend: `apiClient.createBackup()`
  - Backend: `/backend/src/routes/backups.ts`
  - **Issue**: Returns 404 if not admin

### 🔧 Admin Status (`/api/admin`)
- **GET /api/admin/status** → Get system status
  - Frontend: Custom request
  - Backend: `/backend/src/routes/adminStatus.ts`
- **GET /api/admin/maintenance-status** → Get maintenance info
  - Frontend: Custom request
  - Backend: `/backend/src/routes/adminStatus.ts`
- **GET /api/admin/data-integrity** → Check data integrity
  - Frontend: Custom request
  - Backend: **❌ MISSING - NEEDS IMPLEMENTATION**

### 🔔 Notifications (`/api/notifications`)
- **GET /api/notifications** → Get notifications
  - Frontend: `apiClient.getNotifications()`
  - Backend: `/backend/src/routes/notifications.ts`
- **GET /api/notifications/count** → Get unread count
  - Frontend: `apiClient.getNotificationsCount()`
  - Backend: `/backend/src/routes/notifications.ts`
- **PUT /api/notifications/:id/read** → Mark as read
  - Frontend: Custom request
  - Backend: `/backend/src/routes/notifications.ts`

---

## 🐛 Identified Issues

### 1. ❌ Missing Endpoint: `/api/admin/data-integrity`
**Frontend calls it but backend doesn't implement it**
- Location: `AdminStatus.tsx` component
- Fix: Add endpoint to `/backend/src/routes/adminStatus.ts`

### 2. ⚠️ Permission Issue: Backups return 404 instead of 403
**Backend**: `/backend/src/routes/backups.ts` Line 17
```typescript
if (!allowDebugAccess(req, true)) {
  res.status(404).json({ error: 'Not found' }) // Should be 403
  return false
}
```
**Fix**: Change to proper permission check

### 3. ⚠️ Internal Communications Permission
**Component**: `InternalCommunication.tsx` Line 57
```typescript
const canStartChat = Boolean((currentUser as any)?.permissions?.communication?.access_chat);
```
**Issue**: Admin user might not have explicit `permissions` object or it's checking wrong path
**Fix**: Always allow admin users or fix permission check

### 4. ⚠️ Approvals Submit Button
**No error in logs** - Check if:
- User has `manager_id` set in database
- Form validation passes
- Network request actually fires

---

## 🔄 Request Flow Example

```
USER ACTION (Frontend)
    ↓
apiClient.method() (lib/api-client.ts)
    ↓
HTTP Request with JWT token
    ↓
Express Server (backend/src/server.ts)
    ↓
Middleware: authenticateToken (auth check)
    ↓
Route Handler (backend/src/routes/*.ts)
    ↓
Database Query (PostgreSQL)
    ↓
Response to Frontend
    ↓
Update UI State
```

---

## ✅ Verified Working Endpoints
- ✅ Auth (login, logout, refresh, me)
- ✅ Documents (CRUD operations)
- ✅ Users (CRUD operations)
- ✅ Approvals (create, list, update)
- ✅ Internal Comm (messages, typing)
- ✅ Uploads (file upload to R2)
- ✅ Audit logs (read, clear)
- ✅ Barcodes (search)

## ⚠️ Needs Attention
- ⚠️ Backups (permission check returns 404)
- ⚠️ Data Integrity (endpoint missing)
- ⚠️ Internal Comm (permission issue for admin)
