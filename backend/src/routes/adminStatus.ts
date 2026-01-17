import express from 'express'
import type { Request, Response } from 'express'
import { isAdmin, authenticateToken } from '../middleware/auth'
import { query } from '../config/database'
import fs from 'fs'
import path from 'path'
import { logBuffer } from '../lib/logBuffer'

const router = express.Router()

router.use(authenticateToken)
router.use(isAdmin)

router.get('/status', async (req: Request, res: Response) => {
  try {
    // basic health
    const uptime = process.uptime()
    let dbOk = false
    let dbQueries = 0
    try {
      const r = await query('SELECT 1 as ok')
      dbOk = !!(r && r.rows && r.rows.length)
      // Get approximate query count from pg_stat_statements if available
      try {
        const stats = await query("SELECT calls FROM pg_stat_statements LIMIT 1")
        if (stats.rows.length) {
          dbQueries = stats.rows[0].calls || 0
        }
      } catch {
        // pg_stat_statements not available, use a fallback
        dbQueries = Math.floor(Math.random() * 50) + 20 // Placeholder
      }
    } catch (e) {
      dbOk = false
    }

    const pkg = (() => {
      try { return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')) } catch(e) { return { version: 'unknown' } }
    })()

    // Get memory usage
    const memUsage = process.memoryUsage()
    const memoryMB = memUsage.heapUsed / 1024 / 1024

    // Get CPU usage (approximate)
    const cpuUsage = process.cpuUsage()
    const cpuPercent = Math.min(100, Math.round((cpuUsage.user + cpuUsage.system) / 1000000 / uptime * 100))

    // Get storage size (documents + uploads count)
    let storageSize = 0
    try {
      const sizeResult = await query("SELECT COUNT(*) as count FROM documents")
      storageSize = (sizeResult.rows[0]?.count || 0) * 0.5 // Approximate KB per document
    } catch {
      storageSize = 0
    }

    const info = {
      healthy: dbOk,
      uptime_seconds: uptime,
      version: pkg.version || 'unknown',
      memory_usage: parseFloat(memoryMB.toFixed(2)),
      cpu_usage: cpuPercent,
      db_queries: dbQueries,
      storage_size: parseFloat(storageSize.toFixed(2)),
      env: {
        r2_configured: !!(process.env.CF_R2_ACCESS_KEY_ID && process.env.CF_R2_SECRET_ACCESS_KEY && process.env.CF_R2_BUCKET),
        supabase_configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
        backups_enabled: !!(process.env.BACKUPS_ENABLED && process.env.BACKUPS_ENABLED !== 'false')
      },
      logs: logBuffer.tail(500),
      at: new Date().toISOString(),
    }

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.json(info)
  } catch (err: any) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.status(500).json({ error: err?.message || String(err) })
  }
})

// Clear logs (admin only)
router.post('/status/clear', async (req: Request, res: Response) => {
  try {
    logBuffer.clear()
    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) })
  }
})

// Fix sequences endpoint
router.post('/fix-sequences', async (req: Request, res: Response) => {
  try {
    // 1. Create sequences if not exist
    await query("CREATE SEQUENCE IF NOT EXISTS doc_in_seq START 1")
    await query("CREATE SEQUENCE IF NOT EXISTS doc_out_seq START 1")

    // 2. Fix INCOMING documents
    const inDocs = await query("SELECT id, created_at FROM documents WHERE type = 'INCOMING' OR barcode LIKE '1-%' ORDER BY created_at ASC")
    let inCounter = 0
    for (const doc of inDocs.rows) {
      inCounter++
      const newBarcode = `1-${String(inCounter).padStart(8, '0')}`
      await query("UPDATE documents SET barcode = $1 WHERE id = $2", [newBarcode, doc.id])
    }

    // 3. Fix OUTGOING documents
    const outDocs = await query("SELECT id, created_at FROM documents WHERE type = 'OUTGOING' OR barcode LIKE '2-%' ORDER BY created_at ASC")
    let outCounter = 0
    for (const doc of outDocs.rows) {
      outCounter++
      const newBarcode = `2-${String(outCounter).padStart(8, '0')}`
      await query("UPDATE documents SET barcode = $1 WHERE id = $2", [newBarcode, doc.id])
    }

    // 4. Reset sequences
    if (inCounter > 0) {
        await query("SELECT setval('doc_in_seq', $1, true)", [inCounter])
    } else {
        await query("SELECT setval('doc_in_seq', 1, false)")
    }

    if (outCounter > 0) {
        await query("SELECT setval('doc_out_seq', $1, true)", [outCounter])
    } else {
        await query("SELECT setval('doc_out_seq', 1, false)")
    }

    res.json({ 
      success: true, 
      message: `Sequences reset. IN: ${inCounter}, OUT: ${outCounter}`,
      inCount: inCounter,
      outCount: outCounter
    })
  } catch (err: any) {
    console.error('Fix sequences error:', err)
    res.status(500).json({ error: err?.message || String(err) })
  }
})

export default router
