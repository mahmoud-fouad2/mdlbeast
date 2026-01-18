import { User, UserPermissions } from '../types'

export const DEFAULT_PERMISSIONS: UserPermissions = {
  archive: { view_idx: true, view_all: false, view_own: true, create: true, edit: false, delete: false, stamp: false, export: false },
  reports: { view_idx: true, view_all: false, view_own: true, create: false, export: false },
  users: { view_idx: false, view_list: false, create: false, edit: false, delete: false, manage_permissions: false, view_audit_logs: false },
  system: { view_idx: false, manage_settings: false, manage_backups: false },
  communication: { access_chat: true, view_announcements: true, moderate_chat: false },
  approvals: { view_idx: true, view_own: true, view_pending: false, action_approve: false, action_reject: false }
}

export const ROLE_DEFAULT_PERMISSIONS: Record<string, UserPermissions> = {
  admin: {
    archive: { view_idx: true, view_all: true, view_own: true, create: true, edit: true, delete: true, stamp: true, export: true },
    reports: { view_idx: true, view_all: true, view_own: true, create: true, export: true },
    users: { view_idx: true, view_list: true, create: true, edit: true, delete: true, manage_permissions: true, view_audit_logs: true },
    system: { view_idx: true, manage_settings: true, manage_backups: true },
    communication: { access_chat: true, view_announcements: true, moderate_chat: true },
    approvals: { view_idx: true, view_own: true, view_pending: true, action_approve: true, action_reject: true }
  },
  manager: {
    archive: { view_idx: true, view_all: true, view_own: true, create: true, edit: true, delete: false, stamp: true, export: true },
    reports: { view_idx: true, view_all: true, view_own: true, create: true, export: true },
    users: { view_idx: true, view_list: true, create: true, edit: true, delete: false, manage_permissions: false, view_audit_logs: true },
    system: { view_idx: false, manage_settings: false, manage_backups: false },
    communication: { access_chat: true, view_announcements: true, moderate_chat: true },
    approvals: { view_idx: true, view_own: true, view_pending: true, action_approve: true, action_reject: true }
  },
  supervisor: { 
    archive: { view_idx: true, view_all: true, view_own: true, create: true, edit: true, delete: false, stamp: false, export: true },
    reports: { view_idx: true, view_all: true, view_own: true, create: true, export: false },
    users: { view_idx: false, view_list: false, create: false, edit: false, delete: false, manage_permissions: false, view_audit_logs: false },
    system: { view_idx: false, manage_settings: false, manage_backups: false },
    communication: { access_chat: true, view_announcements: true, moderate_chat: false },
    approvals: { view_idx: true, view_own: true, view_pending: false, action_approve: false, action_reject: false }
  },
  member: {
    archive: { view_idx: true, view_all: false, view_own: true, create: true, edit: false, delete: false, stamp: false, export: false },
    reports: { view_idx: true, view_all: false, view_own: true, create: false, export: false },
    users: { view_idx: false, view_list: false, create: false, edit: false, delete: false, manage_permissions: false, view_audit_logs: false },
    system: { view_idx: false, manage_settings: false, manage_backups: false },
    communication: { access_chat: true, view_announcements: true, moderate_chat: false },
    approvals: { view_idx: true, view_own: true, view_pending: false, action_approve: false, action_reject: false }
  }
}

export function mergePermissions(base: UserPermissions, custom: Partial<UserPermissions> | null | undefined): UserPermissions {
  if (!custom) return { ...base }
  
  const merged: any = {}
  
  // Create a clean deep copy of base
  for (const module in base) {
    if (base[module]) {
        merged[module] = { ...base[module] }
    }
  }
  
  // Merge custom overrides
  for (const module in custom) {
    if (module === '__mode') continue
    if (!merged[module]) merged[module] = {}
    
    // @ts-ignore
    const modulePerms = custom[module]
    for (const action in modulePerms) {
      merged[module][action] = modulePerms[action]
    }
  }
  
  return merged as UserPermissions
}

export function hasPermission(user: { role?: string, permissions?: UserPermissions } | null | undefined, module: keyof UserPermissions, action: string): boolean {
  if (!user || !user.role) return false
  
  // Admin optimization (optional, but good for safety)
  if (user.role === 'admin') return true 

  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[user.role] || ROLE_DEFAULT_PERMISSIONS['member']
  const userCustoms = user.permissions || {}
  
  const effective = mergePermissions(roleDefaults, userCustoms)
  
  // @ts-ignore
  return !!effective[module]?.[action]
}
