"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Login from "@/components/Login"
import InstallPWA from "@/components/InstallPWA"
import { apiClient } from "@/lib/api-client"

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        // Only try to validate if we have a token
        if (token) {
          try {
            await apiClient.getCurrentUser()
            router.push("/dashboard")
            return
          } catch (error) {
            // Token is invalid or expired, clear it
            console.warn('Token validation failed, clearing')
            localStorage.removeItem("auth_token")
            apiClient.clearToken()
          }
        }
      } catch (error) {
        console.warn('Auth check error:', error)
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-slate-900 font-black text-xl">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <>
      <Login />
      <InstallPWA />
    </>
  )
}
