"use client"
import React, { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { Spinner } from './ui/spinner'
import { Activity, Server, Shield, Clock, AlertTriangle, CheckCircle, RefreshCw, Trash2, Terminal } from 'lucide-react'

interface AdminStatusData {
  healthy?: boolean
  version?: string
  at?: string
  logs?: Array<{ ts: string; level: string; message: string; msg?: string }>
  uptime_seconds?: number
  env?: {
    r2_configured?: boolean
    supabase_configured?: boolean
    backups_enabled?: boolean
  }
  [key: string]: unknown
}

export default function AdminStatus() {
  const [status, setStatus] = useState<AdminStatusData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const s = await apiClient.getAdminStatus()
      setStatus(s)
    } catch (e: any) {
      console.error('Failed to load admin status', e)
      setError(e.message || 'فشل الاتصال بالخادم')
      setStatus(null)
    }
    setLoading(false)
  }

  const clearLogs = async () => {
    if (!confirm('هل تريد مسح السجلات الأخيرة؟')) return
    try {
      await apiClient.clearAdminLogs()
      await load()
      alert('تم مسح السجلات')
    } catch (e: any) {
      alert('فشل مسح السجلات: ' + (e?.message || e))
    }
  }

  useEffect(() => { load() }, [])

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '—'
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days} يوم, ${hours} ساعة, ${minutes} دقيقة`
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
              <Activity className="text-blue-600" size={24} />
              حالة النظام
            </h3>
            <p className="text-sm text-slate-500">نظرة عامة على صحة النظام، الخدمات المتصلة، والسجلات الأخيرة.</p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={load} 
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              تحديث
            </button>
            <button 
              onClick={clearLogs} 
              className="px-4 py-2 rounded-xl bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 font-bold flex items-center gap-2 transition-colors"
            >
              <Trash2 size={16} />
              مسح السجلات
            </button>
            <button 
              onClick={async () => {
                if (!confirm('هل أنت متأكد؟ سيتم إعادة ترقيم جميع المستندات وإعادة تعيين التسلسل. هذا الإجراء لا يمكن التراجع عنه.')) return
                try {
                  const res = await apiClient.fixSequences()
                  alert(`تمت العملية بنجاح.\nوارد: ${res.inCount}\nصادر: ${res.outCount}`)
                  load()
                } catch (e: any) {
                  alert('فشل العملية: ' + (e?.message || e))
                }
              }}
              className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 hover:bg-amber-100 font-bold flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={16} />
              إصلاح التسلسل
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertTriangle size={20} />
            <span className="font-bold">خطأ: {error}</span>
            <button onClick={load} className="mr-auto text-sm underline hover:no-underline">إعادة المحاولة</button>
          </div>
        )}
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Health Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Activity size={14} /> الحالة العامة
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className={`w-4 h-4 rounded-full ${status?.healthy ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <div className="text-lg font-black text-slate-800">
              {loading ? '...' : (status?.healthy ? 'نظام مستقر' : 'مشكلة في النظام')}
            </div>
          </div>
        </div>

        {/* Version */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Server size={14} /> الإصدار
          </div>
          <div className="text-lg font-black text-slate-800 font-mono">
            {loading ? '...' : (status?.version || 'غير معروف')}
          </div>
        </div>

        {/* Uptime */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Clock size={14} /> وقت التشغيل
          </div>
          <div className="text-sm font-bold text-slate-800">
            {loading ? '...' : formatUptime(status?.uptime_seconds)}
          </div>
        </div>

        {/* Services */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Shield size={14} /> الخدمات
          </div>
          <div className="flex gap-2 mt-1">
            {status?.env?.supabase_configured && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded">Supabase</span>
            )}
            {status?.env?.r2_configured && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">R2 Storage</span>
            )}
            {status?.env?.backups_enabled && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">Backups</span>
            )}
            {!loading && !status?.env && <span className="text-slate-400 text-xs">—</span>}
          </div>
        </div>
      </div>

      {/* Logs Console */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <Terminal size={16} />
            <span className="text-xs font-mono font-bold">SYSTEM LOGS</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            {status?.at ? new Date(status.at).toLocaleString('en-US') : ''}
          </div>
        </div>
        
        <div className="h-96 overflow-auto p-4 font-mono text-xs custom-scrollbar">
          {loading && (
            <div className="flex items-center justify-center h-full text-slate-500 gap-2">
              <Spinner className="w-4 h-4" /> جارٍ تحميل السجلات...
            </div>
          )}
          
          {!loading && status && status.logs && status.logs.length > 0 ? (
            <div className="flex flex-col gap-1">
              {status.logs.map((l:any, idx:number) => (
                <div key={idx} className={`flex gap-3 py-1 border-b border-slate-800/50 last:border-0 ${
                  l.level === 'error' ? 'text-red-400 bg-red-900/10' : 
                  l.level === 'warn' ? 'text-amber-400' : 
                  'text-slate-300'
                }`}>
                  <span className="text-slate-600 shrink-0 w-32 select-none">
                    {new Date(l.ts).toLocaleTimeString('en-US', { hour12: false })}
                  </span>
                  <span className={`font-bold uppercase w-16 shrink-0 ${
                    l.level === 'error' ? 'text-red-500' : 
                    l.level === 'warn' ? 'text-amber-500' : 
                    'text-blue-500'
                  }`}>
                    [{l.level || 'INFO'}]
                  </span>
                  <span className="break-all whitespace-pre-wrap">{l.msg || l.message}</span>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                <Terminal size={32} className="opacity-20" />
                <p>لا توجد سجلات متاحة حالياً</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
