import express from "express"
import type { Request, Response } from "express"
import { query } from "../config/database"
import { authenticateToken, isAdmin, isManager } from "../middleware/auth"
import type { AuthRequest } from "../types"
import { getSignedDownloadUrl, uploadBuffer } from "../lib/r2-storage"
import multer from "multer"

// Configure multer for memory storage (files stored in buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

const router = express.Router()

// Helper function to convert R2 URLs to signed URLs
async function convertToSignedUrls(user: any) {
  if (user.signature_url && user.signature_url.includes('r2.cloudflarestorage.com')) {
    try {
      const urlObj = new URL(user.signature_url);
      let pathname = urlObj.pathname.replace(/^\//, '');
      const bucket = process.env.CF_R2_BUCKET || 'mdlbeast';
      if (pathname.startsWith(bucket + '/')) {
        pathname = pathname.slice(bucket.length + 1);
      }
      user.signature_url = await getSignedDownloadUrl(pathname);
    } catch (err) {
      console.error('Failed to generate signed URL for signature:', err);
    }
  }
  if (user.stamp_url && user.stamp_url.includes('r2.cloudflarestorage.com')) {
    try {
      const urlObj = new URL(user.stamp_url);
      let pathname = urlObj.pathname.replace(/^\//, '');
      const bucket = process.env.CF_R2_BUCKET || 'mdlbeast';
      if (pathname.startsWith(bucket + '/')) {
        pathname = pathname.slice(bucket.length + 1);
      }
      user.stamp_url = await getSignedDownloadUrl(pathname);
    } catch (err) {
      console.error('Failed to generate signed URL for stamp:', err);
    }
  }
  // Handle avatar_url - it stores the R2 key, convert to signed URL
  if (user.avatar_url) {
    try {
      // If it's already a URL, extract the key; otherwise use it directly as a key
      if (user.avatar_url.includes('r2.cloudflarestorage.com')) {
        const urlObj = new URL(user.avatar_url);
        let pathname = urlObj.pathname.replace(/^\//, '');
        const bucket = process.env.CF_R2_BUCKET || 'mdlbeast';
        if (pathname.startsWith(bucket + '/')) {
          pathname = pathname.slice(bucket.length + 1);
        }
        user.avatar_url = await getSignedDownloadUrl(pathname);
      } else if (!user.avatar_url.startsWith('http')) {
        // It's a key, convert to signed URL
        user.avatar_url = await getSignedDownloadUrl(user.avatar_url);
      }
    } catch (err) {
      console.error('Failed to generate signed URL for avatar:', err);
    }
  }
  return user;
}

// All routes require authentication
router.use(authenticateToken)

// Get all users (manager or admin only)
router.get("/", isManager, async (req: AuthRequest, res: Response) => {
  try {
    // detect schema columns and pick safe select
    const hasEmail = (await query("SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email' LIMIT 1")).rows.length > 0
    const hasName = (await query("SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name' LIMIT 1")).rows.length > 0

    let select = "id, username AS username, full_name AS full_name, role, created_at, manager_id, signature_url, stamp_url"
    if (hasEmail && hasName) select = "id, email AS username, name AS full_name, role, created_at, manager_id, signature_url, stamp_url"
    else if (hasEmail) select = "id, email AS username, full_name AS full_name, role, created_at, manager_id, signature_url, stamp_url"
    else if (hasName) select = "id, username AS username, name AS full_name, role, created_at, manager_id, signature_url, stamp_url"

    // Always include username if it exists in the table, even if we aliased email to username above
    // This fixes the issue where 'username' column is not returned when 'email' column exists
    if (hasEmail) {
       // If we have email, we might have aliased it to username. Let's make sure we get the real username column too if it exists.
       const hasUsernameCol = (await query("SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username' LIMIT 1")).rows.length > 0
       if (hasUsernameCol) {
         select += ", username"
       }
    }

    const result = await query(`SELECT ${select} FROM users ORDER BY created_at DESC`)
    
    // Convert R2 URLs to signed URLs
    const usersWithSignedUrls = await Promise.all(result.rows.map(convertToSignedUrls))
    
    res.json(usersWithSignedUrls)
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({ error: "Failed to fetch users" })
  }
})

// Create user (manager or admin only)
router.post("/", isManager, async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, full_name, role, email } = req.body
    if (!username || !password || !full_name || !role) return res.status(400).json({ error: 'Missing fields' })

    const exists = await query('SELECT id FROM users WHERE username = $1 LIMIT 1', [username])
    if (exists.rows.length) return res.status(400).json({ error: 'Username exists' })

    const hashed = await import('bcrypt').then(b => b.hash(password, 10))
    
    // Check if email column exists
    const hasEmail = (await query("SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email' LIMIT 1")).rows.length > 0
    
    let ins
    if (hasEmail && email) {
      ins = await query('INSERT INTO users (username, password, full_name, role, email) VALUES ($1,$2,$3,$4,$5) RETURNING id, username, full_name, role, email, created_at', [username, hashed, full_name, role, email])
    } else {
      ins = await query('INSERT INTO users (username, password, full_name, role) VALUES ($1,$2,$3,$4) RETURNING id, username, full_name, role, created_at', [username, hashed, full_name, role])
    }
    
    res.status(201).json(ins.rows[0])
  } catch (err: any) {
    console.error('Create user error:', err)
    res.status(500).json({ error: 'Failed to create user' })
  }
})

