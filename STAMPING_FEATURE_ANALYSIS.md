# Stamping Feature Analysis - OLD Project Implementation

## Overview

This document details the **exact implementation** of the PDF stamping feature from the OLD project located at `D:\Mahmoud\hghvadt\old new befor edit`.

---

## 1. DocumentList.tsx - Button Placement & Integration

### State Variables Used

```tsx
const [stamperDoc, setStamperDoc] = useState<Correspondence | null>(null)
```

### Import Statement

```tsx
import PdfStamper from "./PdfStamper"
```

### Modal Integration (Inline in DocumentList)

The `PdfStamper` modal is conditionally rendered at the **top** of the component return, right after the hidden file input:

```tsx
<input id="addAttachmentInput" ref={addAttachmentInputRef} type="file" accept=".pdf" className="hidden" onChange={handleAddAttachment} />
{stamperDoc && <PdfStamper doc={stamperDoc} settings={settings} onClose={() => setStamperDoc(null)} />}
```

### Desktop Table Row Button (in "الإجراءات" column)

Location: `<td className="px-6 py-4 align-middle">` inside the table row

```tsx
<td className="px-6 py-4 align-middle">
  <div className="flex flex-col gap-3 items-end">
    {/* STAMPING BUTTON - FIRST ACTION */}
    <button
      onClick={() => setStamperDoc(doc)}
      className="px-3 h-7 rounded-lg bg-slate-900 text-white hover:bg-black flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
      title="ختم المستند"
    >
      <ScanText size={14} />
      <span className="text-[10px] font-bold">ختم المستند</span>
    </button>

    {/* Other action buttons below */}
    <div className="flex items-center gap-1 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity">
      <BarcodePrinter doc={doc} settings={settings} />
      <OfficialReceipt doc={doc} settings={settings} />
      {/* Edit and Delete buttons */}
    </div>
  </div>
</td>
```

### Mobile Card View Button

Location: Inside the card header, next to barcode display

```tsx
<div className="flex gap-2">
  <button
    onClick={() => setStamperDoc(doc)}
    className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-md active:scale-95"
    title="ختم المستند"
  >
    <ScanText size={16} />
  </button>
  <BarcodePrinter doc={doc} settings={settings} />
</div>
```

### Event Listener for Document Stamped

```tsx
useEffect(() => {
  const handler = async (e: any) => {
    try {
      const barcode = e?.detail?.barcode
      if (!barcode) return
      const updated = await apiClient.getDocumentByBarcode(barcode).catch(() => null)
      if (updated) setLocalDocs((prev:any[]) => prev.map((d:any) => (d.barcode === barcode ? updated : d)))
    } catch (err) { console.warn('document:stamped handler failed', err) }
  }
  window.addEventListener('document:stamped', handler)
  return () => window.removeEventListener('document:stamped', handler)
}, [])
```

---

## 2. PdfStamper.tsx - Full Component Implementation

### Props Interface

```tsx
interface PdfStamperProps {
  doc: Correspondence
  settings?: SystemSettings
  onClose: () => void
}
```

### Key State Variables

```tsx
const BASE_STAMP_WIDTH = 160
const [pos, setPos] = useState({ x: 400, y: 20 })              // Stamp position
const [isDragging, setIsDragging] = useState(false)            // Drag state
const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })   // Mouse offset during drag
const [isSaving, setIsSaving] = useState(false)                // Loading state
const [previewUrl, setPreviewUrl] = useState<string | null>(null)  // Preview data URL
const [hasPreview, setHasPreview] = useState(false)            // Preview mode flag

// Stamp sizes
const STAMP_SIZES = { small: 100, default: 140 }
const [stampSize, setStampSize] = useState<'small' | 'default'>('default')
const stampWidth = STAMP_SIZES[stampSize]

// Page/Attachment navigation
const [pageIndex, setPageIndex] = useState<number>(0)
const [attachmentIndex, setAttachmentIndex] = useState<number>(0)
const [pageCount, setPageCount] = useState<number>(1)
const [pageRotation, setPageRotation] = useState<0 | 90 | 180 | 270>(0)

// Refs
const containerRef = useRef<HTMLDivElement>(null)
const stampRef = useRef<HTMLDivElement>(null)
```

### Barcode URL Generation

