import express from "express"
import { query } from "../config/database"
import type { Request, Response } from "express"
const router = express.Router()

// Create tenant
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, slug, logo_url } = req.body
    const ins = await query("INSERT INTO tenants (name, slug, logo_url) VALUES ($1,$2,$3) RETURNING *", [name, slug, logo_url])
    res.status(201).json(ins.rows[0])
  } catch (err: any) {
    console.error("Create tenant error:", err)
    res.status(500).json({ error: "Failed to create tenant" })
  }
})

// List tenants
router.get("/", async (_req: Request, res: Response) => {
  try {
    const r = await query("SELECT * FROM tenants ORDER BY created_at DESC")
    res.json(r.rows)
  } catch (err: any) {
    console.error("List tenants error:", err)
    res.status(500).json({ error: "Failed to list tenants" })
  }
})

export default router
