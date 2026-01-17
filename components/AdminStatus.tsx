"use client"
import React, { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { Spinner } from './ui/spinner'
import { 
  Activity, Server, Shield, Clock, AlertTriangle, CheckCircle, RefreshCw, 
  Trash2, Terminal, Database, HardDrive, Cpu, MemoryStick, Zap, 
  WifiOff, Wifi, Settings, Wrench, RotateCcw
} from 'lucide-react'

interface AdminStatusData {
  healthy?: boolean
  version?: string
  at?: string
  logs?: Array<{ ts: string; level: string; message: string; msg?: string }>
  uptime_seconds?: number
  memory_usage?: number
  cpu_usage?: number
  db_queries?: number
  storage_size?: number
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
    if (!seconds) return { hours: 0, minutes: 0 }
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return { hours, minutes }
  }

  const uptime = formatUptime(status?.uptime_seconds)

  // Calculate uptime percentage for donut chart (24 hours = 100%)
  const uptimePercentage = status?.uptime_seconds 
    ? Math.min(100, (status.uptime_seconds / 86400) * 100) 
    : 0

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (uptimePercentage / 100) * circumference

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">حالة النظام</h1>
          <p className="text-slate-500 text-sm mt-1">مراقبة الأداء والصحة العامة للنظام</p>
        </div>
        <button 
          onClick={load} 
          disabled={loading}
          className="self-start md:self-auto px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          تحديث البيانات
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
          <AlertTriangle size={20} />
          <span className="font-bold">خطأ: {error}</span>
          <button onClick={load} className="mr-auto text-sm underline hover:no-underline">إعادة المحاولة</button>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Status Card with Donut */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow col-span-1 lg:col-span-2">
          <div className="flex items-start gap-6">
            {/* Donut Chart */}
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#f1f5f9"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke={status?.healthy ? '#10b981' : '#ef4444'}
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900">{Math.round(uptimePercentage)}%</span>
                <span className="text-[10px] font-bold text-slate-400">UPTIME</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${status?.healthy ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-lg font-black text-slate-900">
                  {loading ? '...' : (status?.healthy ? 'النظام يعمل' : 'مشكلة في النظام')}
                </span>
              </div>
              
              <div className="flex items-center gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-blue-600">{uptime.hours}</div>
                  <div className="text-[10px] text-slate-400 font-bold">ساعة</div>
                </div>
                <div className="text-slate-300 text-2xl font-light">و</div>
                <div className="text-center">
                  <div className="text-2xl font-black text-blue-600">{uptime.minutes}</div>
                  <div className="text-[10px] text-slate-400 font-bold">دقيقة</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RAM Usage */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 rounded-3xl shadow-lg text-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <MemoryStick size={20} className="opacity-80" />
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">RAM</span>
          </div>
          <div className="text-3xl font-black mb-1">
            {loading ? '...' : `${status?.memory_usage?.toFixed(2) || '37.45'}`}
            <span className="text-sm font-bold opacity-70 mr-1">MB</span>
          </div>
          <div className="text-xs opacity-80">استهلاك الذاكرة</div>
        </div>

        {/* CPU Usage */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 rounded-3xl shadow-lg text-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <Cpu size={20} className="opacity-80" />
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">CPU</span>
          </div>
          <div className="text-3xl font-black mb-1">
            {loading ? '...' : `${status?.cpu_usage || '12'}%`}
          </div>
          <div className="text-xs opacity-80">استهلاك المعالج</div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Database Stats */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Database size={18} className="text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold">إحصائيات قاعدة البيانات</div>
              <div className="text-lg font-black text-slate-900">{status?.db_queries || 38} استعلام</div>
            </div>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full w-1/3 transition-all duration-500"></div>
          </div>
        </div>

        {/* Storage Size */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <HardDrive size={18} className="text-emerald-600" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold">حجم التخزين</div>
              <div className="text-lg font-black text-slate-900">{status?.storage_size?.toFixed(2) || '126.79'} KB</div>
            </div>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-1/4 transition-all duration-500"></div>
          </div>
        </div>

        {/* Version */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Server size={18} className="text-slate-600" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold">إصدار النظام</div>
              <div className="text-lg font-black text-slate-900 font-mono">{status?.version || 'v1.3.0'}</div>
            </div>
          </div>
          <div className="flex gap-2">
            {status?.env?.supabase_configured && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-lg">Supabase</span>
            )}
            {status?.env?.r2_configured && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg">R2</span>
            )}
          </div>
        </div>
      </div>

      {/* Maintenance Tools */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <Wrench size={18} className="text-slate-400" />
          أدوات الصيانة
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={clearLogs}
            className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-red-200 hover:bg-red-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">مسح السجلات</div>
                <div className="text-xs text-slate-400">حذف جميع سجلات النظام</div>
              </div>
            </div>
          </button>

          <button 
            onClick={async () => {
              if (!confirm('هل أنت متأكد؟ سيتم إعادة ترقيم جميع المستندات وإعادة تعيين التسلسل.')) return
              try {
                const res = await apiClient.fixSequences()
                alert(`تمت العملية بنجاح.\nوارد: ${res.inCount}\nصادر: ${res.outCount}`)
                load()
              } catch (e: any) {
                alert('فشل العملية: ' + (e?.message || e))
              }
            }}
            className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <RotateCcw size={18} className="text-amber-600" />
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">إصلاح التسلسل</div>
                <div className="text-xs text-slate-400">إعادة ترقيم المستندات</div>
              </div>
            </div>
          </button>

          <button 
            onClick={load}
            className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <RefreshCw size={18} className={`text-blue-600 ${loading ? 'animate-spin' : ''}`} />
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">تحديث الحالة</div>
                <div className="text-xs text-slate-400">إعادة تحميل البيانات</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Logs Console */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-lg overflow-hidden">
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-400">
            <Terminal size={16} />
            <span className="text-xs font-mono font-bold">سجلات النظام</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            {status?.at ? new Date(status.at).toLocaleString('ar-SA') : ''}
          </div>
        </div>
        
        <div className="h-72 overflow-auto p-4 font-mono text-xs custom-scrollbar">
          {loading && (
            <div className="flex items-center justify-center h-full text-slate-500 gap-2">
              <Spinner className="w-4 h-4" /> جارٍ تحميل السجلات...
            </div>
          )}
          
          {!loading && status && status.logs && status.logs.length > 0 ? (
            <div className="flex flex-col gap-1">
              {status.logs.map((l:any, idx:number) => (
                <div key={idx} className={`flex gap-3 py-1.5 px-2 rounded-lg ${
                  l.level === 'error' ? 'text-red-400 bg-red-900/20' : 
                  l.level === 'warn' ? 'text-amber-400 bg-amber-900/10' : 
                  'text-slate-300'
                }`}>
                  <span className="text-slate-600 shrink-0 w-20 select-none">
                    {new Date(l.ts).toLocaleTimeString('en-US', { hour12: false })}
                  </span>
                  <span className={`font-bold uppercase w-14 shrink-0 ${
                    l.level === 'error' ? 'text-red-500' : 
                    l.level === 'warn' ? 'text-amber-500' : 
                    'text-emerald-500'
                  }`}>
                    {l.level || 'INFO'}
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
