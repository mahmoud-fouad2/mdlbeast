import express from "express"
import { query } from "../config/database"
import type { Request, Response } from "express"
import { authenticateToken } from '../middleware/auth'
const router = express.Router()
// require authentication and tenant scoping
router.use(authenticateToken)

// Get barcode details
router.get("/:barcode", async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params
    const user: any = (req as any).user
    // Use case-insensitive match for barcode lookups, but scope by tenant for non-admins
    let q = await query("SELECT * FROM barcodes WHERE lower(barcode) = lower($1) LIMIT 1", [barcode])

    if (q.rows.length === 0) {
      const candidateIn = String(barcode).replace(/^IN-/i, 'In-')
      const candidateOut = String(barcode).replace(/^OUT-/i, 'Out-')
      const try1 = await query("SELECT * FROM barcodes WHERE lower(barcode) = lower($1) LIMIT 1", [candidateIn])
      if (try1.rows.length > 0) q = try1
      else {
        const try2 = await query("SELECT * FROM barcodes WHERE lower(barcode) = lower($1) LIMIT 1", [candidateOut])
        if (try2.rows.length > 0) q = try2
      }
    }

    if (q.rows.length === 0) {
      // fallback: check documents (existing older entries) and synthesize a response
      const d = await query('SELECT * FROM documents WHERE lower(barcode) = lower($1) LIMIT 1', [barcode])
      if (d.rows.length > 0) {
        const doc = d.rows[0]
        // tenant check
        if (user.role !== 'admin' && doc.tenant_id && user.tenant_id && doc.tenant_id !== user.tenant_id) return res.status(404).json({ error: 'Not found' })
        const synth = {
          barcode: doc.barcode,
          type: doc.type,
          status: doc.status,
          priority: doc.priority,
          subject: doc.subject,
          attachments: doc.attachments,
          user_id: doc.user_id,
          tenant_id: doc.tenant_id || null,
          created_at: doc.created_at,
        }
        try {
          await query('INSERT INTO barcodes (barcode, type, status, priority, subject, attachments, user_id, tenant_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [synth.barcode, synth.type, synth.status, synth.priority, synth.subject, JSON.stringify(synth.attachments || []), synth.user_id, synth.tenant_id])
        } catch (e) {
          // ignore unique constraint etc
        }
        const pdfFile = Array.isArray(synth.attachments) && synth.attachments.length ? synth.attachments[0] : null
        return res.json({ ...synth, pdfFile })
      }
      return res.status(404).json({ error: 'Not found' })
    }

    const row = q.rows[0]
    // deny non-admin cross-tenant access
    if (user.role !== 'admin' && row.tenant_id && user.tenant_id && row.tenant_id !== user.tenant_id) return res.status(404).json({ error: 'Not found' })

    try {
      const attachments = Array.isArray(row.attachments) ? row.attachments : (typeof row.attachments === 'string' ? JSON.parse(row.attachments || '[]') : [])
      row.attachments = attachments
      row.pdfFile = attachments.length ? attachments[0] : null
    } catch (e) {
      row.pdfFile = null
    }

    try {
      const docRes = await query('SELECT sender, receiver, date, tenant_id FROM documents WHERE lower(barcode) = lower($1) LIMIT 1', [barcode])
      if (docRes.rows.length > 0) {
        const d = docRes.rows[0]
        if (user.role !== 'admin' && d.tenant_id && user.tenant_id && d.tenant_id !== user.tenant_id) {
          // do not enrich from a different tenant
        } else {
          row.sender = row.sender || d.sender || null
          row.receiver = row.receiver || d.receiver || null
          row.date = row.date || d.date || null
        }
      }
    } catch (e) {}

    res.json(row)
  } catch (err: any) {
    console.error("Get barcode error:", err)
    res.status(500).json({ error: "Failed to fetch barcode" })
  }
})

