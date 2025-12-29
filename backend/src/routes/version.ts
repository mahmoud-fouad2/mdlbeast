import express from 'express'
import type { Request, Response } from 'express'
import fs from 'fs'
import { execSync } from 'child_process'

const router = express.Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    // Try to read package.json version
    const pkg = JSON.parse(fs.readFileSync(require.resolve('../../../../package.json'), 'utf8'))
    let commit = null
    try {
      commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    } catch (e) {
      // ignore if git not available
    }

    const info = {
      version: pkg.version || 'unknown',
      commit: commit || null,
      at: new Date().toISOString(),
    }

    // Ensure responses are not cached
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.json(info)
  } catch (err: any) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.json({ version: 'unknown', commit: null, at: new Date().toISOString() })
  }
})

export default router
