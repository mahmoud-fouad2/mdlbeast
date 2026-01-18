// This file is deprecated. Please use services/storageService instead.
// Redirecting exports to the new service for compatibility.
import { storageService } from '../services/storageService'

export const uploadBuffer = storageService.uploadBuffer.bind(storageService)
export const getPublicUrl = storageService.getPublicUrl.bind(storageService)
export const getSignedDownloadUrl = storageService.getSignedDownloadUrl.bind(storageService)
export const downloadToBuffer = storageService.downloadToBuffer.bind(storageService)
export const deleteObject = storageService.deleteObject.bind(storageService)


export function getPublicUrl(key: string) {
  if (!ENDPOINT) throw new Error('CF_R2_ENDPOINT not configured')
  // encode each segment but keep slashes intact to avoid "%2F" in the path
  const parts = String(key || '').split('/').map(encodeURIComponent).join('/')
  return `${ENDPOINT}/${BUCKET}/${parts}`;
}

export async function getSignedDownloadUrl(key: string, expiresSeconds = 300) {
  if (!BUCKET) throw new Error('CF_R2_BUCKET not configured')
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn: expiresSeconds });
}

async function streamToBuffer(readable: any) {
  if (typeof readable?.transformToByteArray === 'function') {
    const arr = await readable.transformToByteArray()
    return Buffer.from(arr)
  }
  const chunks: Buffer[] = [];
  return new Promise<Buffer>((resolve, reject) => {
    readable.on('data', (chunk: any) => chunks.push(Buffer.from(chunk)));
    readable.on('error', reject);
    readable.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export async function downloadToBuffer(key: string) {
  if (!BUCKET) throw new Error('CF_R2_BUCKET not configured')
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
  const Body = (res as any).Body
  if (!Body) throw new Error('Empty body from R2')
  const buf = await streamToBuffer(Body)
  return buf
}

export async function deleteObject(key: string) {
  if (!BUCKET) throw new Error('CF_R2_BUCKET not configured')
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}
