import React, { useEffect, useState, useCallback } from 'react'
import AsyncButton from './ui/async-button'
import { apiClient } from '@/lib/api-client'
import { useI18n } from '@/lib/i18n-context'
import { 
  Database, Download, Trash2, RefreshCw, RotateCcw, Upload, FileJson, HardDrive, 
  Cloud, Clock, Calendar, Shield, FileArchive,
  Settings, History, ChevronDown, ChevronUp, Info,
  Copy, Timer
} from 'lucide-react'

interface BackupItem {
  key: string
  lastModified?: string
  size: number
  type?: string
}

interface BackupStats {
  totalBackups: number
  totalSize: number
  lastBackup?: string
  oldestBackup?: string
}

export default function AdminBackups() {
  const { t, locale } = useI18n()
  const [items, setItems] = useState<BackupItem[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<BackupStats>({ totalBackups: 0, totalSize: 0 })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [isCreatingR2Backup, setIsCreatingR2Backup] = useState(false)
  const [r2BackupProgress, setR2BackupProgress] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiClient.listBackups()
      const backupItems = data.items || data || []
      setItems(backupItems)
      
      // Calculate stats
      const totalSize = backupItems.reduce((acc: number, item: BackupItem) => acc + (item.size || 0), 0)
      const sortedByDate = [...backupItems].sort((a, b) => 
        new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime()
      )
      
      setStats({
        totalBackups: backupItems.length,
        totalSize,
        lastBackup: sortedByDate[0]?.lastModified,
        oldestBackup: sortedByDate[sortedByDate.length - 1]?.lastModified
      })
      setLastRefresh(new Date())
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return t('backup.time.undefined')
    try {
      return new Date(dateStr).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  const getBackupAge = (dateStr?: string) => {
    if (!dateStr) return null
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return t('backup.time.today')
    if (days === 1) return t('backup.time.yesterday')
    if (days < 7) return t('backup.time.days_ago').replace('{{days}}', days.toString())
    if (days < 30) return t('backup.time.weeks_ago').replace('{{weeks}}', Math.floor(days / 7).toString())
    return t('backup.time.months_ago').replace('{{months}}', Math.floor(days / 30).toString())
  }

  const toggleSelectItem = (key: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const deleteSelected = async () => {
    if (selectedItems.size === 0) return
    if (!confirm(t('backup.actions.delete_confirm').replace('{{count}}', selectedItems.size.toString()))) return
    
    for (const key of selectedItems) {
      try {
        await apiClient.deleteBackup(key)
      } catch (e) {
        console.error(`Failed to delete ${key}:`, e)
      }
    }
    setSelectedItems(new Set())
    await load()
  }

  const copyBackupKey = (key: string) => {
    navigator.clipboard.writeText(key)
    // Could add a toast notification here
  }

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <HardDrive className="text-emerald-600" size={24} />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">{formatSize(stats.totalSize)}</div>
              <div className="text-xs font-bold text-slate-500">{t('backup.stats.total_size')}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
              <Clock className="text-amber-600" size={24} />
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 truncate">{getBackupAge(stats.lastBackup) || t('backup.stats.none')}</div>
              <div className="text-xs font-bold text-slate-500 truncate">
                {stats.lastBackup ? formatDate(stats.lastBackup).split(',')[0] : t('backup.stats.not_backed_up')}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
              <Shield className="text-purple-600" size={24} />
            </div>
             <div>
               <div className="flex items-center gap-2">
                 <div className={`w-3 h-3 rounded-full ${stats.totalBackups > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                 <span className="text-xl font-black text-slate-900">{stats.totalBackups > 0 ? t('backup.stats.protected') : t('backup.stats.unprotected')}</span>
               </div>
               <div className="text-xs font-bold text-slate-500">{t('backup.stats.status')}</div>
             </div>
          </div>
        </div>
      </div>

      {/* Main Backup Panel */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black mb-2 flex items-center gap-3">
              <div className="p-3 bg-indigo-50 rounded-2xl">
                <Database className="text-indigo-600" size={24} />
              </div>
              <span className="text-slate-900">{t('backup.section.title')}</span>
            </h3>
            <p className="text-sm text-slate-500 font-medium">{t('backup.section.description')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-400 font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center gap-2">
              <RefreshCw size={12} />
              {lastRefresh.toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <button 
              onClick={load} 
              className="p-3 hover:bg-slate-50 rounded-xl transition-all border border-slate-200 hover:border-slate-300 active:scale-95" 
              title={t('backup.actions.refresh')}
            >
              <RefreshCw size={20} className={loading ? "animate-spin text-indigo-500" : "text-slate-600"} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Full Backup Card */}
          <AsyncButton 
            className="group relative overflow-hidden bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 p-6 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all shadow-sm hover:shadow-lg h-full" 
            onClickAsync={async () => {
              if (!confirm(t('backup.cards.full.confirm'))) return
              try {
                const res = await apiClient.createBackup()
                await load()
                if (res && res.key) {
                  alert(t('backup.success_full_key') + res.key)
                } else {
                  alert(t('backup.success_full'))
                }
              } catch (_e) {
                alert(t('backup.error_full'))
              }
            }}
          >
            <div className="p-4 bg-indigo-50 rounded-2xl group-hover:scale-110 transition-transform mb-2">
              <HardDrive size={32} className="text-indigo-600" />
            </div>
            <div className="text-center">
              <div className="font-black text-lg text-slate-800 mb-1">{t('backup.cards.full.title')}</div>
              <div className="text-xs text-slate-500 font-medium">{t('backup.cards.full.desc')}</div>
            </div>
            <div className="mt-auto pt-4 border-t border-slate-100 w-full text-center text-[10px] text-slate-400 font-bold">
               {t('backup.cards.full.footer')}
            </div>
          </AsyncButton>

          {/* R2 Backup Card */}
          <button
            disabled={isCreatingR2Backup}
            onClick={async () => {
              if (!confirm(t('backup.cards.r2.confirm'))) return;
              
              setIsCreatingR2Backup(true);
              setR2BackupProgress(t('backup.cards.r2.progress_scan'));
              
              try {
                setR2BackupProgress(t('backup.cards.r2.progress_compress'));
                const data = await apiClient.createBackup();
                
                if (data.downloadUrl) {
                  setR2BackupProgress(t('backup.progress_ready'));
                  window.open(data.downloadUrl, '_blank');
                  const msg = t('backup.success_r2')
                    .replace('{{size}}', formatSize(data.totalSize))
                    .replace('{{files}}', data.totalFiles)
                    .replace('{{date}}', formatDate(data.expiresAt))
                  alert(msg);
                }
              } catch (e: any) {
                console.error(e);
                alert(t('backup.error_r2') + (e.message || t('backup.error_generic')));
              } finally {
                setIsCreatingR2Backup(false);
                setR2BackupProgress(null);
              }
            }}
            className="group relative overflow-hidden bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-300 p-6 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all shadow-sm hover:shadow-lg h-full"
          >
            <div className="p-4 bg-emerald-50 rounded-2xl group-hover:scale-110 transition-transform mb-2">
              {isCreatingR2Backup ? <RefreshCw size={32} className="animate-spin text-emerald-600" /> : <Cloud size={32} className="text-emerald-600" />}
            </div>
            <div className="text-center">
              <div className="font-black text-lg text-slate-800 mb-1">{t('backup.cards.r2.title')}</div>
              <div className="text-xs text-slate-500 font-medium">{isCreatingR2Backup ? r2BackupProgress : t('backup.cards.r2.desc')}</div>
            </div>
            <div className="mt-auto pt-4 border-t border-slate-100 w-full text-center text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-1">
               <Timer size={12} />
               {t('backup.cards.r2.footer')}
            </div>
          </button>

          {/* JSON Export Card */}
          <AsyncButton 
            className="group relative overflow-hidden bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-300 p-6 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all shadow-sm hover:shadow-lg h-full" 
            onClickAsync={async () => {
                if (!confirm(t('backup.cards.json.confirm'))) return;
                try {
                    const [docsRes, users, auditLogs] = await Promise.all([
                        apiClient.getDocuments({ limit: 10000 }).catch(() => ({ data: [] })),
                        apiClient.getUsers().catch(() => []), 
                        apiClient.getAuditLogs(10000).catch(() => [])
                    ]);
                    const docs = docsRes.data || [];
                    const payload = { meta: { version: '2.1', date: new Date().toISOString() }, data: { documents: docs, users, audit_logs: auditLogs } };
                    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `MDLBEAST-BACKUP-${new Date().toISOString()}.json`;
                    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                    alert(t('backup.success_export').replace('{{count}}', docs.length.toString()))
                } catch (e) { console.error(e); alert(t('backup.error_export')); }
            }}
          >
            <div className="p-4 bg-amber-50 rounded-2xl group-hover:scale-110 transition-transform mb-2">
              <FileJson size={32} className="text-amber-600" />
            </div>
            <div className="text-center">
              <div className="font-black text-lg text-slate-800 mb-1">{t('backup.cards.json.title')}</div>
              <div className="text-xs text-slate-500 font-medium">{t('backup.cards.json.desc')}</div>
            </div>
            <div className="mt-auto pt-4 border-t border-slate-100 w-full text-center text-[10px] text-slate-400 font-bold">
               {t('backup.cards.json.footer')}
            </div>
          </AsyncButton>
        </div>

        {/* Restore Section */}
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 mb-8">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-white rounded-lg shadow-sm">
                <RotateCcw size={20} className="text-slate-600" />
             </div>
             <h3 className="font-black text-slate-700">{t('backup.restore')}</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="cursor-pointer group relative overflow-hidden bg-white hover:border-indigo-400 border border-slate-200 border-dashed p-4 rounded-2xl flex items-center gap-4 transition-all">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                <Upload size={20} />
              </div>
              <div>
                <div className="font-bold text-slate-800 text-sm mb-1 group-hover:text-indigo-700">{t('backup.cards.json_restore.title')}</div>
                <div className="text-[10px] text-slate-400">{t('backup.cards.json_restore.desc')}</div>
              </div>
              <input type="file" accept="application/json" onChange={async (e) => {
                const f = (e.target as HTMLInputElement).files?.[0]; if(!f) return;
                if(confirm(t('backup.confirm_restore_json'))) { try { await apiClient.restoreJsonBackup(f); alert(t('backup.success_restore')); await load() } catch { alert(t('backup.error_generic')) } }
              }} className="hidden" />
            </label>

            <label className="cursor-pointer group relative overflow-hidden bg-white hover:border-red-400 border border-slate-200 border-dashed p-4 rounded-2xl flex items-center gap-4 transition-all">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:scale-110 transition-transform">
                <FileArchive size={20} />
              </div>
              <div>
                <div className="font-bold text-slate-800 text-sm mb-1 group-hover:text-red-700">{t('backup.cards.full_restore.title')}</div>
                <div className="text-[10px] text-slate-400">{t('backup.cards.full_restore.desc')}</div>
              </div>
              <input type="file" accept=".tar,.tar.gz,.tgz,.gpg,.enc" onChange={async (e) => {
                const f = (e.target as HTMLInputElement).files?.[0]; if(!f) return;
                if(confirm(t('backup.confirm_restore_upload'))) { try { await apiClient.restoreBackupUpload(f); alert(t('backup.success_restore')); await load() } catch { alert(t('backup.error_generic')) } }
              }} className="hidden" />
            </label>
           </div>
        </div>

        {/* Advanced Options Toggle */}
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all mb-6 border border-slate-200"
        >
          <div className="flex items-center gap-3">
            <Settings size={18} className="text-slate-500" />
            <span className="font-bold text-slate-700">{t('backup.options.advanced')}</span>
          </div>
          {showAdvanced ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>

        {showAdvanced && (
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Auto backup toggle */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <Timer size={18} className="text-blue-500" />
                  <div>
                    <div className="font-bold text-slate-700 text-sm">{t('backup.options.auto_backup')}</div>
                    <div className="text-xs text-slate-400">{t('backup.options.auto_backup_desc')}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setAutoBackupEnabled(!autoBackupEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${autoBackupEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoBackupEnabled ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>

              {/* Delete selected */}
              {selectedItems.size > 0 && (
                <button 
                  onClick={deleteSelected}
                  className="flex items-center justify-center gap-2 p-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-colors"
                >
                  <Trash2 size={18} />
                  <span className="font-bold">{t('backup.options.delete_selected').replace('{{count}}', selectedItems.size.toString())}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <Info size={16} className="text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700">
                {t('backup.options.warning_text')}
              </p>
            </div>
          </div>
        )}

        {/* Backup List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-black text-slate-800 flex items-center gap-2">
              <History size={18} className="text-slate-400" />
              {t('backup.list.title')}
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                </svg>
              </button>
            </div>
          </div>

          {items.length === 0 && (
            <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Database className="text-slate-300" size={40} />
              </div>
              <div className="text-slate-500 font-black text-lg mb-2">{t('backup.list.empty_title')}</div>
              <p className="text-slate-400 text-sm">{t('backup.list.empty_desc')}</p>
            </div>
          )}
          
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}>
            {items.map((i, index) => (
              <div 
                key={i.key} 
                className={`p-5 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group hover:shadow-lg ${
                  selectedItems.has(i.key) 
                    ? 'bg-blue-50 border-blue-200 shadow-md' 
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  {showAdvanced && (
                    <input 
                      type="checkbox" 
                      checked={selectedItems.has(i.key)}
                      onChange={() => toggleSelectItem(i.key)}
                      className="w-5 h-5 rounded-lg border-2 border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  )}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110 ${
                    i.key.includes('full') || i.key.includes('comprehensive') 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {i.key.includes('full') ? <HardDrive size={22} /> : <Database size={22} />}
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-800 mb-1 flex items-center gap-2">
                      {i.key.length > 30 ? i.key.substring(0, 30) + '...' : i.key}
                      <button 
                        onClick={() => copyBackupKey(i.key)} 
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-all"
                        title={t('backup.list.copy_key')}
                      >
                        <Copy size={12} className="text-slate-400" />
                      </button>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(i.lastModified)}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded" dir="ltr">{formatSize(i.size)}</span>
                      {getBackupAge(i.lastModified) && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="text-slate-400">{getBackupAge(i.lastModified)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button 
                    className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md" 
                    onClick={async () => {
                      try {
                        const r = await apiClient.downloadBackupUrl(i.key)
                        window.open(r.url || r.previewUrl || r.signedUrl, '_blank')
                      } catch (_e) { alert(t('backup.error_download')) }
                    }}
                  >
                    <Download size={16} />
                    {t('backup.list.actions.download')}
                  </button>
                  
                  <button 
                    className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md" 
                    onClick={async () => {
                      if (!confirm(t('backup.list.restore_confirm_1'))) return
                      if (!confirm(t('backup.list.restore_confirm_2'))) return
                      try {
                        await apiClient.restoreBackup(i.key)
                        alert(t('backup.success_restore_full'))
                        await load()
                      } catch (e) { alert(t('backup.error_restore_detail') + (e as any)?.message || t('backup.error_generic')) }
                    }}
                  >
                    <RefreshCw size={16} />
                    {t('backup.list.actions.restore')}
                  </button>

                  <button 
                    className="px-3 py-2.5 bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-xl transition-all shadow-sm hover:shadow-md" 
                    title={t('backup.options.delete')}
                    onClick={async () => {
                      if (!confirm(t('backup.list.actions.delete_confirm_single'))) return
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
        </div>

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-emerald-500" />
            <span>{t('backup.footer.encrypted')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Cloud size={14} />
            <span>{t('backup.footer.cloud_connected')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

