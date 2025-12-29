/* DEPRECATED: removeProblematicChunks
   This middleware was an emergency hotfix that removed specific JS chunk tags from /archive
   HTML responses to avoid runtime crashes when CDN/origin served HTML instead of JS for those
   files. It masked the root cause and made debugging harder, so it is now a no-op. Keep the
   file present temporarily for history; do not rely on it.
*/

import { Request, Response, NextFunction } from 'express'

export default function removeProblematicChunks(_req: Request, _res: Response, next: NextFunction) {
  // no-op; previously removed problematic chunk tags but now deprecated.
  next()
} 
