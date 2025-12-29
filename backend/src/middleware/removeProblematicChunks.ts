import { Request, Response, NextFunction } from 'express'

const DEFAULT_SKIP = ['249261e921aeebba.js']
const skipList = (process.env.SKIP_CHUNKS || DEFAULT_SKIP.join(',')).split(',').map(s => s.trim()).filter(Boolean)

export default function removeProblematicChunks(req: Request, res: Response, next: NextFunction) {
  // Only target GET HTML responses for archive pages
  if (req.method !== 'GET') return next()
  if (!req.path.startsWith('/archive')) return next()

  const originalSend = res.send.bind(res)

  res.send = function (body?: any) {
    try {
      if (typeof body === 'string' && body.indexOf('<script') !== -1) {
        let modified = body
        for (const chunk of skipList) {
          // Match script tags that load this chunk (with optional query string) and remove them
          const regex = new RegExp(`<script[^>]*src=["']([^"']*${chunk})(?:\\?[^"']*)?["'][^>]*>\\s*</script>`, 'gi')
          if (regex.test(modified)) {
            modified = modified.replace(regex, `<!-- removed problematic chunk ${chunk} -->`)
            try { console.warn('[removeProblematicChunks] removed chunk', chunk, 'for', req.path) } catch (_) {}
          }
        }
        body = modified
      }
    } catch (e) {
      // ignore
    }

    return originalSend(body)
  }

  next()
}
