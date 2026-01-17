"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Hash, Send, Paperclip, Pin, Trash2, RefreshCcw, AlertCircle } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import AsyncButton from './ui/async-button'

type ChannelInfo = { channel: string; message_count: number; last_message_at?: string | null }

type InternalMessage = {
  id: number
  channel: string
  user_id: number
  full_name?: string
  username?: string
  content: string
  attachments?: any[]
  is_pinned?: boolean
  created_at?: string
}

export default function InternalCommunication() {
  const [channels, setChannels] = useState<ChannelInfo[]>([])
  const [channel, setChannel] = useState('general')
  const [messages, setMessages] = useState<InternalMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingUploads, setPendingUploads] = useState<any[]>([])

  const loadChannels = async () => {
    const res = await apiClient.listInternalChannels()
    const arr = (res as any)?.data || []
    setChannels(arr)
    if (!arr.find((c: any) => c.channel === channel)) setChannel('general')
  }

  const loadMessages = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiClient.listInternalMessages({ channel, limit: 150, offset: 0 })
      const data = (res as any)?.data || []
      // Server returns DESC; show ASC in UI
      setMessages([...data].reverse())
    } catch (e: any) {
      setError(String(e?.message || e || 'فشل تحميل الرسائل'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChannels().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadMessages()
    // light polling like old project (safe)
    const t = setInterval(() => {
      loadMessages().catch(() => {})
      loadChannels().catch(() => {})
    }, 15000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel])

  const sortedChannels = useMemo(() => {
    const list = [...channels]
    list.sort((a, b) => {
      const at = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
      const bt = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
      return bt - at
    })
    // Ensure general first if no activity
    if (!list.find(c => c.channel === 'general')) list.unshift({ channel: 'general', message_count: 0 })
    return list
  }, [channels])

  const onPickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    try {
      const uploaded = await apiClient.uploadFile(file as any, 3, 'documents')
      setPendingUploads(prev => [...prev, uploaded])
    } catch (e: any) {
      alert('فشل رفع المرفق: ' + String(e?.message || e))
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const send = async () => {
    const content = text.trim()
    if (!content && pendingUploads.length === 0) return

    const created = await apiClient.postInternalMessage({
      channel,
      content: content || 'مرفق',
      attachments: pendingUploads,
    })

    setText('')
    setPendingUploads([])
    // optimistic append
    setMessages(prev => [...prev, created])
    loadChannels().catch(() => {})
  }

  const canPin = true // server enforces role

  const onPin = async (id: number, pinned: boolean) => {
    await apiClient.pinInternalMessage(id, pinned)
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, is_pinned: pinned } : m)))
  }

  const onDelete = async (id: number) => {
    if (!confirm('حذف الرسالة؟')) return
    await apiClient.deleteInternalMessage(id)
    setMessages(prev => prev.filter(m => m.id !== id))
    loadChannels().catch(() => {})
  }

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
      <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => onPickFiles(e.target.files)} />

      <aside className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="font-black text-slate-900">التواصل الداخلي</div>
          <AsyncButton onClickAsync={async () => { await loadChannels(); await loadMessages(); }} className="px-3 py-2 rounded-xl text-xs font-black bg-slate-100 text-slate-800 hover:bg-slate-200">
            <RefreshCcw size={14} className="ml-2" /> تحديث
          </AsyncButton>
        </div>

        <div className="p-3 space-y-1 max-h-[70vh] overflow-auto">
          {sortedChannels.map((c) => (
            <button
              key={c.channel}
              onClick={() => setChannel(c.channel)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-right transition-all ${channel === c.channel ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-800'}`}
            >
              <div className="flex items-center gap-2">
                <Hash size={14} className={channel === c.channel ? 'text-white/80' : 'text-slate-400'} />
                <span className="font-black text-sm">{c.channel}</span>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${channel === c.channel ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'}`}>{c.message_count || 0}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="lg:col-span-9 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="font-black text-slate-900">قناة: #{channel}</div>
            <div className="text-xs text-slate-500 font-bold">رسائل الفريق داخل النظام</div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 font-bold flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="p-5 space-y-3 max-h-[55vh] overflow-auto bg-slate-50">
          {loading ? (
            <div className="text-slate-600 font-bold">جارِ التحميل...</div>
          ) : messages.length === 0 ? (
            <div className="text-slate-600 font-bold">لا توجد رسائل بعد</div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`p-4 rounded-3xl border ${m.is_pinned ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-black text-slate-900 text-sm">{m.full_name || m.username || `User#${m.user_id}`}</div>
                      <div className="text-[11px] text-slate-400 font-bold">{m.created_at ? new Date(m.created_at).toLocaleString('ar-SA') : ''}</div>
                      {m.is_pinned && <span className="text-[10px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-full">مثبت</span>}
                    </div>
                    <div className="text-sm text-slate-700 mt-2 leading-relaxed whitespace-pre-wrap">{m.content}</div>

                    {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {m.attachments.map((a: any, i: number) => (
                          <a
                            key={i}
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-black px-3 py-2 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200"
                          >
                            {a.name || 'attachment'}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {canPin && (
                      <AsyncButton
                        onClickAsync={async () => onPin(m.id, !m.is_pinned)}
                        className={`px-3 py-2 rounded-xl text-xs font-black ${m.is_pinned ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
                      >
                        <Pin size={14} className="ml-2" />
                        {m.is_pinned ? 'إلغاء' : 'تثبيت'}
                      </AsyncButton>
                    )}

                    <AsyncButton onClickAsync={async () => onDelete(m.id)} className="px-3 py-2 rounded-xl text-xs font-black bg-red-50 text-red-700 hover:bg-red-100">
                      <Trash2 size={14} className="ml-2" /> حذف
                    </AsyncButton>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-5 border-t border-slate-100 bg-white">
          {pendingUploads.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {pendingUploads.map((u: any, i: number) => (
                <div key={i} className="text-xs font-black bg-slate-100 text-slate-800 px-3 py-2 rounded-xl">
                  {u.name || 'attachment'}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="اكتب رسالة للفريق..."
              className="flex-1 min-h-[52px] max-h-[160px] p-4 rounded-2xl border border-slate-200 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 font-bold"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-[52px] px-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-black text-slate-800"
              title="إرفاق ملف"
            >
              <Paperclip size={18} />
            </button>

            <AsyncButton
              onClickAsync={send}
              className="h-[52px] px-6 rounded-2xl bg-slate-900 text-white hover:bg-black font-black"
            >
              <Send size={16} className="ml-2" /> إرسال
            </AsyncButton>
          </div>
        </div>
      </section>
    </div>
  )
}
