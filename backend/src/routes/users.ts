import express from "express"
import { query } from "../config/database"
import { authenticateToken, isAdmin } from "../middleware/auth"

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Get all users (admin only)
router.get("/", isAdmin, async (req, res) => {
  try {
    const result = await query("SELECT id, username, full_name, role, created_at FROM users ORDER BY created_at DESC")
    res.json(result.rows)
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({ error: "Failed to fetch users" })
  }
})

// Get current user
router.get("/me", async (req, res) => {
  try {
    const authReq = req as any
    const result = await query("SELECT id, username, full_name, role, created_at FROM users WHERE id = $1", [
      authReq.user.id,
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ error: "Failed to fetch user" })
  }
})

export default router
