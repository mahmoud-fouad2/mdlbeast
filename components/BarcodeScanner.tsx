import React, { useState, useEffect, useRef } from 'react';
import { Scan, Search, FileText, X, AlertCircle } from 'lucide-react';
import { Correspondence } from '../types';

interface BarcodeScannerProps {
  docs: Correspondence[];
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ docs }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualId, setManualId] = useState('');
  const [foundDoc, setFoundDoc] = useState<Correspondence | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startScanner = async () => {
    setIsScanning(true);
    setFoundDoc(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("تعذر الوصول للكاميرا. يرجى التأكد من منح الصلاحيات.");
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = docs.find(d => d.barcodeId.toUpperCase() === manualId.toUpperCase());
    if (doc) {
      setFoundDoc(doc);
    } else {
      alert("لم يتم العثور على معاملة بهذا الرقم.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center">
        <h2 className="text-3xl font-black text-slate-900 mb-2">ماسح الباركود الذكي</h2>
        <p className="text-slate-500">استخدم الكاميرا أو أدخل الرقم يدوياً للاستعلام عن معاملة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
          <div className="w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden relative mb-6 border-4 border-slate-800">
            {isScanning ? (
              <>
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-32 border-2 border-blue-500 border-dashed rounded-lg animate-pulse"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_red] animate-scan"></div>
                </div>
                <button 
                  onClick={stopScanner}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2"
                >
                  <X size={18} /> إيقاف
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                <Scan size={64} className="opacity-20" />
                <button 
                  onClick={startScanner}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-100"
                >
                  تشغيل الكاميرا
                </button>
              </div>
            )}
          </div>
          
          <div className="w-full border-t border-slate-100 pt-6">
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input 
                type="text" 
                placeholder="أدخل رقم الباركود يدوياً (مثال: IN-2025-...)"
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm uppercase"
                value={manualId}
                onChange={e => setManualId(e.target.value)}
              />
              <button className="bg-slate-800 text-white px-6 rounded-xl font-bold flex items-center gap-2">
                <Search size={18} /> بحث
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          {foundDoc ? (
            <div className="bg-white p-8 rounded-3xl border border-blue-200 shadow-xl shadow-blue-50 animate-in slide-in-from-left duration-500">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    foundDoc.type === 'INCOMING' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {foundDoc.type === 'INCOMING' ? 'وارد' : 'صادر'}
                  </span>
                  <h3 className="text-xl font-black mt-2 text-slate-900">{foundDoc.title}</h3>
                </div>
                <div className="font-mono text-xs font-bold bg-slate-100 p-2 rounded border border-slate-200">
                  {foundDoc.barcodeId}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 text-sm">من:</span>
                  <span className="font-bold text-slate-800">{foundDoc.sender}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 text-sm">إلى:</span>
                  <span className="font-bold text-slate-800">{foundDoc.recipient}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 text-sm">تاريخ التسجيل:</span>
                  <span className="font-bold text-slate-800">{foundDoc.date}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 text-sm block mb-1">الوصف:</span>
                  <p className="text-sm text-slate-700 leading-relaxed">{foundDoc.description || 'لا يوجد وصف مضاف.'}</p>
                </div>
              </div>

              <button className="w-full mt-6 bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                <FileText size={20} /> فتح الملف الكامل
              </button>
            </div>
          ) : (
            <div className="h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-12 text-slate-400 text-center gap-4">
              <AlertCircle size={48} className="opacity-20" />
              <div>
                <p className="font-bold text-slate-600">انتظار القراءة</p>
                <p className="text-sm">قم بمسح الباركود أو البحث اليدوي لعرض البيانات هنا</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 10%; }
          100% { top: 90%; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