```tsx
const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${doc.barcode}&scale=2&rotate=N&includetext=false`
```

### Page Count Loader (useEffect)

```tsx
useEffect(() => {
  let mounted = true
  const load = async () => {
    try {
      const api = (await import("@/lib/api-client")).apiClient
      const n = await api.getPdfPageCount(doc.barcode, attachmentIndex)
      if (!mounted) return
      setPageCount(n)
      setPageIndex((prev) => Math.min(Math.max(0, prev), Math.max(0, n - 1)))
    } catch (_e) {
      if (!mounted) return
      setPageCount(1)
      setPageIndex(0)
    }
  }
  load()
  return () => { mounted = false }
}, [doc.barcode, attachmentIndex])
```

### Drag & Drop Event Handlers

```tsx
const handleMouseDown = (e: React.MouseEvent) => {
  setIsDragging(true)
  if (containerRef.current) {
    const containerRect = containerRef.current.getBoundingClientRect()
    const mouseXInContainer = e.clientX - containerRect.left
    const mouseYInContainer = e.clientY - containerRect.top
    setDragOffset({
      x: mouseXInContainer - pos.x,
      y: mouseYInContainer - pos.y
    })
  }
  e.preventDefault()
}

const handleMouseMove = (e: React.MouseEvent) => {
  if (!isDragging || !containerRef.current) return
  const rect = containerRef.current.getBoundingClientRect()
  const stampRect = stampRef.current?.getBoundingClientRect()
  const stampW = stampRect?.width ?? stampWidth
  const stampH = stampRect?.height ?? Math.max(60, stampWidth * 0.45)

  const newX = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - stampW))
  const newY = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - stampH))

  setPos({ x: newX, y: newY })
}

const handleMouseUp = () => setIsDragging(false)
```

### Preview Function (handlePreview)

```tsx
const handlePreview = async () => {
  setIsSaving(true)
  loading.show()
  try {
    const container = containerRef.current
    const rect = container?.getBoundingClientRect()
    const containerWidth = rect?.width || 800
    const containerHeight = rect?.height || 1131

    const payload = {
      x: Math.round(pos.x),
      y: Math.round(pos.y),
      containerWidth: Math.round(containerWidth),
      containerHeight: Math.round(containerHeight),
      stampWidth: Math.round(stampWidth),
      page: pageIndex,
      attachmentIndex: attachmentIndex,
      pageRotation,
      compact: false,
      preview: true, // Preview mode - won't save to storage
    }

    const api = (await import("@/lib/api-client")).apiClient
    const res = await api.stampDocument(doc.barcode, payload)

    if (res && res.previewData) {
      setPreviewUrl(res.previewData)
      setHasPreview(true)
    }
  } catch (e: any) {
    console.error('Preview failed', e)
    alert('فشل إنشاء المعاينة: ' + (e?.message || e))
  } finally {
    setIsSaving(false)
    loading.hide()
  }
}
```

### Finalize/Save Function (handleFinalize)

```tsx
const handleFinalize = async () => {
  setIsSaving(true)
  loading.show()
  try {
    const container = containerRef.current
    const rect = container?.getBoundingClientRect()
    const containerWidth = rect?.width || 800
    const containerHeight = rect?.height || 1131

    const payload = {
      x: Math.round(pos.x),
      y: Math.round(pos.y),
      containerWidth: Math.round(containerWidth),
      containerHeight: Math.round(containerHeight),
      stampWidth: Math.round(stampWidth),
      page: pageIndex,
      attachmentIndex: attachmentIndex,
      pageRotation,
      compact: false,
      preview: false, // Save mode - will save to storage
    }

    const api = (await import("@/lib/api-client")).apiClient
    const res = await api.stampDocument(doc.barcode, payload)

    // Dispatch event to update list without reload
    window.dispatchEvent(new CustomEvent('document:stamped', { detail: { barcode: doc.barcode } }))

    alert('تم ختم المستند بنجاح')
    onClose()
  } catch (e: any) {
    console.error('Stamp failed', e)
    alert('فشل ختم المستند: ' + (e?.message || e))
  } finally {
    setIsSaving(false)
    loading.hide()
  }
}
```

---

## 3. UI Structure

### Modal Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER                                                          │
│ ┌──────────────┐                           ┌──────────────────┐ │
│ │ 📄 Icon      │  تطبيق ختم المستند الرقمي │ وضع المعاينة      │ │
│ └──────────────┘                           └──────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ PREVIEW AREA (bg-[#F1F5F9])                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │   PDF Document Preview (SignedPdfPreview or iframe)        │ │
│ │                                                             │ │
│ │   ┌───────────────┐ <- DRAGGABLE STAMP                     │ │
│ │   │ Company Name  │                                        │ │
│ │   │ ▓▓▓▓▓▓▓▓▓▓▓▓ │                                        │ │
│ │   │ BARCODE-123   │                                        │ │
│ │   │ DD/MM/YYYY    │                                        │ │
│ │   │ المرفقات: 2   │                                        │ │
│ │   └───────────────┘                                        │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ FOOTER                                                          │
│ ┌──────────┐  ┌──────────────┐  ┌─────────┐  ┌───────────────┐  │
│ │ X: Y:    │  │ حجم الختم   │  │ المرفق   │  │ [إلغاء]       │  │
│ │ position │  │ صغير|افتراضي│  │ صفحة    │  │ [عرض الختم]   │  │
│ │          │  │             │  │ تدوير   │  │ [حفظ الختم]   │  │
│ └──────────┘  └──────────────┘  └─────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Stamp Visual Design

```tsx
<div
  ref={stampRef}
  onMouseDown={handleMouseDown}
  style={{
    left: pos.x,
    top: pos.y,
    width: BASE_STAMP_WIDTH,
    transform: `scale(${Math.max(0.4, Math.min(2, stampWidth / BASE_STAMP_WIDTH))})`,
    transformOrigin: 'top left',
  }}
  className={`absolute bg-white border-[2px] ${
    isDragging
      ? "border-blue-600 ring-2 ring-blue-500/20 cursor-grabbing shadow-xl"
      : "border-slate-800 shadow-lg"
  } cursor-grab rounded-lg flex flex-col items-center justify-center p-2 z-50`}
