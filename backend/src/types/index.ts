import type { Request } from 'express'

export interface UserPermissions {
  archive?: {
    view_idx?: boolean
    view_all?: boolean
    view_own?: boolean
    create?: boolean
    edit?: boolean
    delete?: boolean
    stamp?: boolean
    export?: boolean
  }
  reports?: {
    view_idx?: boolean
    view_all?: boolean
    view_own?: boolean
    create?: boolean
    export?: boolean
  }
  users?: {
    view_idx?: boolean
    view_list?: boolean
    create?: boolean
    edit?: boolean
    delete?: boolean
    manage_permissions?: boolean
    view_audit_logs?: boolean
  }
  system?: {
    view_idx?: boolean
    manage_settings?: boolean
    manage_backups?: boolean
  }
  communication?: {
    access_chat?: boolean
    view_announcements?: boolean
    moderate_chat?: boolean
  }
  approvals?: {
    view_idx?: boolean
    view_own?: boolean
    view_pending?: boolean
    action_approve?: boolean
    action_reject?: boolean
  }
  [key: string]: any
}

export interface User {
  id: number
  username: string
  password?: string
  full_name?: string
  role: "admin" | "manager" | "supervisor" | "member" | "user" | string
  created_at: Date
  updated_at: Date
  permissions?: UserPermissions
}

export interface Document {
  id: number
  barcode: string
  type: string
  sender: string
  receiver: string
  date: string
  subject: string
  priority: "عادي" | "عاجل" | "عاجل جداً"
  status: "وارد" | "صادر" | "محفوظ"
  classification?: string
  notes?: string
  attachments: Attachment[]
  user_id?: number
  created_at: Date
  updated_at: Date
}

export interface Attachment {
  name: string
  size: number
  type: string
  url: string
}

export interface AuthRequest extends Request {
  user?: {
    id: number
    username?: string
    full_name?: string
    role?: string
    permissions?: UserPermissions
  }
}
