import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, FilePlus, FileMinus, Search, Scan, FileText, 
  Users, Briefcase, LogOut, Trash2, Building2, Plus, 
  AlertCircle, DownloadCloud, UploadCloud, Database, RefreshCcw, ShieldCheck, Edit3, X, Check 
} from 'lucide-react';
import { DocType, Correspondence, DocStatus, SystemSettings, Company, User } from './types';
import { generateBusinessBarcode } from './services/barcodeService';
import { ApiService } from './services/api';
import Dashboard from './components/Dashboard';
import DocumentForm from './components/DocumentForm';
import DocumentList from './components/DocumentList';
import BarcodeScanner from './components/BarcodeScanner';
import ReportGenerator from './components/ReportGenerator';
import Login from './components/Login';
import UserManagement from './components/UserManagement';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [docs, setDocs] = useState<Correspondence[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  
  const [settings] = useState<SystemSettings>({
    primaryColor: '#0f172a',
    footerText: 'نظام الأرشفة الموحد - جميع الحقوق محفوظة © 2025',
    showStamp: true,
    companies: []
  });

  const [newCompany, setNewCompany] = useState({ nameAr: '', nameEn: '', logoUrl: 'https://www.zaco.sa/logo2.png' });
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const fetchedCompanies = await ApiService.getCompanies();
      setCompanies(fetchedCompanies);
      
      if (fetchedCompanies.length > 0) {
        const initialId = selectedCompanyId || fetchedCompanies[0].id;
        setSelectedCompanyId(initialId);
        const fetchedDocs = await ApiService.getCorrespondence(initialId);
        setDocs(fetchedDocs);
      }
      
      const fetchedUsers = await ApiService.getUsers();
      setUsers(fetchedUsers);
    } catch (e) {
      console.error("Sync error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    const savedUser = localStorage.getItem('archivx_session_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      ApiService.getCorrespondence(selectedCompanyId).then(setDocs);
    }
  }, [selectedCompanyId]);

  const currentCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];

  const handleSaveDoc = async (data: Partial<Correspondence>) => {
    const barcode = generateBusinessBarcode(data.type === DocType.INCOMING ? 'IN' : 'OUT');
    const docToSave = {
      ...data,
      barcodeId: barcode,
      companyId: selectedCompanyId,
      status: DocStatus.PENDING,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name
    };

    const savedDoc = await ApiService.saveCorrespondence(docToSave);
    setDocs(prev => [savedDoc, ...prev]);
    setActiveTab('list');
  };

  const handleExportBackup = async () => {
    const json = await ApiService.exportFullBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ArchivX_FULL_BACKUP_${new Date().toISOString().replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("⚠️ تحذير أمني: استعادة النسخة الاحتياطية ستمسح كافة البيانات الحالية (المراسلات، المؤسسات، المستخدمين) وتستبدلها ببيانات الملف. هل تود الاستمرار؟")) {
      if (backupFileInputRef.current) backupFileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await ApiService.importFullBackup(content);
      if (success) {
        alert("✅ تم استعادة النظام بالكامل بنجاح. سيتم الآن تحديث الصفحة لتطبيق التغييرات.");
        window.location.reload();
      } else {
        alert("❌ فشلت عملية الاستعادة. تأكد من أن الملف بصيغة JSON صحيحة وتابعة لنظام ArchivX.");
      }
    };
    reader.readAsText(file);
  };

  const startEditCompany = (company: Company) => {
    setEditingCompanyId(company.id);
    setNewCompany({ nameAr: company.nameAr, nameEn: company.nameEn, logoUrl: company.logoUrl });
  };

  const handleAddOrUpdateCompany = async () => {
    if (!newCompany.nameAr) return;
    if (editingCompanyId) {
      await ApiService.updateCompany(editingCompanyId, newCompany);
      setEditingCompanyId(null);
    } else {
      await ApiService.addCompany(newCompany);
    }
    setNewCompany({ nameAr: '', nameEn: '', logoUrl: 'https://www.zaco.sa/logo2.png' });
    loadInitialData();
  };

  if (!currentUser) return <Login onLogin={(u) => { setCurrentUser(u); localStorage.setItem('archivx_session_user', JSON.stringify(u)); }} logoUrl={currentCompany?.logoUrl || 'https://www.zaco.sa/logo2.png'} />;

  const NavItem = ({ id, label, icon: Icon, adminOnly = false }: any) => {
    if (adminOnly && currentUser.role !== 'ADMIN') return null;
    return (
      <button 
        onClick={() => setActiveTab(id)} 
        className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-black transition-all ${activeTab === id ? 'bg-slate-900 text-white shadow-xl scale-[1.02]' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
      >
        <Icon size={18} /><span>{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans">
      <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0 z-20 shadow-sm no-print">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
           {currentCompany && <img src={currentCompany.logoUrl} className="h-12 w-auto mb-5 object-contain" alt="Logo" />}
           <div className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6 leading-relaxed">مركز الأرشفة الرقمي الموحد</div>
           
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Building2 size={12} /> المؤسسة الحالية
              </label>
              <select 
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-black appearance-none cursor-pointer focus:border-slate-900 outline-none shadow-sm transition-all"
                value={selectedCompanyId} 
                onChange={(e) => setSelectedCompanyId(e.target.value)}
              >
                {companies.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
              </select>
           </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
          <NavItem id="dashboard" label="لوحة التحكم" icon={LayoutDashboard} />
          <div className="h-px bg-slate-100 my-4 mx-4"></div>
          <NavItem id="incoming" label="قيد وارد جديد" icon={FilePlus} />
          <NavItem id="outgoing" label="قيد صادر جديد" icon={FileMinus} />
          <NavItem id="list" label="الأرشيف والبحث" icon={Search} />
          <div className="h-px bg-slate-100 my-4 mx-4"></div>
          <NavItem id="scanner" label="تتبع الباركود" icon={Scan} />
          <NavItem id="reports" label="مركز التقارير" icon={FileText} />
          <NavItem id="users" label="إدارة المستخدمين" icon={Users} adminOnly />
          <NavItem id="companies" label="إدارة المؤسسات" icon={Briefcase} adminOnly />
          <NavItem id="backup" label="النسخ الاحتياطي" icon={Database} adminOnly />
        </nav>

        <div className="p-6 border-t border-slate-100 bg-slate-50/30">
          <button onClick={() => { localStorage.removeItem('archivx_session_user'); setCurrentUser(null); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black text-red-600 hover:bg-red-50 transition-all mb-4"><LogOut size={16} /> تسجيل الخروج</button>
          <div className="p-4 bg-slate-900 rounded-[1.5rem] flex items-center gap-3 text-white shadow-2xl">
             <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center font-black text-sm">{currentUser.name.substring(0, 1)}</div>
             <div className="overflow-hidden">
               <div className="text-[11px] font-black truncate leading-tight">{currentUser.name}</div>
               <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{currentUser.role === 'ADMIN' ? 'مدير نظام' : 'محرر'}</div>
             </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-8 lg:p-14 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && <Dashboard docs={docs} />}
          {activeTab === 'incoming' && <DocumentForm type={DocType.INCOMING} onSave={handleSaveDoc} />}
          {activeTab === 'outgoing' && <DocumentForm type={DocType.OUTGOING} onSave={handleSaveDoc} />}
          {activeTab === 'list' && <DocumentList docs={docs} settings={{...settings, orgName: currentCompany?.nameAr, logoUrl: currentCompany?.logoUrl, orgNameEn: currentCompany?.nameEn}} />}
          {activeTab === 'scanner' && <BarcodeScanner docs={docs} />}
          {activeTab === 'reports' && <ReportGenerator docs={docs} settings={{orgName: currentCompany?.nameAr || '', logoUrl: currentCompany?.logoUrl || ''}} />}
          {activeTab === 'users' && <UserManagement users={users} onUpdateUsers={async () => { loadInitialData(); }} currentUserEmail={currentUser.email} />}
          
          {activeTab === 'companies' && (
             <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-2xl">
                  <header className="mb-10 flex items-center gap-5">
                    <div className="bg-slate-900 p-4 rounded-2xl text-white shadow-xl"><Briefcase size={28} /></div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 font-heading tracking-tight">إدارة الكيانات المستقلة</h2>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">إدارة الشركات والفروع داخل النظام الموحد</p>
                    </div>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                     <div className="space-y-6">
                        <div className="flex justify-between items-center mb-2">
                           <h3 className="text-xl font-black text-slate-900">{editingCompanyId ? 'تعديل مؤسسة' : 'إضافة مؤسسة جديدة'}</h3>
                           {editingCompanyId && <button onClick={() => { setEditingCompanyId(null); setNewCompany({nameAr:'', nameEn:'', logoUrl:'https://www.zaco.sa/logo2.png'}); }} className="text-slate-400 hover:text-red-500"><X size={20}/></button>}
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">اسم المؤسسة (بالعربي)</label>
                          <input type="text" placeholder="مثال: شركة زوايا الهندسية" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black focus:border-slate-900 outline-none transition-all text-slate-900" value={newCompany.nameAr} onChange={e => setNewCompany({...newCompany, nameAr: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Entity Name (English)</label>
                          <input type="text" placeholder="Example: ZAWAYA ARCHITECTURE" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black focus:border-slate-900 outline-none transition-all text-slate-900" value={newCompany.nameEn} onChange={e => setNewCompany({...newCompany, nameEn: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">رابط الشعار</label>
                          <input type="text" placeholder="https://..." className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs focus:border-slate-900 outline-none transition-all text-slate-900" value={newCompany.logoUrl} onChange={e => setNewCompany({...newCompany, logoUrl: e.target.value})} />
                        </div>
                        <button onClick={handleAddOrUpdateCompany} className="w-full bg-slate-900 text-white py-6 rounded-[1.5rem] font-black text-lg shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
                           {editingCompanyId ? <><Check size={20} /> حفظ التعديلات</> : <><Plus size={20} /> إضافة المؤسسة للأرشيف</>}
                        </button>
                     </div>

                     <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-200 flex flex-col">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">المؤسسات المسجلة</p>
                        <div className="space-y-4 overflow-y-auto max-h-[400px]">
                           {companies.map(c => (
                             <div key={c.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                  <img src={c.logoUrl} className="w-12 h-12 object-contain" alt="logo" />
                                  <div>
                                    <div className="font-black text-sm text-slate-900">{c.nameAr}</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase">{c.nameEn}</div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => startEditCompany(c)} className="text-slate-300 opacity-0 group-hover:opacity-100 hover:text-blue-500 transition-all p-2 hover:bg-blue-50 rounded-full" title="تعديل">
                                    <Edit3 size={18} />
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      if (companies.length <= 1) return;
                                      if (confirm("هل تود حذف هذه المؤسسة نهائياً؟")) { await ApiService.deleteCompany(c.id); loadInitialData(); }
                                    }} 
                                    className="text-red-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-full" title="حذف"
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
             </div>
          )}

          {activeTab === 'backup' && (
             <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-3xl relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
                   
                   <header className="mb-14 flex items-center gap-6">
                      <div className="bg-blue-600 p-5 rounded-[1.5rem] text-white shadow-2xl shadow-blue-200">
                         <Database size={32} />
                      </div>
                      <div>
                        <h2 className="text-4xl font-black text-slate-900 font-heading tracking-tight">مركز النسخ الاحتياطي الشامل</h2>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                           <ShieldCheck size={14} className="text-green-500" /> تأمين كامل لبيانات النظام والمراسلات
                        </p>
                      </div>
                   </header>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="p-12 bg-slate-50 rounded-[3rem] border border-slate-200 flex flex-col items-center text-center group hover:bg-white hover:border-blue-500 hover:shadow-2xl transition-all duration-500">
                         <div className="bg-white p-6 rounded-[2rem] shadow-sm text-slate-400 group-hover:text-blue-600 transition-colors mb-8">
                            <DownloadCloud size={56} />
                         </div>
                         <h3 className="text-2xl font-black text-slate-900 font-heading mb-4">تصدير قاعدة البيانات</h3>
                         <p className="text-slate-500 text-sm leading-relaxed mb-10 font-medium">
                            سيتم إنشاء ملف JSON مشفر يحتوي على كافة البيانات: (المراسلات، المؤسسات، صور الشعارات، سجل النشاطات، والمستخدمين).
                         </p>
                         <button 
                           onClick={handleExportBackup}
                           className="w-full bg-slate-900 text-white py-6 rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-4 hover:bg-black transition-all shadow-xl active:scale-95"
                         >
                           <DownloadCloud size={24} /> تحميل النسخة الآن
                         </button>
                      </div>

                      <div className="p-12 bg-slate-50 rounded-[3rem] border border-slate-200 flex flex-col items-center text-center group hover:bg-white hover:border-red-500 hover:shadow-2xl transition-all duration-500 border-dashed border-2">
                         <div className="bg-white p-6 rounded-[2rem] shadow-sm text-blue-500 group-hover:text-red-500 transition-colors mb-8">
                            <UploadCloud size={56} />
                         </div>
                         <h3 className="text-2xl font-black text-slate-900 font-heading mb-4">استعادة من ملف خارجي</h3>
                         <p className="text-slate-500 text-sm leading-relaxed mb-10 font-medium">
                            قم برفع ملف النسخة الاحتياطية لاستعادة النظام لحالة سابقة. 
                            <span className="text-red-500 block mt-2 font-black">تحذير: هذا الإجراء سيمسح البيانات الحالية تماماً.</span>
                         </p>
                         <input type="file" ref={backupFileInputRef} onChange={handleImportBackup} accept=".json" className="hidden" />
                         <button 
                           onClick={() => backupFileInputRef.current?.click()}
                           className="w-full bg-blue-600 text-white py-6 rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-4 hover:bg-blue-700 transition-all shadow-xl active:scale-95"
                         >
                           <RefreshCcw size={24} /> استيراد ورفع الملف
                         </button>
                      </div>
                   </div>
                   
                   <div className="mt-14 p-8 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-start gap-6 text-amber-900">
                      <AlertCircle size={28} className="mt-1 shrink-0 text-amber-600" />
                      <div className="space-y-2">
                        <p className="text-sm font-black uppercase tracking-widest">توصية أمنية من فريق هندسة النظام</p>
                        <p className="text-xs font-black leading-relaxed opacity-80">
                           نوصي بشدة بإجراء عملية "التصدير" وحفظ الملف في مكان آمن (مثل Google Drive أو وحدة تخزين خارجية) بشكل أسبوعي. هذا الملف هو الضمان الوحيد لاستعادة بيانات المؤسسة في حال حدوث أي خلل تقني أو رغبة في نقل النظام لجهاز آخر.
                        </p>
                      </div>
                   </div>
                </div>
             </div>
          )}
        </div>
        
        <footer className="p-8 bg-white border-t border-slate-100 text-center no-print">
           <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{settings.footerText}</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