>
  {/* Company Name */}
  <div className="text-[8px] font-black text-slate-900 text-center leading-[1.1] w-full border-b border-slate-300 pb-0.5 mb-0.5">
    {settings?.orgNameEn || "Zaco"}
  </div>

  {/* Barcode Image */}
  <img
    src={barcodeUrl}
    style={{ height: '20px', width: '100%', objectFit: 'contain' }}
    className="pointer-events-none select-none mix-blend-multiply my-0.5"
    alt="barcode"
  />

  {/* Barcode Number */}
  <div className="text-[7px] font-black font-mono text-slate-900 tracking-wide">
    {doc.barcode}
  </div>

  {/* Date & Time */}
  <div className="w-full flex justify-between items-center mt-0.5 pt-0.5 border-t border-slate-300 text-[5.5px] text-slate-600 font-bold">
    <span dir="ltr">{new Date().toLocaleDateString('en-GB')}</span>
    <span dir="ltr">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
  </div>

  {/* Attachment Count */}
  <div className="w-full text-center mt-0.5 pt-0.5 border-t border-slate-300 text-[5px] text-slate-700 font-bold" dir="rtl">
    المرفقات: {doc.attachmentCount || '0'}
  </div>

  {/* Drag Handle */}
  <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white">
    <MousePointer2 size={10} />
  </div>
</div>
```

---

## 4. API Calls

### stampDocument

**Endpoint:** `POST /api/documents/${barcode}/stamp`

**Payload:**
```typescript
{
  x: number,               // Stamp X position in pixels
  y: number,               // Stamp Y position in pixels
  containerWidth: number,  // Container width (typically 800)
  containerHeight: number, // Container height (typically 1131)
  stampWidth: number,      // Stamp width (100 or 140)
  page: number,            // Page index (0-based)
  attachmentIndex: number, // Attachment index (0-based)
  pageRotation: 0 | 90 | 180 | 270, // Page rotation
  compact: boolean,        // Always false
  preview: boolean         // true = return preview, false = save to storage
}
```

**Response (preview: true):**
```typescript
{
  previewData: string  // Base64 data URL of stamped PDF
}
```

**Response (preview: false):**
```typescript
{
  url?: string,
  previewUrl?: string
}
```

### getPreviewUrl

**Endpoint:** `GET /api/documents/${barcode}/preview-url?idx=${attachmentIndex}`  
**Secure Endpoint:** `GET /api/documents/${barcode}/secure-preview-url?idx=${attachmentIndex}`

**Response:**
```typescript
{
  previewUrl: string  // URL to view PDF
}
```

### getPdfPageCount

**Endpoint:** `GET /api/documents/${barcode}/page-count?idx=${attachmentIndex}`

**Response:**
```typescript
{
  pageCount: number
}
```

---

## 5. Workflow Summary

### User Flow

1. **User clicks "ختم المستند" button** in document list row
2. `setStamperDoc(doc)` is called, opening the PdfStamper modal
3. **Modal loads:**
   - Fetches page count via `getPdfPageCount`
   - Displays PDF preview via `SignedPdfPreview` component
   - Shows draggable stamp overlay at default position (x: 400, y: 20)
4. **User positions stamp:**
   - Drags stamp to desired location on PDF
   - Can change stamp size (small: 100px, default: 140px)
   - Can select different attachment and page
   - Can set page rotation (0°, 90°, 180°, 270°)
5. **User clicks "عرض الختم" (Preview):**
   - Calls `stampDocument` with `preview: true`
   - Shows the stamped PDF preview in iframe
   - Hides the draggable stamp overlay
6. **User clicks "مسح الختم" (Clear):**
   - Returns to editing mode with draggable stamp
7. **User clicks "حفظ الختم" (Save):**
   - Calls `stampDocument` with `preview: false`
   - Server saves stamped PDF to storage
   - Dispatches `document:stamped` custom event
   - Closes modal
8. **DocumentList receives event:**
   - Fetches updated document via `getDocumentByBarcode`
   - Updates local state without full page reload

---

## 6. SignedPdfPreview Component

Simple component for displaying PDF in iframe:

```tsx
export function SignedPdfPreview({ barcode, fallbackUrl, attachmentIndex = 0 }: { 
  barcode: string; 
  fallbackUrl?: string; 
  attachmentIndex?: number 
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const get = async () => {
      try {
        const p = await apiClient.getPreviewUrl(barcode, attachmentIndex)
        if (mounted) setUrl(p || (fallbackUrl ? `${fallbackUrl}?t=${Date.now()}` : null))
      } catch (e: any) {
        if (mounted) setError(String(e?.message || e))
      }
    }
    get()
    return () => { mounted = false }
  }, [barcode, fallbackUrl, attachmentIndex])

  if (error) return <ErrorDisplay error={error} />
  if (!url) return <LoadingDisplay />
  
  return (
    <iframe 
      src={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} 
      className="w-full h-full border-none" 
      title="PDF Preview" 
    />
  )
}
```

---

## 7. Key Dependencies

- **lucide-react icons:** `Save`, `X`, `MousePointer2`, `Scan`, `Layers`, `FileSearch`, `Eye`, `ScanText`
- **Loading context:** `useLoading()` from `./ui/loading-context`
- **SignedPdfPreview component:** For PDF display
- **Barcode API:** `https://bwipjs-api.metafloor.com/` for barcode generation

