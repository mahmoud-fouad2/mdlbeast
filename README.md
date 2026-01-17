# MDLBEAST Communications System
[![Repository](https://img.shields.io/badge/repo-mdlbeast-blue?logo=github)](https://github.com/mfouad-del/mdlbeast.git)  
Repository: https://github.com/mfouad-del/mdlbeast.git

> **MDLBEAST** is an entertainment company rooted in music culture. Based in Saudi Arabia and shared globally – we are here to amplify the unseen.

## 🚀 Quick Start

### Frontend (Next.js)
```bash
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run dev
```

## 📡 Deployment URLs

- **Frontend**: https://zaco.sa/mdlbeast
- **Backend API**: https://mdlbeast.onrender.com/api
- **Company Website**: https://mdlbeast.com

## 🔐 Environment Variables

### Backend Environment Variables (Render)

```env
# Database
DATABASE_URL=postgresql://mdlbeastdb_user:mRcP7qtpmSBPLIspOOjUBIhRChC5w7En@dpg-d5lkvkvgi27c738vq8g0-a/mdlbeastdb

# Authentication
JWT_SECRET=<YOUR_JWT_SECRET>
REFRESH_TOKEN_SECRET=<YOUR_REFRESH_TOKEN_SECRET>
SESSION_SECRET=<YOUR_SESSION_SECRET>

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://zaco.sa/mdlbeast

# Cloudflare R2 Storage
CF_R2_ACCESS_KEY_ID=ce3791c4a9e76c321fa83d91e83af445
CF_R2_SECRET_ACCESS_KEY=945c78abf90af55ba501fd2a2c82ea40bfedbfc751781a61347a838af621b60e
CF_R2_ENDPOINT=https://de95c4f37b252fdb5c22a69ed3d7d3a1.r2.cloudflarestorage.com
CF_R2_BUCKET=mdlbeast
CF_R2_REGION=auto
R2_PUBLIC_BASE_URL=https://pub-ca46338c34ee4a7a8eff690474faf0c6.r2.dev

# Storage Provider
STORAGE_PROVIDER=r2

# Backups
BACKUPS_ENABLED=true
BACKUP_ENCRYPTION=true
BACKUP_ENC_KEY=<YOUR_BACKUP_ENCRYPTION_KEY>
BACKUP_INTERVAL_DAYS=15
BACKUP_RETENTION_COUNT=6

# Migrations
AUTO_RUN_MIGRATIONS=false

# ⭐ Admin User (Created automatically on startup from these env vars)
SUPER_ADMIN_EMAIL=<ADMIN_EMAIL>
SUPER_ADMIN_PASSWORD=<ADMIN_PASSWORD>
SUPER_ADMIN_NAME=MDLBEAST Administrator

# ⭐ Test User (Optional - Created automatically on startup from these env vars)
TEST_USER_EMAIL=<TEST_USER_EMAIL>
TEST_USER_PASSWORD=<TEST_USER_PASSWORD>
TEST_USER_NAME=MDLBEAST Staff

# Debug (Optional)
DEBUG_SECRET=<YOUR_DEBUG_SECRET>

# Email (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=<YOUR_EMAIL>
EMAIL_PASS=<YOUR_APP_PASSWORD>

# AI Keys (Optional)
GEMINI_API_KEY=<YOUR_KEY>
GROQ_API_KEY=<YOUR_KEY>
```

### Frontend Environment Variables

```env
NEXT_PUBLIC_API_URL=https://mdlbeast.onrender.com/api
NEXT_BASE_PATH=/mdlbeast
```

## 📦 Database Info

### Connection Details
- **Host**: dpg-d5lkvkvgi27c738vq8g0-a.virginia-postgres.render.com
- **Database**: mdlbeastdb
- **Username**: mdlbeastdb_user
- **Password**: mRcP7qtpmSBPLIspOOjUBIhRChC5w7En
- **Port**: 5432

### Internal URL (Render Services)
```
postgresql://mdlbeastdb_user:mRcP7qtpmSBPLIspOOjUBIhRChC5w7En@dpg-d5lkvkvgi27c738vq8g0-a/mdlbeastdb
```

### External URL
```
postgresql://mdlbeastdb_user:mRcP7qtpmSBPLIspOOjUBIhRChC5w7En@dpg-d5lkvkvgi27c738vq8g0-a.virginia-postgres.render.com/mdlbeastdb
```

### PSQL Command
```bash
PGPASSWORD=mRcP7qtpmSBPLIspOOjUBIhRChC5w7En psql -h dpg-d5lkvkvgi27c738vq8g0-a.virginia-postgres.render.com -U mdlbeastdb_user mdlbeastdb
```

## 🗄️ R2 Storage Info

### Bucket Details
- **Bucket Name**: mdlbeast
- **Endpoint**: https://de95c4f37b252fdb5c22a69ed3d7d3a1.r2.cloudflarestorage.com
- **Public URL**: https://pub-ca46338c34ee4a7a8eff690474faf0c6.r2.dev
- **Token**: rYWbTJ-jdUr7YW4V2ZJcGWWwKyUiNwR_ONoxLT2F
- **Access Key ID**: ce3791c4a9e76c321fa83d91e83af445
- **Secret Access Key**: 945c78abf90af55ba501fd2a2c82ea40bfedbfc751781a61347a838af621b60e

## 👤 Default Users

Users are created automatically from environment variables when the server starts:

### Admin User
Set these environment variables on Render:
- `SUPER_ADMIN_EMAIL` - Admin email/username
- `SUPER_ADMIN_PASSWORD` - Admin password
- `SUPER_ADMIN_NAME` - Admin display name (optional)

### Test User (Optional)
Set these environment variables on Render:
- `TEST_USER_EMAIL` - Test user email/username
- `TEST_USER_PASSWORD` - Test user password  
- `TEST_USER_NAME` - Test user display name (optional)

## 📱 PWA Installation

The app supports installation on:
- Windows (Chrome/Edge)
- macOS (Chrome/Edge)
- Android
- iOS (Add to Home Screen)

## 🔧 Features

- ✅ Document Management System
- ✅ Approval Workflow
- ✅ Digital Signatures
- ✅ Barcode Tracking
- ✅ Report Generation
- ✅ User Management
- ✅ Backup System
- ✅ PWA Support (Desktop/Mobile Installation)
- ✅ RTL Arabic Support

## 📄 License

All Rights Reserved - MDLBEAST Entertainment Company © 2025
