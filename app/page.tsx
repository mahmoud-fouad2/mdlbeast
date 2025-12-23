"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Login from "@/components/Login"
import { apiClient } from "@/lib/api-client"

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        if (token) {
          await apiClient.getCurrentUser()
          router.push("/dashboard")
        }
      } catch (error) {
        localStorage.removeItem("auth_token")
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

  return <Login />
}