### Loading Context Implementation

**File:** `components/ui/loading-context.tsx`

```tsx
"use client"

import * as React from 'react'
import { Spinner } from './spinner'

type LoadingContextValue = {
  show: () => void
  hide: () => void
  isLoading: boolean
}

const LoadingContext = React.createContext<LoadingContextValue | null>(null)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = React.useState(0)
  const show = React.useCallback(() => setCount((c) => c + 1), [])
  const hide = React.useCallback(() => setCount((c) => Math.max(0, c - 1)), [])
  const value = React.useMemo(() => ({ show, hide, isLoading: count > 0 }), [show, hide, count])

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <LoadingOverlay isLoading={count > 0} />
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const ctx = React.useContext(LoadingContext)
  if (!ctx) {
    console.warn('useLoading used outside LoadingProvider - falling back to noop implementation')
    return { show: () => {}, hide: () => {}, isLoading: false }
  }
  return ctx
}

function LoadingOverlay({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
      <div className="bg-white/95 px-10 py-8 rounded-3xl shadow-2xl flex flex-col items-center gap-5 max-w-sm border border-slate-100">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Spinner className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="text-center">
          <div className="text-slate-900 font-black text-lg">جارٍ التحميل</div>
          <div className="text-slate-500 text-sm mt-1">يرجى الانتظار قليلاً...</div>
        </div>
      </div>
    </div>
  )
}
```

### Spinner Component

**File:** `components/ui/spinner.tsx`

```tsx
import { Loader2Icon } from 'lucide-react'
import { cn } from '@/lib/utils'

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  )
}

export { Spinner }
```

---

## 8. CSS Classes Used

### Modal Container
```
fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[100] 
flex items-center justify-center p-4 lg:p-10
```

### Modal Card
```
bg-white w-full max-w-7xl rounded-[3rem] overflow-hidden 
flex flex-col h-full shadow-3xl border border-white/20 
animate-in zoom-in-95 duration-500
```

### Preview Container
```
w-full aspect-[1/1.414] bg-white 
shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] 
relative cursor-crosshair border border-slate-200 overflow-hidden
```

### Stamp Button (Desktop)
```
px-3 h-7 rounded-lg bg-slate-900 text-white 
hover:bg-black flex items-center justify-center gap-2 
transition-all shadow-md hover:shadow-lg active:scale-95
```

### Stamp Button (Mobile)
```
w-8 h-8 rounded-lg bg-slate-900 text-white 
flex items-center justify-center shadow-md active:scale-95
```

---

## Summary

The stamping feature is a well-integrated modal-based PDF stamper that:

1. Opens from document list via "ختم المستند" button
2. Displays PDF with draggable stamp overlay
3. Allows stamp positioning, sizing, page/attachment selection, and rotation
4. Provides preview before saving
5. Saves stamped PDF to server storage
6. Notifies document list to refresh via custom event

To replicate this exactly in the new project, you need:
1. The `PdfStamper` component with all its logic
2. The `SignedPdfPreview` component for PDF display
3. API methods: `stampDocument`, `getPreviewUrl`, `getPdfPageCount`
4. The stamp button in DocumentList rows
5. Event listener for `document:stamped` in DocumentList