// Update user (manager or admin only)
router.put('/:id', isManager, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { full_name, role, password, email, username, manager_id, signature_url, stamp_url } = req.body
    const parts: string[] = []
    const values: any[] = []
    let idx = 1
    if (full_name !== undefined) { parts.push(`full_name = $${idx++}`); values.push(full_name) }
    if (role !== undefined) { parts.push(`role = $${idx++}`); values.push(role) }
    if (password) { const h = await import('bcrypt').then(b => b.hash(password, 10)); parts.push(`password = $${idx++}`); values.push(h) }
    if (email !== undefined) { parts.push(`email = $${idx++}`); values.push(email) }
    if (username !== undefined) { parts.push(`username = $${idx++}`); values.push(username) }
    if (manager_id !== undefined) { parts.push(`manager_id = $${idx++}`); values.push(manager_id || null) }
    if (signature_url !== undefined) { parts.push(`signature_url = $${idx++}`); values.push(signature_url) }
    if (stamp_url !== undefined) { parts.push(`stamp_url = $${idx++}`); values.push(stamp_url) }
    if (!parts.length) return res.status(400).json({ error: 'No updates provided' })
    values.push(id)
    const q = `UPDATE users SET ${parts.join(', ')} WHERE id = $${idx} RETURNING id, username, full_name, role, created_at, manager_id, signature_url, stamp_url`
    const r = await query(q, values)
    if (r.rows.length === 0) return res.status(404).json({ error: 'User not found' })
    
    // Convert R2 URLs to signed URLs
    const userWithSignedUrls = await convertToSignedUrls(r.rows[0])
    
    res.json(userWithSignedUrls)
  } catch (err: any) {
    console.error('Update user error:', err)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// Delete user (manager or admin only)
router.delete('/:id', isManager, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const r = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id])
    if (r.rows.length === 0) return res.status(404).json({ error: 'User not found' })
    res.json({ deleted: 1 })
  } catch (err: any) {
    console.error('Delete user error:', err)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

// Get current user
router.get("/me", async (req: AuthRequest, res: Response) => {
  try {
    const authReq = req

    const hasEmail = (await query("SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email' LIMIT 1")).rows.length > 0
    const hasName = (await query("SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name' LIMIT 1")).rows.length > 0
    const hasAvatarUrl = (await query("SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url' LIMIT 1")).rows.length > 0

    let select = "id, username AS username, full_name AS full_name, role, created_at, manager_id, signature_url, stamp_url"
    if (hasAvatarUrl) select += ", avatar_url"
    
    if (hasEmail && hasName) select = "id, email AS username, name AS full_name, role, created_at, manager_id, signature_url, stamp_url" + (hasAvatarUrl ? ", avatar_url" : "")
    else if (hasEmail) select = "id, email AS username, full_name AS full_name, role, created_at, manager_id, signature_url, stamp_url" + (hasAvatarUrl ? ", avatar_url" : "")
    else if (hasName) select = "id, username AS username, name AS full_name, role, created_at, manager_id, signature_url, stamp_url" + (hasAvatarUrl ? ", avatar_url" : "")

    if (hasEmail) {
       const hasUsernameCol = (await query("SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username' LIMIT 1")).rows.length > 0
       if (hasUsernameCol) {
         select += ", username"
       }
    }

    const result = await query(`SELECT ${select} FROM users WHERE id = $1`, [authReq.user?.id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    // Convert R2 URLs to signed URLs
    const userWithSignedUrls = await convertToSignedUrls(result.rows[0])

    res.json(userWithSignedUrls)
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ error: "Failed to fetch user" })
  }
})

// Change own password
router.post("/me/password", async (req: AuthRequest, res: Response) => {
  try {
    const { current_password, new_password } = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" })
    }

    if (!current_password || !new_password) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" })
    }

    // Get current password hash
    const result = await query("SELECT password FROM users WHERE id = $1", [userId])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    const bcrypt = await import('bcrypt')
    const isValid = await bcrypt.compare(current_password, result.rows[0].password)
    
    if (!isValid) {
      return res.status(401).json({ error: "Current password is incorrect" })
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(new_password, 10)
    await query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, userId])

    res.json({ success: true, message: "Password changed successfully" })
  } catch (error) {
    console.error("Change password error:", error)
    res.status(500).json({ error: "Failed to change password" })
  }
})

