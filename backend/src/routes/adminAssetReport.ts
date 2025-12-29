import express from 'express'
const router = express.Router()

// POST / - body: { url, snippet, status, contentType }
router.post('/', (req, res) => {
  try {
    const { url, snippet, status, contentType } = req.body || {}
    console.warn('adminAssetReport: received asset probe report', { url, status, contentType })
    if (snippet) {
      // log only the first 1024 chars to avoid massive logs
      const s = String(snippet).slice(0, 1024)
      console.warn('adminAssetReport: snippet:', s)
    }
  } catch (e) {
    console.error('adminAssetReport error:', e)
  }
  return res.json({ ok: true })
})

export default router
