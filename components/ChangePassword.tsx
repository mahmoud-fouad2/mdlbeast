import React, { useState } from 'react';
import { Lock, Check, KeyRound, ShieldCheck, AlertCircle } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import { useToast } from '@/hooks/use-toast';

const ChangePassword: React.FC = () => {
  const { toast } = useToast()
  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success'|'error'|null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPass !== confirm) {
      setMessage('كلمتا المرور غير متطابقتين')
      setMessageType('error')
      toast({ title: "خطأ", description: "كلمتا المرور غير متطابقتين", variant: "destructive" })
      return
    }
    if (!newPass || newPass.length < 6) {
      setMessage('كلمة المرور يجب أن تكون على الأقل 6 أحرف')
      setMessageType('error')
      toast({ title: "خطأ", description: "كلمة المرور قصيرة جداً", variant: "destructive" })
      return
    }
    try {
      setLoading(true)
      await apiClient.changePassword(current, newPass)
      setMessage('تم تحديث كلمة المرور بنجاح')
      setMessageType('success')
      toast({ 
        title: "تم بنجاح", 
        description: "تم تحديث كلمة المرور الخاصة بك", 
        className: "bg-green-50 border-green-200 text-green-800" 
      })
      setCurrent('')
      setNewPass('')
      setConfirm('')
    } catch (err: any) {
      console.error(err)
      setMessage(err.message || 'فشل تغيير كلمة المرور')
      setMessageType('error')
      toast({ title: "فشل التحديث", description: err.message || "حدث خطأ أثناء تغيير كلمة المرور", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Clear messages when user starts typing again
  const onInput = () => { if (messageType === 'success') setMessage(null); if (messageType === 'error') setMessage(null); setMessageType(null) }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <KeyRound size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">تغيير كلمة المرور</h2>
            <p className="text-sm text-slate-500">قم بتحديث كلمة المرور الخاصة بك بشكل دوري للحفاظ على أمان حسابك.</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-6">
          {message && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {messageType === 'success' ? <CheckCircleIcon className="shrink-0 mt-0.5" /> : <AlertCircle className="shrink-0 mt-0.5" size={20} />}
              <div className="font-bold text-sm">{message}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">كلمة المرور الحالية</label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="password" 
                  value={current} 
                  onChange={e => { setCurrent(e.target.value); onInput() }} 
                  className="w-full p-4 pr-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-sans" 
                  placeholder="أدخل كلمة المرور الحالية..."
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">كلمة المرور الجديدة</label>
                <div className="relative group">
                  <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="password" 
                    value={newPass} 
                    onChange={e => { setNewPass(e.target.value); onInput() }} 
                    className="w-full p-4 pr-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-sans" 
                    placeholder="أدخل كلمة المرور الجديدة..."
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">تأكيد كلمة المرور</label>
                <div className="relative group">
                  <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="password" 
                    value={confirm} 
                    onChange={e => { setConfirm(e.target.value); onInput() }} 
                    className="w-full p-4 pr-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-sans" 
                    placeholder="أعد كتابة كلمة المرور..."
                    required 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button 
              type="submit" 
              className={`w-full bg-slate-900 text-white py-4 rounded-xl font-black text-lg shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`} 
              disabled={loading}
            >
              {loading ? (
                <>جارٍ المعالجة...</>
              ) : (
                <>
                  <Check size={20} /> 
                  تحديث كلمة المرور
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CheckCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

export default ChangePassword;
