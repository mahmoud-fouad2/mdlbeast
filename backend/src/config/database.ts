import { Pool } from "pg"
import dotenv from "dotenv"

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on("error", (err: Error) => {
  console.error("Unexpected error on idle client", err)
  process.exit(-1)
})

export const query = async (text: string, params?: any[]) => {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    // Only log verbose query info when DEBUG=true or running in non-production
    if (process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production') {
      console.log("Executed query", { text, duration, rows: res.rowCount })
    }
    return res
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

export default pool
