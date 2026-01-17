import { Router, type Response } from 'express'
import type { AuthRequest } from '../types'
import { authenticateToken } from '../middleware/auth'
import { query } from '../config/database'

const router = Router()

router.use(authenticateToken)

const roleLower = (req: AuthRequest) => String(req.user?.role || '').toLowerCase()

// List channels (derived)
router.get('/channels', async (_req: AuthRequest, res: Response) => {
  try {
    const r = await query(
      `SELECT channel, COUNT(*)::int as message_count, MAX(created_at) as last_message_at
       FROM internal_messages
       GROUP BY channel
       ORDER BY MAX(created_at) DESC`
    )
    const channels = r.rows.map((x: any) => ({
      channel: x.channel || 'general',
      message_count: Number(x.message_count || 0),
      last_message_at: x.last_message_at,
    }))
    // Ensure 'general' always exists
    if (!channels.find((c: any) => c.channel === 'general')) {
      channels.push({ channel: 'general', message_count: 0, last_message_at: null })
    }
    return res.json({ data: channels })
  } catch (err: any) {
    console.error('List channels error:', err)
    return res.status(500).json({ error: String(err?.message || err) })
  }
})

// List messages by channel
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const channel = String(req.query.channel || 'general').trim() || 'general'
    const limit = Math.min(Number(req.query.limit || 100), 300)
    const offset = Math.max(Number(req.query.offset || 0), 0)

    const r = await query(
      `SELECT m.id, m.channel, m.user_id, u.full_name, u.username, m.content, m.attachments, m.is_pinned, m.created_at, m.updated_at
       FROM internal_messages m
       LEFT JOIN users u ON u.id = m.user_id
       WHERE m.channel = $1
       ORDER BY m.is_pinned DESC, m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [channel, limit, offset]
    )

    return res.json({ data: r.rows, meta: { channel, limit, offset } })
  } catch (err: any) {
    console.error('List messages error:', err)
    return res.status(500).json({ error: String(err?.message || err) })
  }
})

// Post message
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.user?.id)
    const channel = String(req.body?.channel || 'general').trim() || 'general'
    const content = String(req.body?.content || '').trim()
    const attachments = Array.isArray(req.body?.attachments) ? req.body.attachments : []

    if (!content) return res.status(400).json({ error: 'content is required' })

    const r = await query(
      `INSERT INTO internal_messages (channel, user_id, content, attachments)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING id, channel, user_id, content, attachments, is_pinned, created_at`,
      [channel, userId, content, JSON.stringify(attachments)]
    )

    return res.status(201).json(r.rows[0])
  } catch (err: any) {
    console.error('Create message error:', err)
    return res.status(500).json({ error: String(err?.message || err) })
  }
})

// Pin/unpin message (admin/manager only)
router.post('/:id/pin', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id)
    const role = roleLower(req)
    if (!['admin', 'manager', 'supervisor'].includes(role)) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const pinned = Boolean(req.body?.pinned)

    const r = await query(
      `UPDATE internal_messages
       SET is_pinned = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, is_pinned`,
      [pinned, id]
    )

    if (r.rows.length === 0) return res.status(404).json({ error: 'Message not found' })
    return res.json(r.rows[0])
  } catch (err: any) {
    console.error('Pin message error:', err)
    return res.status(500).json({ error: String(err?.message || err) })
  }
})

// Delete message (author or admin/manager)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id)
    const userId = Number(req.user?.id)
    const role = roleLower(req)

    const existing = await query('SELECT user_id FROM internal_messages WHERE id = $1', [id])
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Message not found' })

    const authorId = Number(existing.rows[0].user_id)
    const isPrivileged = ['admin', 'manager', 'supervisor'].includes(role)
    if (!isPrivileged && authorId !== userId) return res.status(403).json({ error: 'Not authorized' })

    await query('DELETE FROM internal_messages WHERE id = $1', [id])
    return res.json({ success: true })
  } catch (err: any) {
    console.error('Delete message error:', err)
    return res.status(500).json({ error: String(err?.message || err) })
  }
})

export default router
