import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import type { AuthRequest } from "../types"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this"

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Access token required" })
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as any
    ;(req as AuthRequest).user = user
    next()
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" })
  }
}

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest
  if (authReq.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" })
  }
  next()
}
