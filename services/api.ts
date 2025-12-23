import { Company, User, Correspondence, AuditLog, DocType, DocStatus, SecurityLevel, Priority } from '../types';

const STORAGE_KEYS = {
  COMPANIES: 'archivx_db_companies',
  USERS: 'archivx_db_users',
  CORRESPONDENCE: 'archivx_db_correspondence',
  AUDIT: 'archivx_db_audit'
};

const initializeDB = () => {
  if (!localStorage.getItem(STORAGE_KEYS.COMPANIES)) {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify([
      { id: 'c1', nameAr: 'شركة زوايا البناء للإستشارات الهندسية', nameEn: 'ZAWAYA ALBINA ENGINEERING', logoUrl: 'https://www.zaco.sa/logo2.png' }
    ]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([
      { id: 'u1', name: 'المدير العام', email: 'admin@zaco.sa', password: 'admin123', role: 'ADMIN', createdAt: new Date().toISOString() }
    ]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CORRESPONDENCE)) {
    localStorage.setItem(STORAGE_KEYS.CORRESPONDENCE, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT)) {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify([]));
  }
};

initializeDB();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ApiService = {
  getCompanies: async (): Promise<Company[]> => {
    await delay(200);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANIES) || '[]');
  },
  addCompany: async (company: Partial<Company>): Promise<Company> => {
    await delay(300);
    const companies = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANIES) || '[]');
    const newCompany = { 
      id: 'c' + Date.now(), 
      logoUrl: 'https://www.zaco.sa/logo2.png',
      ...company 
    } as Company;
    companies.push(newCompany);
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
    return newCompany;
  },
  updateCompany: async (id: string, updates: Partial<Company>): Promise<void> => {
    await delay(300);
    const companies = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANIES) || '[]');
    const index = companies.findIndex((c: Company) => c.id === id);
    if (index !== -1) {
      companies[index] = { ...companies[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
    }
  },
  deleteCompany: async (id: string) => {
    await delay(200);
    const companies = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANIES) || '[]');
    const filtered = companies.filter((c: Company) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(filtered));
  },
  getUsers: async (): Promise<User[]> => {
    await delay(200);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  },
  addUser: async (user: Partial<User>): Promise<User> => {
    await delay(300);
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const newUser = { id: 'u' + Date.now(), createdAt: new Date().toISOString(), ...user } as User;
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return newUser;
  },
  updateUser: async (id: string, updates: Partial<User>): Promise<void> => {
    await delay(300);
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const index = users.findIndex((u: User) => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  },
  deleteUser: async (id: string) => {
    await delay(200);
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const filtered = users.filter((u: User) => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
  },
  getCorrespondence: async (companyId: string): Promise<Correspondence[]> => {
    await delay(300);
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.CORRESPONDENCE) || '[]');
    return all.filter((d: Correspondence) => d.companyId === companyId);
  },
  saveCorrespondence: async (doc: Partial<Correspondence>): Promise<Correspondence> => {
    await delay(400);
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.CORRESPONDENCE) || '[]');
    const newDoc = { id: 'd' + Date.now(), createdAt: new Date().toISOString(), ...doc } as Correspondence;
    all.unshift(newDoc);
    localStorage.setItem(STORAGE_KEYS.CORRESPONDENCE, JSON.stringify(all));
    return newDoc;
  },
  exportFullBackup: async (): Promise<string> => {
    await delay(500);
    const backupData = {
      version: "2.5",
      timestamp: new Date().toISOString(),
      data: {
        companies: JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANIES) || '[]'),
        users: JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),
        correspondence: JSON.parse(localStorage.getItem(STORAGE_KEYS.CORRESPONDENCE) || '[]'),
        audit: JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT) || '[]'),
      }
    };
    return JSON.stringify(backupData, null, 2);
  },
  importFullBackup: async (jsonString: string): Promise<boolean> => {
    await delay(800);
    try {
      const backup = JSON.parse(jsonString);
      if (!backup.data || !backup.data.companies || !backup.data.users) {
        throw new Error("تنسيق ملف النسخ الاحتياطي غير صالح");
      }
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(backup.data.companies));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(backup.data.users));
      localStorage.setItem(STORAGE_KEYS.CORRESPONDENCE, JSON.stringify(backup.data.correspondence || []));
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(backup.data.audit || []));
      return true;
    } catch (error) {
      console.error("Restore error:", error);
      return false;
    }
  }
};
