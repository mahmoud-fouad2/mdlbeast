"use client"
import React, { useEffect, useRef, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

export default function AppVersionWatcher() {
  const { toast } = useToast()
  const [version, setVersion] = useState<any>(null)
  const polling = useRef<number | null>(null)

  useEffect(() => {
    let mounted = true
    async function fetchVersion() {
      try {
        const v = await apiClient.getAppVersion()
        if (!mounted) return
        if (!version) {
          setVersion(v)
        } else if (version && v && (v.version !== version.version || v.commit !== version.commit)) {
          // New version detected
          toast({ title: 'تحديث جديد متاح', description: 'هناك نسخة جديدة من التطبيق. اضغط لإعادة التحميل.', action: (
            <button onClick={() => window.location.reload(true)} className="font-black text-xs uppercase">إعادة التحميل</button>
          )})
          // Optional: auto reload after short delay
          // setTimeout(() => window.location.reload(true), 5000)
        }
      } catch (err) {
        // ignore
      }
    }

    fetchVersion()
    polling.current = window.setInterval(fetchVersion, 60_000)
    return () => {
      mounted = false
      if (polling.current) window.clearInterval(polling.current)
    }
  }, [version, toast])

  return null
}
