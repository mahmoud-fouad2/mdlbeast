import express from "express"
import { query } from "../config/database"
import type { Request, Response } from "express"
const router = express.Router()

// List snapshots (admin only - middleware to be used)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const r = await query("SELECT * FROM snapshots ORDER BY created_at DESC")
    res.json(r.rows)
  } catch (err: any) {
    console.error("List snapshots error:", err)
    res.status(500).json({ error: "Failed to list snapshots" })
  }
})

export default router
