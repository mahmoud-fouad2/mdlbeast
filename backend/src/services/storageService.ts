
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = process.env.CF_R2_BUCKET || '';
const ENDPOINT = (process.env.CF_R2_ENDPOINT || '').replace(/\/$/, '');
const REGION = process.env.CF_R2_REGION || 'auto';

const s3 = new S3Client({
  region: REGION,
  endpoint: ENDPOINT || undefined,
  credentials: {
    accessKeyId: process.env.CF_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: false, 
});

if (!BUCKET || !ENDPOINT) {
    console.warn('[StorageService] R2 credentials missing - Storage will fail.')
}

export const storageService = {
  /**
   * Upload a buffer to R2 and return the public URL (if available) or the Key
   */
  async uploadBuffer(key: string, buf: Buffer, contentType = "application/pdf", cacheControl = "public, max-age=0") {
    if (!BUCKET) throw new Error('CF_R2_BUCKET not configured')
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buf,
      ContentType: contentType,
      CacheControl: cacheControl,
    }));
    return this.getPublicUrl(key);
  },

  /**
   * Generate a public URL (if public access is enabled/configured via domain)
   */
  getPublicUrl(key: string) {
    if (!ENDPOINT) return key; 
    // This is a naive public URL generation assuming the bucket is publicly readable at the endpoint
    // Adjust if you use a custom domain
    const parts = String(key || '').split('/').map(encodeURIComponent).join('/')
    return `${ENDPOINT}/${BUCKET}/${parts}`;
  },

  /**
   * Generate a temporary signed URL for viewing private files
   */
  async getSignedDownloadUrl(key: string, expiresSeconds = 300) {
    if (!BUCKET) throw new Error('CF_R2_BUCKET not configured')
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    return getSignedUrl(s3, cmd, { expiresIn: expiresSeconds });
  },

  /**
   * Download file content to memory buffer
   */
  async downloadToBuffer(key: string): Promise<Buffer> {
    if (!BUCKET) throw new Error('CF_R2_BUCKET not configured')
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
    const Body = (res as any).Body
    if (!Body) throw new Error('Empty body from R2')
    
    // Convert stream to buffer
    if (typeof Body?.transformToByteArray === 'function') {
        const arr = await Body.transformToByteArray()
        return Buffer.from(arr)
    }

    // Fallback for Node streams
    const chunks: Buffer[] = [];
    return new Promise<Buffer>((resolve, reject) => {
        Body.on('data', (chunk: any) => chunks.push(Buffer.from(chunk)));
        Body.on('error', reject);
        Body.on('end', () => resolve(Buffer.concat(chunks)));
    });
  },

  /**
   * Delete a file
   */
  async deleteObject(key: string) {
    if (!BUCKET) throw new Error('CF_R2_BUCKET not configured')
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
  },

  /**
   * Helper to derive R2 Key from a Full URL (if migration legacy exists)
   */
  deriveKeyFromUrl(rawUrl: string): string | null {
    try {
        if (!rawUrl) return null
        const u = new URL(String(rawUrl))
        let pathname = u.pathname.replace(/^\//, '')
        // If path starts with bucket name (common in S3 naming), strip it
        if (pathname.startsWith(BUCKET + '/')) pathname = pathname.slice(BUCKET.length + 1)
        return decodeURIComponent(pathname)
      } catch {
        return null
      }
  }
};
