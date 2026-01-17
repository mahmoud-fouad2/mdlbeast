"use client"
import React, { useEffect, useState } from 'react'
import AsyncButton from './ui/async-button'
import { apiClient } from '@/lib/api-client'
import { Database, Download, Trash2, RefreshCw, Upload, FileJson, HardDrive, Cloud, Shield, Clock, Calendar, CheckCircle } from 'lucide-react'
import { t, getCurrentLanguage, Language } from '@/lib/translations'

export default function AdminBackups() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState<Language>('en')
  const [totalSize, setTotalSize] = useState(0)
  const [lastBackup, setLastBackup] = useState<Date | null>(null)

  useEffect(() => {
    setLang(getCurrentLanguage())
  }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await apiClient.listBackups()
      const itemsList = data.items || data || []
      setItems(itemsList)
      
      // Calculate total size
      const total = itemsList.reduce((acc: number, item: any) => acc + (item.size || 0), 0)
      setTotalSize(total)
      
      // Get last backup date
      if (itemsList.length > 0) {
        const dates = itemsList.map((item: any) => new Date(item.lastModified)).filter((d: Date) => !isNaN(d.getTime()))
        if (dates.length > 0) {
          setLastBackup(new Date(Math.max(...dates.map((d: Date) => d.getTime()))))
        }
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const isRTL = lang === 'ar'

  const formatDate = (date: Date | null) => {
    if (!date) return '—'
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return lang === 'ar' ? 'اليوم' : 'Today'
    if (days === 1) return lang === 'ar' ? 'أمس' : 'Yesterday'
    return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">{t('systemBackups', lang)}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('backupsDescription', lang)}</p>
        </div>
        <button 
          onClick={load}
          disabled={loading}
          className="self-start md:self-auto px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {t('refresh', lang)}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Size */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-3xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-3">
            <HardDrive size={20} className="opacity-80" />
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">{lang === 'ar' ? 'إجمالي' : 'TOTAL'}</span>
          </div>
          <div className="text-3xl font-black mb-1">
            {(totalSize / 1024).toFixed(2)}
            <span className="text-sm font-bold opacity-70 mr-1">KB</span>
          </div>
          <div className="text-xs opacity-80">{lang === 'ar' ? 'حجم النسخ الاحتياطية' : 'Backup Size'}</div>
        </div>

        {/* Last Backup */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-3xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-3">
            <Calendar size={20} className="opacity-80" />
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">{lang === 'ar' ? 'آخر نسخة' : 'LATEST'}</span>
          </div>
          <div className="text-2xl font-black mb-1">
            {formatDate(lastBackup)}
          </div>
          <div className="text-xs opacity-80">{lastBackup?.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) || '—'}</div>
        </div>

        {/* Status */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 rounded-3xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-3">
            <Shield size={20} className="opacity-80" />
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">{lang === 'ar' ? 'الحالة' : 'STATUS'}</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={24} />
            <span className="text-xl font-black">{lang === 'ar' ? 'محمي' : 'Protected'}</span>
          </div>
          <div className="text-xs opacity-80">{items.length} {lang === 'ar' ? 'نسخة متاحة' : 'backups available'}</div>
        </div>
      </div>

      {/* Backup Center */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
          <Database size={18} className="text-blue-600" />
          {lang === 'ar' ? 'مركز النسخ الاحتياطي' : 'Backup Center'}
        </h3>
        <p className="text-xs text-slate-400 mb-6">{lang === 'ar' ? 'النسخ الاحتياطي مجدول كل ساعتين' : 'Backups scheduled every 2 hours'}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* JSON Export */}
          <AsyncButton 
            className="group p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-right" 
            onClickAsync={async () => {
              try {
                const blob = await apiClient.downloadJsonBackupBlob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `backup-json-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
                document.body.appendChild(a)
                a.click()
                a.remove()
                URL.revokeObjectURL(url)
              } catch (e) { alert(t('backupFailed', lang)) }
            }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition-colors">
                <FileJson size={24} className="text-amber-600" />
              </div>
              <div>
                <div className="font-black text-slate-900 mb-1">{t('exportJSON', lang)}</div>
                <div className="text-xs text-slate-400">{t('jsonExportDesc', lang)}</div>
              </div>
            </div>
          </AsyncButton>

          {/* Cloud (R2) Files */}
          <AsyncButton 
            className="group p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-right" 
            onClickAsync={async () => {
              try {
                const res = await apiClient.createBackup()
                await load()
                if (res && res.key) {
                  alert(t('backupCreated', lang) + ' Key: ' + res.key)
                } else {
                  alert(t('backupCreated', lang))
                }
              } catch (e) {
                alert(t('backupFailed', lang))
              }
            }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                <Cloud size={24} className="text-blue-600" />
              </div>
              <div>
                <div className="font-black text-slate-900 mb-1">{lang === 'ar' ? 'ملفات السحابة R2' : 'Cloud Files (R2)'}</div>
                <div className="text-xs text-slate-400">{lang === 'ar' ? 'نسخة على التخزين السحابي' : 'Backup to cloud storage'}</div>
              </div>
            </div>
          </AsyncButton>

          {/* Full Backup */}
          <AsyncButton 
            className="group p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all text-right" 
            onClickAsync={async () => {
              if (!confirm(t('confirmFullBackup', lang))) return
              try {
                const res = await apiClient.createBackup()
                await load()
                if (res && res.key) {
                  alert(t('backupCreated', lang) + ' Key: ' + res.key)
                } else {
                  alert(t('backupCreated', lang))
                }
              } catch (e) {
                alert(t('backupFailed', lang))
              }
            }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
                <HardDrive size={24} className="text-emerald-600" />
              </div>
              <div>
                <div className="font-black text-slate-900 mb-1">{t('createFullBackup', lang)}</div>
                <div className="text-xs text-slate-400">{t('fullBackupDesc', lang)}</div>
              </div>
            </div>
          </AsyncButton>
        </div>
      </div>

      {/* Restore Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <RefreshCw size={18} className="text-amber-600" />
          {lang === 'ar' ? 'استعادة النسخ الاحتياطية' : 'Restore Backups'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="group p-5 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                <Upload size={24} className="text-blue-600" />
              </div>
              <div>
                <div className="font-black text-slate-900 mb-1">{t('restoreJSON', lang)}</div>
                <div className="text-xs text-slate-400">{lang === 'ar' ? 'رفع ملف JSON للاستعادة' : 'Upload JSON file to restore'}</div>
              </div>
            </div>
            <input type="file" accept="application/json" onChange={async (e) => {
              const f = (e.target as HTMLInputElement).files?.[0]
              if (!f) return
              if (!confirm(t('confirmJSONRestore', lang))) return
              try { 
                await apiClient.restoreJsonBackup(f)
                alert(t('restoreSuccess', lang))
                await load() 
              } catch (err) { 
                alert(t('restoreFailed', lang)) 
              }
            }} className="hidden" />
          </label>

          <label className="group p-5 bg-red-50/50 rounded-2xl border-2 border-dashed border-red-200 hover:border-red-300 hover:bg-red-50 cursor-pointer transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-red-200 transition-colors">
                <Upload size={24} className="text-red-600" />
              </div>
              <div>
                <div className="font-black text-slate-900 mb-1">{t('restoreFull', lang)}</div>
                <div className="text-xs text-red-500">{lang === 'ar' ? 'تحذير: سيتم استبدال جميع البيانات' : 'Warning: All data will be replaced'}</div>
              </div>
            </div>
            <input type="file" accept=".tar,.tar.gz,.tgz,.gpg,.enc" onChange={async (e) => {
              const f = (e.target as HTMLInputElement).files?.[0]
              if (!f) return
              if (!confirm(t('confirmFullRestore', lang))) return
              try {
                await apiClient.restoreBackupUpload(f)
                alert(t('restoreSuccess', lang))
                await load()
              } catch (err) { 
                alert(t('restoreFailed', lang) + ': ' + ((err as any)?.message || 'Error')) 
              }
            }} className="hidden" />
          </label>
        </div>
      </div>

      {/* Backup List */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-slate-400" />
          {t('backupList', lang)}
        </h3>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Database className="mx-auto text-slate-300 mb-4" size={56} />
            <div className="text-slate-400 font-bold text-lg">{t('noBackups', lang)}</div>
            <p className="text-slate-400 text-sm mt-2">{lang === 'ar' ? 'أنشئ أول نسخة احتياطية الآن' : 'Create your first backup now'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(i => (
              <div key={i.key} className="p-4 bg-slate-50 hover:bg-white hover:shadow-md rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                    <Database size={22} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-800 truncate max-w-xs">{i.key}</div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span>{i.lastModified ? new Date(i.lastModified).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US') : ''}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span dir="ltr" className="font-mono">{(i.size / 1024).toFixed(2)} KB</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button 
                    className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 rounded-xl text-sm font-bold flex items-center gap-2 transition-all" 
                    onClick={async () => {
                      try {
                        const r = await apiClient.downloadBackupUrl(i.key)
                        window.open(r.url || r.previewUrl || r.signedUrl, '_blank')
                      } catch (e) { alert('Download failed') }
                    }}
                  >
                    <Download size={16} />
                    {t('downloadBackup', lang)}
                  </button>
                  
                  <button 
                    className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 rounded-xl text-sm font-bold flex items-center gap-2 transition-all" 
                    onClick={async () => {
                      if (!confirm(t('confirmFullRestore', lang))) return
                      try {
                        await apiClient.restoreBackup(i.key)
                        alert(t('restoreSuccess', lang))
                        await load()
                      } catch (e) { alert(t('restoreFailed', lang)) }
                    }}
                  >
                    <RefreshCw size={16} />
                    {t('import', lang)}
                  </button>

                  <button 
                    className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-xl transition-all" 
                    title={t('deleteBackup', lang)}
                    onClick={async () => {
                      if (!confirm(t('confirmDelete', lang))) return
                      await apiClient.deleteBackup(i.key)
                      await load()
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
