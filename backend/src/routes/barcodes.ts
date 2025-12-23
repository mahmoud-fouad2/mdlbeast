import express from "express"
import { query } from "../config/database"
import type { Request, Response } from "express"
const router = express.Router()

// Get barcode details
router.get("/:barcode", async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params
    const q = await query("SELECT * FROM barcodes WHERE barcode = $1 LIMIT 1", [barcode])
    if (q.rows.length === 0) {
      // fallback: check documents (existing older entries) and synthesize a response
      const d = await query('SELECT * FROM documents WHERE barcode = $1 LIMIT 1', [barcode])
      if (d.rows.length > 0) {
        const doc = d.rows[0]
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
        // try to insert into barcodes table for caching
        try {
          await query('INSERT INTO barcodes (barcode, type, status, priority, subject, attachments, user_id, tenant_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [synth.barcode, synth.type, synth.status, synth.priority, synth.subject, JSON.stringify(synth.attachments || []), synth.user_id, synth.tenant_id])
        } catch (e) {
          // ignore unique constraint etc
        }
        return res.json(synth)
      }
      return res.status(404).json({ error: 'Not found' })
    }
    res.json(q.rows[0])
  } catch (err: any) {
    console.error("Get barcode error:", err)
    res.status(500).json({ error: "Failed to fetch barcode" })
  }
})

// Search (manual)
router.get("/", async (req: Request, res: Response) => {
  try {
    const qstr = (req.query.q as string) || ""
    const q = await query("SELECT * FROM barcodes WHERE barcode ILIKE $1 OR subject ILIKE $1 ORDER BY created_at DESC LIMIT 50", [`%${qstr}%`])
    res.json(q.rows)
  } catch (err: any) {
    console.error("Search barcodes error:", err)
    res.status(500).json({ error: "Search failed" })
  }
})

// Get timeline for barcode
router.get("/:barcode/timeline", async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params
    const bc = await query("SELECT id FROM barcodes WHERE barcode = $1 LIMIT 1", [barcode])
    if (bc.rows.length === 0) return res.status(404).json({ error: "Not found" })
    const bcId = bc.rows[0].id
    const t = await query("SELECT id, actor_id, action, meta, created_at FROM barcode_timeline WHERE barcode_id = $1 ORDER BY created_at DESC", [bcId])
    res.json(t.rows)
  } catch (err: any) {
    console.error("Get timeline error:", err)
    res.status(500).json({ error: "Failed to fetch timeline" })
  }
})

// Add timeline entry
router.post("/:barcode/timeline", async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params
    const { action, actor_id, meta } = req.body
    const bc = await query("SELECT id FROM barcodes WHERE barcode = $1 LIMIT 1", [barcode])
    if (bc.rows.length === 0) return res.status(404).json({ error: "Not found" })
    const bcId = bc.rows[0].id
    const ins = await query("INSERT INTO barcode_timeline (barcode_id, actor_id, action, meta) VALUES ($1,$2,$3,$4) RETURNING *", [bcId, actor_id, action, meta || {}])
    res.status(201).json(ins.rows[0])
  } catch (err: any) {
    console.error("Add timeline error:", err)
    res.status(500).json({ error: "Failed to add timeline" })
  }
})

export default router
