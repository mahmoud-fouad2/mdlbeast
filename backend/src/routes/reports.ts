import express from "express"
import { query } from "../config/database"
import type { Request, Response } from "express"
const router = express.Router()

// Placeholder: generate a report (returns report id / metadata)
router.post("/generate", async (req: Request, res: Response) => {
  try {
    const { name, params, generated_by } = req.body
    const ins = await query("INSERT INTO reports (name, params, generated_by) VALUES ($1, $2, $3) RETURNING *", [name, params || {}, generated_by])
    res.status(201).json(ins.rows[0])
  } catch (err: any) {
    console.error("Generate report error:", err)
    res.status(500).json({ error: "Report generation failed" })
  }
})

export default router