// Search (manual) - require tenant scoping for non-admin
router.get("/", async (req: Request, res: Response) => {
  try {
    const user: any = (req as any).user
    const qstr = (req.query.q as string) || ""
    if (user.role === 'admin') {
      const q = await query("SELECT * FROM barcodes WHERE barcode ILIKE $1 OR subject ILIKE $1 ORDER BY created_at DESC LIMIT 50", [`%${qstr}%`])
      const rows = q.rows.map((r: any) => {
        try {
          const attachments = Array.isArray(r.attachments) ? r.attachments : (typeof r.attachments === 'string' ? JSON.parse(r.attachments || '[]') : [])
          r.attachments = attachments
          r.pdfFile = attachments.length ? attachments[0] : null
        } catch (e) {
          r.pdfFile = null
        }
        return r
      })
      return res.json(rows)
    }
    const q = await query("SELECT * FROM barcodes WHERE (barcode ILIKE $1 OR subject ILIKE $1) AND (tenant_id = $2 OR tenant_id IS NULL) ORDER BY created_at DESC LIMIT 50", [`%${qstr}%`, user.tenant_id])
    const rows = q.rows.map((r: any) => {
      try {
        const attachments = Array.isArray(r.attachments) ? r.attachments : (typeof r.attachments === 'string' ? JSON.parse(r.attachments || '[]') : [])
        r.attachments = attachments
        r.pdfFile = attachments.length ? attachments[0] : null
      } catch (e) {
        r.pdfFile = null
      }
      return r
    })
    res.json(rows)
  } catch (err: any) {
    console.error("Search barcodes error:", err)
    res.status(500).json({ error: "Search failed" })
  }
})

// Get timeline for barcode
router.get("/:barcode/timeline", async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params
    const user: any = (req as any).user
    const bc = await query("SELECT id, tenant_id FROM barcodes WHERE lower(barcode) = lower($1) LIMIT 1", [barcode])
    if (bc.rows.length === 0) return res.status(404).json({ error: "Not found" })
    const row = bc.rows[0]
    if (user.role !== 'admin' && row.tenant_id && user.tenant_id && row.tenant_id !== user.tenant_id) return res.status(404).json({ error: "Not found" })
    const t = await query("SELECT id, actor_id, action, meta, created_at FROM barcode_timeline WHERE barcode_id = $1 ORDER BY created_at DESC", [row.id])
    res.json(t.rows)
  } catch (err: any) {
    console.error("Get timeline error:", err)
    res.status(500).json({ error: "Failed to fetch timeline" })
  }
})

// Add timeline entry - authenticated; actor derived from token
router.post("/:barcode/timeline", async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params
    const { action, meta } = req.body
    const user: any = (req as any).user

    let bc = await query("SELECT id, tenant_id FROM barcodes WHERE barcode = $1 LIMIT 1", [barcode])
    if (bc.rows.length === 0) {
      console.warn('Barcode not found in barcodes table for timeline; attempting synth from documents for', barcode)
      const d = await query('SELECT * FROM documents WHERE lower(barcode) = lower($1) LIMIT 1', [barcode])
      if (d.rows.length > 0) {
        const doc = d.rows[0]
        if (user.role !== 'admin' && doc.tenant_id && user.tenant_id && doc.tenant_id !== user.tenant_id) return res.status(404).json({ error: 'Not found' })
        try {
          const r = await query(
            `INSERT INTO barcodes (barcode, type, status, priority, subject, attachments, user_id, tenant_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
            [doc.barcode, doc.type, doc.status || null, doc.priority || null, doc.subject || null, JSON.stringify(doc.attachments || []), doc.user_id || null, doc.tenant_id || null]
          )
          if (r.rows.length) bc = r
        } catch (e) {
          console.warn('Failed to synthesize barcode row from document:', e)
        }
      }
    }

    if (bc.rows.length === 0) return res.status(404).json({ error: "Not found" })

    const bcId = bc.rows[0].id
    const actor_id = user?.id || null
    const ins = await query("INSERT INTO barcode_timeline (barcode_id, actor_id, action, meta) VALUES ($1,$2,$3,$4) RETURNING *", [bcId, actor_id, action, meta || {}])
    res.status(201).json(ins.rows[0])
  } catch (err: any) {
    console.error("Add timeline error:", err)
    res.status(500).json({ error: "Failed to add timeline" })
  }
})

export default router
