import express from 'express'
import { query } from '../config/database'
import fetch from 'node-fetch'
import { PDFDocument } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()
router.use(authenticateToken)

// POST /:barcode/stamp { x, y, containerWidth, containerHeight, stampWidth }
router.post('/:barcode/stamp', async (req, res) => {
  try {
    const { barcode } = req.params
    const { x = 20, y = 20, containerWidth, containerHeight, stampWidth = 180, page: pageIndex = 0 } = req.body || {}

    const d = await query('SELECT * FROM documents WHERE barcode = $1 LIMIT 1', [barcode])
    if (d.rows.length === 0) return res.status(404).json({ error: 'Document not found' })
    const doc = d.rows[0]

    // find pdf url in attachments (first attachment)
    const attachments = doc.attachments || []
    const pdf = Array.isArray(attachments) && attachments.length ? attachments[0] : null
    if (!pdf || !pdf.url) return res.status(400).json({ error: 'No PDF attached to stamp' })

    // fetch pdf bytes (support Supabase key, local uploads, or external URL)
    let pdfBytes: Buffer
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKeyRaw = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const supabaseKey = String(supabaseKeyRaw).trim()
    const supabaseBucket = process.env.SUPABASE_BUCKET || ''

    try {
      if (pdf.key && supabaseUrl && supabaseKey && supabaseBucket) {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
        const { data: downloadData, error: downloadErr } = await supabase.storage.from(supabaseBucket).download(pdf.key)
        if (downloadErr) throw downloadErr
        pdfBytes = Buffer.from(await (downloadData as any).arrayBuffer())
      } else if (pdf.url && String(pdf.url).startsWith('/uploads/')) {
        const uploadsDir = path.resolve(process.cwd(), 'uploads')
        const fp = path.join(uploadsDir, pdf.url.replace('/uploads/', ''))
        pdfBytes = fs.readFileSync(fp)
      } else {
        const r = await fetch(pdf.url)
        if (!r.ok) return res.status(500).json({ error: 'Failed to fetch PDF' })
        pdfBytes = Buffer.from(await r.arrayBuffer())
      }
    } catch (e: any) {
      console.error('Failed to load PDF bytes:', e)
      return res.status(500).json({ error: 'Failed to load PDF for stamping' })
    }

    // fetch barcode image (PNG) via bwipjs public API
    const bcUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(barcode)}&scale=2&includetext=false`
    const imgResp = await fetch(bcUrl)
    if (!imgResp.ok) return res.status(500).json({ error: 'Failed to generate barcode image' })
    const imgBytes = Buffer.from(await imgResp.arrayBuffer())

    // embed image into PDF
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pngImage = await pdfDoc.embedPng(imgBytes)

    const pages = pdfDoc.getPages()
    const page = pages[Math.max(0, Math.min(pageIndex, pages.length - 1))]
    const { width: pageWidth, height: pageHeight } = page.getSize()

    // compute image size in PDF units based on provided stampWidth (px) and container size
    let widthPdf: number
    let heightPdf: number
    const imgWidth = pngImage.width || 200
    const imgHeight = pngImage.height || 50

    if (containerWidth && containerHeight) {
      const cw = Number(containerWidth)
      widthPdf = (Number(stampWidth) / cw) * pageWidth
      heightPdf = widthPdf * (imgHeight / imgWidth)
    } else {
      const scaled = pngImage.scale(0.6)
      widthPdf = scaled.width
      heightPdf = scaled.height
    }

    // compute coordinates: x,y are in pixels from top-left of preview; convert to PDF coords
    let xPdf: number
    let yPdf: number
    if (containerWidth && containerHeight) {
      xPdf = (Number(x) / Number(containerWidth)) * pageWidth
      const topFraction = Number(y) / Number(containerHeight)
      yPdf = pageHeight - (topFraction * pageHeight) - heightPdf
    } else {
      xPdf = Number(x)
      yPdf = pageHeight - Number(y) - heightPdf
    }

    // clamp coordinates
    xPdf = Math.max(0, Math.min(xPdf, pageWidth - 1))
    yPdf = Math.max(0, Math.min(yPdf, pageHeight - 1))

    page.drawImage(pngImage, {
      x: xPdf,
      y: yPdf,
      width: widthPdf,
      height: heightPdf,
    })

    const outBytes = await pdfDoc.save()

    // Overwrite original file when possible (Supabase key or local file), otherwise create a new local file and replace the first attachment
    try {
      // If pdf.key not present, try to extract key and bucket from a Supabase public URL
      let targetBucket = supabaseBucket || ''
      let targetKey = pdf.key
      if ((!targetKey || !targetBucket) && pdf.url && typeof pdf.url === 'string') {
        try {
          const u = new URL(pdf.url)
          // match /storage/v1/object/public/{bucket}/{key...}
          const m = u.pathname.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/)
          if (m) {
            targetBucket = m[1]
            targetKey = decodeURIComponent(m[2])
            // If this is a Supabase public URL but the server lacks a service role key, refuse to silently localize
            if ((!!m) && !(supabaseUrl && supabaseKey)) {
              console.error('Stamp: Supabase public URL detected but SUPABASE_SERVICE_ROLE_KEY not configured on server')
              return res.status(500).json({ error: 'Cannot overwrite Supabase object: server is not configured with SUPABASE_SERVICE_ROLE_KEY. Configure the Service Role key to allow overwriting files in storage.' })
            }
          }
        } catch (e) {
          // ignore URL parsing errors
        }
      }

      // If we have a Supabase key/bucket, attempt to overwrite the same object
      if (targetKey && targetBucket && supabaseUrl && supabaseKey) {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
        const { error: uploadErr } = await supabase.storage.from(targetBucket).upload(targetKey, outBytes, { contentType: 'application/pdf', upsert: true })
        if (uploadErr) throw uploadErr
        // refresh public URL
        const publicRes = supabase.storage.from(targetBucket).getPublicUrl(targetKey) as any
        const newUrl = publicRes?.data?.publicUrl || pdf.url
        // update attachments[0] url, size and key
        attachments[0] = { ...(attachments[0] || {}), url: newUrl, size: outBytes.length, key: targetKey, bucket: targetBucket }
        const upd = await query('UPDATE documents SET attachments = $1 WHERE id = $2 RETURNING *', [JSON.stringify(attachments), doc.id])
        const updatedDoc = upd.rows[0]
        // attach pdfFile convenience property
        const parsedAttachments = Array.isArray(updatedDoc.attachments) ? updatedDoc.attachments : JSON.parse(String(updatedDoc.attachments || '[]'))
        const pdfFile = parsedAttachments && parsedAttachments.length ? parsedAttachments[0] : null
        return res.json({ ...updatedDoc, attachments: parsedAttachments, pdfFile })
      }

      // If original was local uploads path, overwrite it
      if (pdf.url && String(pdf.url).startsWith('/uploads/')) {
        const uploadsDir = path.resolve(process.cwd(), 'uploads')
        const fp = path.join(uploadsDir, pdf.url.replace('/uploads/', ''))
        fs.writeFileSync(fp, outBytes)
        // update size
        attachments[0] = { ...(attachments[0] || {}), size: outBytes.length }
        const upd = await query('UPDATE documents SET attachments = $1 WHERE id = $2 RETURNING *', [JSON.stringify(attachments), doc.id])
        const updatedDoc = upd.rows[0]
        const parsedAttachments = Array.isArray(updatedDoc.attachments) ? updatedDoc.attachments : JSON.parse(String(updatedDoc.attachments || '[]'))
        const pdfFile = parsedAttachments && parsedAttachments.length ? parsedAttachments[0] : null
        return res.json({ ...updatedDoc, attachments: parsedAttachments, pdfFile })
      }

      // fallback: create new local file and replace first attachment
      const uploadsDir = path.resolve(process.cwd(), 'uploads')
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
      const filename = `stamped-${Date.now()}-${encodeURIComponent(barcode)}.pdf`
      const outPath = path.join(uploadsDir, filename)
      fs.writeFileSync(outPath, outBytes)
      const url = `/uploads/${filename}`
      attachments[0] = { name: filename, url, size: outBytes.length }
      const upd = await query('UPDATE documents SET attachments = $1 WHERE id = $2 RETURNING *', [JSON.stringify(attachments), doc.id])
      const updatedDoc = upd.rows[0]
      const parsedAttachments = Array.isArray(updatedDoc.attachments) ? updatedDoc.attachments : JSON.parse(String(updatedDoc.attachments || '[]'))
      const pdfFile = parsedAttachments && parsedAttachments.length ? parsedAttachments[0] : null
      return res.json({ ...updatedDoc, attachments: parsedAttachments, pdfFile })
    } catch (e: any) {
      console.error('Failed to save stamped file:', e)
      return res.status(500).json({ error: 'Failed to save stamped file' })
    }
  } catch (err: any) {
    console.error('Stamp error:', err)
    res.status(500).json({ error: err.message || 'Stamp failed' })
  }
})

export default router
