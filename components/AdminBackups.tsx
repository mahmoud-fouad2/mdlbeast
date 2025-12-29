import React, { useEffect, useState } from 'react'
import AsyncButton from './ui/async-button'
import { apiClient } from '@/lib/api-client'
import { Database, Download, Trash2, RefreshCw, Upload, FileJson, HardDrive } from 'lucide-react'

export default function AdminBackups() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await apiClient.listBackups()
      setItems(data.items || data || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
              <Database className="text-blue-600" size={24} />
              نسخ النظام الاحتياطية
            </h3>
            <p className="text-sm text-slate-500">انشاء نسخة كاملة للقاعدة والملفات والإعدادات لاستعادتها عند الحاجة.</p>
          </div>
          <button onClick={load} className="p-2 hover:bg-slate-100 rounded-full transition-colors" title="تحديث القائمة">
            <RefreshCw size={20} className={loading ? "animate-spin text-slate-400" : "text-slate-600"} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Full comprehensive backup (DB + uploads + settings) */}
          <AsyncButton 
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl" 
            onClickAsync={async () => {
              if (!confirm('سيتم إنشاء نسخة شاملة للقاعدة والملفات والإعدادات. موافق؟')) return
              try {
                const res = await apiClient.createBackup()
                await load()
                if (res && res.key) {
                  alert('تم إنشاء النسخة الشاملة بنجاح. المفتاح: ' + res.key)
                } else {
                  alert('تم إنشاء النسخة الشاملة')
                }
              } catch (e) {
                alert('فشل إنشاء النسخة الشاملة')
              }
            }}
          >
            <HardDrive size={24} />
            <span className="font-bold">إنشاء نسخة شاملة</span>
            <span className="text-[10px] opacity-70 font-normal">قاعدة بيانات + ملفات</span>
          </AsyncButton>

          {/* JSON backup (metadata + uploads list) */}
          <AsyncButton 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg" 
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
              } catch (e) { alert('فشل تحميل JSON') }
            }}
          >
            <FileJson size={24} />
            <span className="font-bold">تصدير البيانات (JSON)</span>
            <span className="text-[10px] opacity-70 font-normal">بيانات فقط بدون ملفات</span>
          </AsyncButton>

          <div className="flex flex-col gap-2">
            <label className="flex-1 px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-colors">
              <Upload size={16} className="text-slate-500" />
              <span className="text-sm font-bold text-slate-700">استعادة JSON</span>
              <input type="file" accept="application/json" onChange={async (e) => {
                const f = (e.target as HTMLInputElement).files?.[0]
                if (!f) return
                if (!confirm('استعادة JSON ستقوم بعمل إدخالات/تحديثات في قاعدة البيانات. موافق؟')) return
                try { await apiClient.restoreJsonBackup(f); alert('تمت الاستعادة بنجاح'); await load() } catch (err) { alert('فشل الاستعادة') }
              }} style={{ display: 'none' }} />
            </label>

            <label className="flex-1 px-4 py-3 bg-red-50 hover:bg-red-100 border border-dashed border-red-200 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-colors">
              <Upload size={16} className="text-red-500" />
              <span className="text-sm font-bold text-red-700">استعادة شاملة (ملف)</span>
              <input type="file" accept=".tar,.tar.gz,.tgz,.gpg,.enc" onChange={async (e) => {
                const f = (e.target as HTMLInputElement).files?.[0]
                if (!f) return
                if (!confirm('تحذير: استعادة ملف شاملة ستستبدل قاعدة البيانات والملفات الحالية تماماً. هذا إجراء لا يمكن التراجع عنه. موافق؟')) return
                try {
                  await apiClient.restoreBackupUpload(f)
                  alert('تمت الاستعادة الشاملة من الملف بنجاح')
                  await load()
                } catch (err) { alert('فشل استعادة الملف: ' + ((err as any)?.message || 'خطأ')) }
              }} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">الأرشيف المحلي</h4>
          {items.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Database className="mx-auto text-slate-300 mb-3" size={48} />
              <div className="text-slate-400 font-medium">لا توجد نسخ احتياطية محفوظة</div>
            </div>
          )}
          
          <div className="grid gap-3">
            {items.map(i => (
              <div key={i.key} className="p-4 border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Database size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-800">{i.key}</div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span>{i.lastModified ? new Date(i.lastModified).toLocaleString('ar-SA') : ''}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span dir="ltr">{(i.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button 
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors" 
                    onClick={async () => {
                      try {
                        const r = await apiClient.downloadBackupUrl(i.key)
                        window.open(r.url || r.previewUrl || r.signedUrl, '_blank')
                      } catch (e) { alert('Download failed') }
                    }}
                  >
                    <Download size={16} />
                    تحميل
                  </button>
                  
                  <button 
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors" 
                    onClick={async () => {
                      if (!confirm('تحذير: استعادة النسخة الشاملة ستستبدل قاعدة البيانات والملفات الحالية تماماً. هل أنت متأكد؟')) return
                      if (!confirm('تأكيد نهائي: هل تريد حقاً استعادة هذه النسخة؟ سيتم فقدان أي بيانات تم إنشاؤها بعد هذه النسخة.')) return
                      try {
                        await apiClient.restoreBackup(i.key)
                        alert('تمت الاستعادة بنجاح')
                        await load()
                      } catch (e) { alert('استعادة فشلت: ' + (e as any)?.message || 'خطأ') }
                    }}
                  >
                    <RefreshCw size={16} />
                    استعادة
                  </button>

                  <button 
                    className="px-3 py-2 bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg transition-colors" 
                    title="حذف النسخة"
                    onClick={async () => {
                      if (!confirm('هل أنت متأكد أنك تريد حذف النسخة؟')) return
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
      </div>
    </div>
  )
}
