import request from 'supertest'
import express from 'express'
import fs from 'fs'
import path from 'path'

jest.mock('../lib/r2-storage', () => ({
  uploadBuffer: jest.fn(async (key: string, buf: Buffer, contentType: string, cacheControl?: string) => {
    return `https://r2.example.com/${key}`
  }),
  getPublicUrl: jest.fn((k: string) => `https://r2.example.com/${k}`),
}))

jest.mock('../middleware/auth', () => ({ 
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = { id: 1, role: 'admin' }
    next()
  } 
}))

import uploadsRouter from './uploads'

describe('uploads (R2-only)', () => {
  beforeAll(() => {
    process.env.USE_R2_ONLY = 'true'
    process.env.CF_R2_BUCKET = 'test-bucket'
    process.env.CF_R2_ENDPOINT = 'https://r2.example.com'
  })

  afterAll(() => {
    delete process.env.USE_R2_ONLY
    delete process.env.CF_R2_BUCKET
    delete process.env.CF_R2_ENDPOINT
  })

  it('uploads file to R2 when USE_R2_ONLY=true', async () => {
    const app = express()
    app.use('/uploads', uploadsRouter)

    const filePath = path.resolve(__dirname, '..', 'test-fixtures', 'dummy.pdf')
    // Always write a valid PDF header so magic number validation passes
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, Buffer.from('%PDF-1.4 dummy content'))

    const res = await request(app)
      .post('/uploads')
      .attach('file', filePath, { contentType: 'application/pdf' })
    
    if (res.status !== 200) {
        console.error('Upload failed with status', res.status, 'body:', res.body)
    }
    expect(res.status).toBe(200)

    expect(res.body.storage).toBe('r2')
    expect(res.body.url).toMatch(/https?:\/\/r2.example.com\//)
  })
})
