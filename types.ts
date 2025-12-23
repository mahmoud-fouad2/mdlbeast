export enum DocType {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING'
}

export enum DocStatus {
  PENDING = 'PENDING',
  ARCHIVED = 'ARCHIVED',
  COMPLETED = 'COMPLETED',
  URGENT = 'URGENT'
}

export enum SecurityLevel {
  PUBLIC = 'PUBLIC',
  CONFIDENTIAL = 'CONFIDENTIAL',
  TOP_SECRET = 'TOP_SECRET'
}

export enum Priority {
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  IMMEDIATE = 'IMMEDIATE'
}

export interface Company {
  id: string;
  nameAr: string;
  nameEn: string;
  logoUrl: string;
  registrationNumber?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  companyId?: string;
}

export interface Correspondence {
  id: string; 
  barcodeId: string;
  companyId: string;
  type: DocType;
  title: string;
  sender: string;
  recipient: string;
  referenceNumber: string; 
  internalRef: string;     
  documentDate: string;    
  archiveDate: string;     // الحقل الجديد المضاف
  date: string;            
  description: string;
  status: DocStatus;
  security: SecurityLevel;
  priority: Priority;
  category: string;
  physicalLocation: string; 
  attachmentCount: number;
  signatory: string;        
  tags: string[];           
  createdAt: string;
  createdBy?: string;
  pdfFile?: {
    name: string;
    size: string;
    url: string;
  };
}

export interface SystemSettings {
  primaryColor: string;
  footerText: string;
  showStamp: boolean;
  companies: Company[];
  orgName?: string;
  orgNameEn?: string;
  logoUrl?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
}
