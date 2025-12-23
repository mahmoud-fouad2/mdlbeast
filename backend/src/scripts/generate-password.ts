import bcrypt from "bcrypt"

/**
 * Script to generate bcrypt hashed passwords
 * Usage: npx ts-node src/scripts/generate-password.ts
 */

async function generatePasswords() {
  const passwords = [
    { username: "admin@zaco.sa", password: "admin123" },
    { username: "user@zaco.sa", password: "user123" },
  ]

  console.log("\n🔐 Generated Bcrypt Password Hashes:\n")

  for (const { username, password } of passwords) {
    const hash = await bcrypt.hash(password, 10)
    console.log(`Username: ${username}`)
    console.log(`Password: ${password}`)
    console.log(`Hash: ${hash}\n`)
  }
}

generatePasswords().catch(console.error)
