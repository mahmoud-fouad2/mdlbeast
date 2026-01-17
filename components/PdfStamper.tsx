import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Move, RotateCcw, Save, Search, ZoomIn, ZoomOut } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'

export default function PdfStamper() {
  const { toast } = useToast()

  const [barcodeInput, setBarcodeInput] = useState('')
  const [barcode, setBarcode] = useState<string>('')
  const [attachmentIndex, setAttachmentIndex] = useState(0)
  const [attachmentsCount, setAttachmentsCount] = useState<number>(0)

  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isStamping, setIsStamping] = useState(false)

  const [signatureUrl, setSignatureUrl] = useState<string>('')
  const [stampUrl, setStampUrl] = useState<string>('')
  const [selectedType, setSelectedType] = useState<'signature' | 'stamp'>('stamp')

  const [signSize, setSignSize] = useState(140)
  const [signPosition, setSignPosition] = useState({ x: 60, y: 60 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [gridSnap, setGridSnap] = useState(false)

  const pdfOuterRef = useRef<HTMLDivElement>(null)
  const pdfInnerRef = useRef<HTMLDivElement>(null)

  const currentImageUrl = useMemo(() => {
    return selectedType === 'signature' ? signatureUrl : stampUrl
  }, [selectedType, signatureUrl, stampUrl])

  const loadUserAssets = async () => {
    const u = await apiClient.getCurrentUser().catch(() => null)
    setSignatureUrl(String(u?.signature_url || ''))
    setStampUrl(String(u?.stamp_url || ''))
  }

  const loadDocument = async (b: string, idx = 0) => {
    setIsLoadingPreview(true)
    try {
      const doc = await apiClient.getDocumentByBarcode(b)
      const atts = Array.isArray(doc?.attachments) ? doc.attachments : []
      setAttachmentsCount(atts.length)

      const p = await apiClient.getPreviewUrl(b, idx)
      if (!p) throw new Error('لا يوجد ملف PDF للمعاينة')
      setPreviewUrl(p)
    } finally {
      setIsLoadingPreview(false)
    }
  }

  useEffect(() => {
    loadUserAssets()
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!pdfOuterRef.current) return
    const rect = pdfOuterRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    const isOnSign = x >= signPosition.x && x <= signPosition.x + signSize && y >= signPosition.y && y <= signPosition.y + signSize
    if (isOnSign) {
      setIsDragging(true)
      setDragOffset({ x: x - signPosition.x, y: y - signPosition.y })
      e.preventDefault()
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !pdfOuterRef.current) return
    e.preventDefault()

    const rect = pdfOuterRef.current.getBoundingClientRect()
    let x = (e.clientX - rect.left - dragOffset.x * zoom) / zoom
    let y = (e.clientY - rect.top - dragOffset.y * zoom) / zoom

    if (gridSnap) {
      const gridSize = 20
      x = Math.round(x / gridSize) * gridSize
      y = Math.round(y / gridSize) * gridSize
    }

    const maxX = rect.width / zoom - signSize
    const maxY = rect.height / zoom - signSize
    x = Math.max(0, Math.min(x, maxX))
    y = Math.max(0, Math.min(y, maxY))

    setSignPosition({ x, y })
  }

  const handleMouseUp = () => setIsDragging(false)
  const handleMouseLeave = () => setIsDragging(false)

  const handleCenter = () => {
    if (!pdfOuterRef.current) return
    const rect = pdfOuterRef.current.getBoundingClientRect()
    const centerX = (rect.width / zoom - signSize) / 2
    const centerY = (rect.height / zoom - signSize) / 2
    setSignPosition({ x: centerX, y: centerY })
  }

  const handleApplyStamp = async () => {
    if (!barcode) {
      toast({ title: '⚠️ أدخل رقم المعاملة', description: 'اكتب الباركود ثم اضغط تحميل', variant: 'destructive' })
      return
    }
    if (!currentImageUrl) {
      toast({ title: '⚠️ لا يوجد ختم/توقيع', description: 'ارفع الختم/التوقيع من إعدادات المستخدم ثم أعد المحاولة', variant: 'destructive' })
      return
    }
    if (!pdfOuterRef.current) return

    setIsStamping(true)
    try {
      const containerWidth = pdfOuterRef.current.offsetWidth / zoom
      const containerHeight = pdfOuterRef.current.offsetHeight / zoom

      const payload = {
        idx: attachmentIndex,
        signatureType: selectedType,
        position: {
          x: signPosition.x,
          y: signPosition.y,
          width: signSize,
          height: signSize,
          containerWidth: Math.round(containerWidth),
          containerHeight: Math.round(containerHeight),
        },
      }

      const res = await apiClient.stampDocument(barcode, payload)
      const atts = Array.isArray(res?.attachments) ? res.attachments : []
      const newIndex = atts.length ? atts.length - 1 : attachmentIndex
      setAttachmentsCount(atts.length)
      setAttachmentIndex(newIndex)

      const p = await apiClient.getPreviewUrl(barcode, newIndex)
      if (p) setPreviewUrl(p)

      toast({ title: '✅ تم الختم', description: 'تم إنشاء نسخة مختومة وإضافتها كمرفق جديد' })
    } catch (e: any) {
      toast({ title: '❌ فشل الختم', description: String(e?.message || e), variant: 'destructive' })
    } finally {
      setIsStamping(false)
    }
  }

  const canUseSignature = Boolean(signatureUrl)
  const canUseStamp = Boolean(stampUrl)

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-black text-slate-900">ختم وتوقيع PDF</h2>
            <p className="text-xs text-slate-500 font-bold mt-1">حمّل ملف المعاملة ثم اسحب الختم/التوقيع إلى المكان المطلوب واضغط تنفيذ</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-2 shadow-sm">
              <Search size={16} className="text-slate-400" />
              <input
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="مثال: 1-00000001"
                className="outline-none text-sm font-bold w-52"
              />
            </div>
            <button
              onClick={async () => {
                const b = barcodeInput.trim()
                if (!b) return
                setBarcode(b)
                setAttachmentIndex(0)
                try {
                  await loadDocument(b, 0)
                } catch (e: any) {
                  toast({ title: '❌ فشل التحميل', description: String(e?.message || e), variant: 'destructive' })
                }
              }}
              className="px-4 py-2 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800"
            >
              تحميل
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Preview + overlay */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} className="p-2 bg-white rounded-lg hover:bg-slate-50" title="تصغير">
              <ZoomOut size={18} />
            </button>
            <button onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))} className="p-2 bg-white rounded-lg hover:bg-slate-50" title="تكبير">
              <ZoomIn size={18} />
            </button>
            <button onClick={() => setZoom(1)} className="p-2 bg-white rounded-lg hover:bg-slate-50" title="إعادة">
              <RotateCcw size={18} />
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1" />
            <button
              onClick={handleCenter}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-bold"
              title="توسيط"
            >
              توسيط
            </button>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={gridSnap} onChange={(e) => setGridSnap(e.target.checked)} className="w-4 h-4" />
              <span className="text-xs font-bold text-slate-600">محاذاة تلقائية</span>
            </label>
            <div className="flex-1" />
            <Move size={18} className="text-slate-400" />
            <span className="text-xs text-slate-500 font-bold">اسحب الختم/التوقيع</span>
          </div>

          <div
            ref={pdfOuterRef}
            className="bg-slate-100 rounded-2xl overflow-auto relative border-2 border-slate-200"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: isDragging ? 'grabbing' : 'default', userSelect: 'none', minHeight: '70vh' }}
          >
            <div
              ref={pdfInnerRef}
              className="relative"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                width: '100%',
              }}
            >
              {isLoadingPreview ? (
                <div className="flex items-center justify-center h-[70vh]">
                  <p className="text-slate-400 font-bold animate-pulse">جاري التحميل...</p>
                </div>
              ) : previewUrl ? (
                <iframe
                  src={`${previewUrl}#view=Fit&toolbar=0&navpanes=0`}
                  className="w-full"
                  style={{ height: '70vh', border: 'none' }}
                  title="معاينة المستند"
                />
              ) : (
                <div className="flex items-center justify-center h-[70vh]">
                  <p className="text-slate-400 font-bold">حمّل معاملة لعرض المعاينة</p>
                </div>
              )}

              {currentImageUrl && previewUrl && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${signPosition.x}px`,
                    top: `${signPosition.y}px`,
                    width: `${signSize}px`,
                    height: `${signSize}px`,
                    zIndex: 10,
                  }}
                  className="border-2 border-dashed border-blue-500 rounded-lg bg-white/80 backdrop-blur-sm p-1 shadow-lg"
                >
                  <img src={currentImageUrl} alt={selectedType === 'signature' ? 'التوقيع' : 'الختم'} className="w-full h-full object-contain" draggable={false} />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    ⋮⋮
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">نوع الختم</div>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedType('stamp')}
                disabled={!canUseStamp}
                className={`w-full p-3 rounded-xl border-2 transition-all ${selectedType === 'stamp' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'} ${!canUseStamp ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {stampUrl ? <img src={stampUrl} alt="الختم" className="h-10 w-20 object-contain" /> : <div className="h-10 w-20 bg-slate-200 rounded" />}
                  <span className="font-bold text-sm">الختم</span>
                </div>
              </button>
              <button
                onClick={() => setSelectedType('signature')}
                disabled={!canUseSignature}
                className={`w-full p-3 rounded-xl border-2 transition-all ${selectedType === 'signature' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'} ${!canUseSignature ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {signatureUrl ? <img src={signatureUrl} alt="التوقيع" className="h-10 w-20 object-contain" /> : <div className="h-10 w-20 bg-slate-200 rounded" />}
                  <span className="font-bold text-sm">التوقيع</span>
                </div>
              </button>
            </div>
            {!canUseStamp && !canUseSignature && (
              <div className="mt-3 text-xs text-slate-600 font-bold">لا يوجد ختم/توقيع. ارفعهم من إعدادات المستخدم.</div>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">الحجم</div>
            <input
              type="range"
              min={80}
              max={260}
              value={signSize}
              onChange={(e) => setSignSize(parseInt(e.target.value, 10))}
              className="w-full"
            />
            <div className="text-xs text-slate-500 font-bold mt-2">{signSize}px</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-slate-500 uppercase tracking-widest">الملف</div>
              <div className="text-xs font-bold text-slate-500">{attachmentsCount ? `${attachmentIndex + 1}/${attachmentsCount}` : '—'}</div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={async () => {
                  if (!barcode) return
                  const next = Math.max(0, attachmentIndex - 1)
                  setAttachmentIndex(next)
                  try {
                    const p = await apiClient.getPreviewUrl(barcode, next)
                    if (p) setPreviewUrl(p)
                  } catch {}
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold text-sm hover:bg-slate-50"
              >
                السابق
              </button>
              <button
                onClick={async () => {
                  if (!barcode) return
                  const max = Math.max(0, attachmentsCount - 1)
                  const next = Math.min(max, attachmentIndex + 1)
                  setAttachmentIndex(next)
                  try {
                    const p = await apiClient.getPreviewUrl(barcode, next)
                    if (p) setPreviewUrl(p)
                  } catch {}
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold text-sm hover:bg-slate-50"
              >
                التالي
              </button>
            </div>
          </div>

          <button
            onClick={handleApplyStamp}
            disabled={isStamping || !previewUrl}
            className={`w-full px-4 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 ${isStamping || !previewUrl ? 'bg-slate-300 text-slate-600' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
          >
            <Save size={18} />
            {isStamping ? 'جارٍ التنفيذ...' : 'تنفيذ الختم وإضافة نسخة'}
          </button>
        </div>
      </div>
    </div>
  )
}
