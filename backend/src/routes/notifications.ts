import { Router, type Response } from 'express'
import type { AuthRequest } from '../types'
import { authenticateToken } from '../middleware/auth'
import { query } from '../config/database'

const router = Router()

router.use(authenticateToken)

// List notifications for current user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.user?.id)
    const limit = Math.min(Number(req.query.limit || 50), 200)
    const offset = Math.max(Number(req.query.offset || 0), 0)
    const unreadOnly = String(req.query.unreadOnly || '').toLowerCase() === 'true'

    const where = unreadOnly ? 'WHERE user_id = $1 AND is_read = FALSE' : 'WHERE user_id = $1'

    const r = await query(
      `SELECT id, title, message, type, entity_type, entity_id, link, is_read, read_at, priority, created_at
       FROM notifications
       ${where}
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    )

    return res.json({ data: r.rows, meta: { limit, offset } })
  } catch (err: any) {
    console.error('List notifications error:', err)
    return res.status(500).json({ error: String(err?.message || err) })
  }
})

// Count unread notifications
router.get('/count', async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.user?.id)
    const r = await query('SELECT COUNT(*)::int as cnt FROM notifications WHERE user_id = $1 AND is_read = FALSE', [userId])
    return res.json({ count: Number(r.rows[0]?.cnt || 0) })
  } catch (err: any) {
    console.error('Count notifications error:', err)
    return res.status(500).json({ error: String(err?.message || err) })
  }
})

// Mark one notification as read
router.post('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id)
    const userId = Number(req.user?.id)

    const r = await query(
      `UPDATE notifications
       SET is_read = TRUE, read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, is_read, read_at`,
      [id, userId]
    )

    if (r.rows.length === 0) return res.status(404).json({ error: 'Notification not found' })
    return res.json(r.rows[0])
  } catch (err: any) {
    console.error('Mark read error:', err)
    return res.status(500).json({ error: String(err?.message || err) })
  }
})

// Mark all as read
router.post('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.user?.id)
    const r = await query(
      `UPDATE notifications
       SET is_read = TRUE, read_at = NOW()
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    )
    return res.json({ success: true, updated: r.rowCount || 0 })
  } catch (err: any) {
    console.error('Read all error:', err)
    return res.status(500).json({ error: String(err?.message || err) })
  }
})

// Delete a notification
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id)
    const userId = Number(req.user?.id)

    const r = await query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, userId])
    if ((r.rowCount || 0) === 0) return res.status(404).json({ error: 'Notification not found' })
    return res.json({ success: true })
  } catch (err: any) {
    console.error('Delete notification error:', err)
    return res.status(500).json({ error: String(err?.message || err) })
  }
})

export default router
