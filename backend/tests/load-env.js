/**
 * ============================================================================
 * Load Environment Variables for Tests
 * ============================================================================
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// If .env doesn't exist, set from inline values
if (!process.env.DATABASE_URL) {
  process.env.AUTO_RUN_MIGRATIONS = 'true';
  process.env.BACKUPS_ENABLED = 'true';
  process.env.BACKUP_ENCRYPTION = 'true';
  process.env.BACKUP_ENC_KEY = '3h8f9VnJkT2iLpQ1s7wX9yZbA0dE6G5H';
  process.env.BACKUP_INTERVAL_DAYS = '15';
  process.env.BACKUP_RETENTION_COUNT = '6';
  process.env.CF_R2_ACCESS_KEY_ID = 'ce3791c4a9e76c321fa83d91e83af445';
  process.env.CF_R2_BUCKET = 'mdlbeast';
  process.env.CF_R2_ENDPOINT = 'https://de95c4f37b252fdb5c22a69ed3d7d3a1.r2.cloudflarestorage.com';
  process.env.CF_R2_REGION = 'auto';
  process.env.CF_R2_SECRET_ACCESS_KEY = '945c78abf90af55ba501fd2a2c82ea40bfedbfc751781a61347a838af621b60e';
  process.env.DATABASE_URL = 'postgresql://mdlbeastdb_user:mRcP7qtpmSBPLIspOOjUBIhRChC5w7En@dpg-d5lkvkvgi27c738vq8g0-a/mdlbeastdb';
  process.env.DEBUG_SECRET = 'MDL@Debug2026';
  process.env.FRONTEND_URL = 'https://zaco.sa/mdlbeast';
  process.env.JWT_SECRET = 'UiR2u4kxB-a8fVvn1Jy5DEZNFuiyB19T7KD2cTSurgbhb8P_ooN0DWSgHiXiPeGN';
  process.env.NODE_ENV = 'production';
  process.env.PORT = '3001';
  process.env.R2_PUBLIC_BASE_URL = 'https://pub-ca46338c34ee4a7a8eff690474faf0c6.r2.dev';
  process.env.REFRESH_TOKEN_SECRET = 'Uth9x8or8VjU1_Q7dVKag-BWjk_4rfiwGVrWwGq7eC2K03wBhdR4tRRbuf-ZrDwJ';
  process.env.SESSION_SECRET = 'EBwdR4a$XbRhFtiY92kLpQx!3nVmZ8jK';
  process.env.STORAGE_PROVIDER = 'r2';
  process.env.SUPER_ADMIN_EMAIL = 'admin@mdlbeast.com';
  process.env.SUPER_ADMIN_NAME = 'MDLBEAST Administrator';
  process.env.SUPER_ADMIN_PASSWORD = 'MDLadmin@2026';
  process.env.TEST_USER_EMAIL = 'user@mdlbeast.com';
  process.env.TEST_USER_NAME = 'MDLBEAST Staff';
  process.env.TEST_USER_PASSWORD = 'MDLuser@2026';
}

console.log('✓ Environment variables loaded');
console.log(`✓ Database: ${process.env.DATABASE_URL?.split('@')[1] || 'configured'}`);
console.log(`✓ R2 Bucket: ${process.env.CF_R2_BUCKET}`);
