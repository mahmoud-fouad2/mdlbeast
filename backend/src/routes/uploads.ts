import express from 'express'
import type { Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = express.Router()

const uploadsDir = path.resolve(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: (err: any, dest: string) => void) => cb(null, uploadsDir),
  filename: (req: any, file: any, cb: (err: any, filename: string) => void) => {
    const safe = String(file.originalname || '').replace(/[^a-z0-9.\-\_\u0600-\u06FF]/gi, '-')
    cb(null, `${Date.now()}-${safe}`)
  }
})

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 }, fileFilter: (req: any, file: any, cb: (err: Error | null, accept?: boolean) => void) => {
  if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDF allowed'))
  cb(null, true)
}})

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const f: any = (req as any).file
    if (!f) return res.status(400).json({ error: 'No file' })
    const url = `/uploads/${f.filename}`
    res.json({ url, name: f.originalname, size: f.size })
  } catch (err: any) {
    console.error('Upload error:', err)
    res.status(500).json({ error: err.message || 'Upload failed' })
  }
})

export default router