// Upload avatar for current user
router.post("/me/avatar", upload.single('avatar'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" })
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    // Check if avatar_url column exists
    const hasAvatarCol = (await query("SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url' LIMIT 1")).rows.length > 0
    
    if (!hasAvatarCol) {
      // Create the column if it doesn't exist
      await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT")
    }

    // Generate unique filename
    const ext = req.file.originalname.split('.').pop() || 'jpg'
    const filename = `avatars/${userId}_${Date.now()}.${ext}`
    
    // Upload to R2 - uploadBuffer returns the key as a string
    await uploadBuffer(filename, req.file.buffer, req.file.mimetype)

    // Get signed URL
    const signedUrl = await getSignedDownloadUrl(filename)
    
    // Update user record with the R2 key
    await query("UPDATE users SET avatar_url = $1 WHERE id = $2", [filename, userId])

    res.json({ 
      success: true, 
      avatar_url: signedUrl,
      key: filename
    })
  } catch (error) {
    console.error("Avatar upload error:", error)
    res.status(500).json({ error: "Failed to upload avatar" })
  }
})

// Get managers list (public endpoint for all authenticated users)
router.get("/managers", async (req: AuthRequest, res: Response) => {
  try {
    const hasEmail = (await query("SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email' LIMIT 1")).rows.length > 0
    const hasName = (await query("SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name' LIMIT 1")).rows.length > 0

    let select = "id, username AS username, full_name AS full_name, role"
    if (hasEmail && hasName) select = "id, email AS username, name AS full_name, role"
    else if (hasEmail) select = "id, email AS username, full_name AS full_name, role"
    else if (hasName) select = "id, username AS username, name AS full_name, role"

    const result = await query(`
      SELECT ${select} 
      FROM users 
      WHERE role IN ('admin', 'manager', 'supervisor') 
      ORDER BY full_name ASC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error("Get managers error:", error)
    res.status(500).json({ error: "Failed to fetch managers" })
  }
})

// Update user permissions (Admin only)
router.put("/:id/permissions", authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { permissions } = req.body
    const updatedBy = req.user?.id

    if (!updatedBy) {
      return res.status(401).json({ error: 'غير مصرح' })
    }

    // SECURITY: منع المستخدم من تعديل صلاحياته الخاصة
    if (Number(id) === updatedBy) {
      return res.status(403).json({ error: 'لا يمكنك تعديل صلاحياتك الخاصة' })
    }

    // Check if permissions column exists
    const hasPermissions = (await query("SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'permissions' LIMIT 1")).rows.length > 0

    if (!hasPermissions) {
      return res.status(400).json({ error: "Permissions system not available" })
    }

    await query('UPDATE users SET permissions = $1 WHERE id = $2', [JSON.stringify(permissions || {}), id])

    res.json({ success: true })
  } catch (error) {
    console.error("Update permissions error:", error)
    res.status(500).json({ error: "Failed to update permissions" })
  }
})

export default router
