import React from 'react';
import { AuditLog } from '../types';
import { History, User, Clock, ShieldAlert } from 'lucide-react';

interface AuditLogsProps {
  logs: AuditLog[];
}

const AuditLogs: React.FC<AuditLogsProps> = ({ logs }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900">سجل النشاطات (Audit Logs)</h2>
          <p className="text-slate-500 mt-1">تتبع دقيق لجميع العمليات المنفذة لضمان حوكمة البيانات.</p>
        </div>
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-xl border border-red-100 flex items-center gap-2 text-sm font-bold">
          <ShieldAlert size={18} />
          غير قابل للتعديل
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {logs.length > 0 ? logs.map((log) => (
            <div key={log.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 shrink-0">
                  <History size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-lg leading-tight mb-1">{log.action}</p>
                  <div className="flex items-center gap-3 text-slate-500 text-xs">
                    <span className="flex items-center gap-1 font-medium"><User size={14} /> {log.user}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {new Date(log.timestamp).toLocaleString('ar-SA')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">ID: {log.id.substring(0, 8)}</span>
                <button className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">عرض التفاصيل</button>
              </div>
            </div>
          )) : (
            <div className="py-24 text-center text-slate-400">
              <History size={64} className="mx-auto mb-4 opacity-10" />
              <p className="text-lg font-bold text-slate-500">لا توجد سجلات نشاط حالياً</p>
              <p className="text-sm">سيتم تسجيل كل حركة تتم في النظام هنا تلقائياً.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
