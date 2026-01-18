
import { User, DocType } from '../types'

// ============================================================================
// PERMISSIONS SYSTEM
// ============================================================================

export interface UserPermissions {
  // 1. Archive & Correspondence
  archive?: {
    view_idx?: boolean    // Sidebar visibility
    view_all?: boolean    // View all documents
    view_own?: boolean    // View own documents
    create?: boolean      // Create new document
    edit?: boolean        // Edit/Update document
    delete?: boolean      // Delete document
    stamp?: boolean       // Stamp document
    export?: boolean      // Export/Print document
  }

  // 2. Reports
  reports?: {
    view_idx?: boolean
    view_all?: boolean
    view_own?: boolean
    create?: boolean
    export?: boolean
  }

  // 3. User Management
  users?: {
    view_idx?: boolean
    view_list?: boolean
    create?: boolean
    edit?: boolean
    delete?: boolean
    manage_permissions?: boolean
    view_audit_logs?: boolean
  }

  // 4. System Settings
  system?: {
    view_idx?: boolean
    manage_settings?: boolean
    manage_backups?: boolean
  }

  // 5. Internal Communication
  communication?: {
    access_chat?: boolean
    view_announcements?: boolean
    moderate_chat?: boolean
  }

  // 6. Approvals
  approvals?: {
    view_idx?: boolean
    view_own?: boolean
    view_pending?: boolean
    action_approve?: boolean
    action_reject?: boolean
  }

  __mode?: 'inherit' | 'custom'
}

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

export function mergePermissions(roleOrBase: string | UserPermissions, custom: Partial<UserPermissions> | null | undefined): UserPermissions {
  // If first parameter is a role string, get its default permissions
  let base: UserPermissions
  if (typeof roleOrBase === 'string') {
    const normalizedRole = roleOrBase.toLowerCase()
    base = ROLE_DEFAULT_PERMISSIONS[normalizedRole] || ROLE_DEFAULT_PERMISSIONS.member
  } else {
    base = roleOrBase
  }
  
  if (!custom) return { ...base }
  
  const merged: any = {}
  
  for (const [module, perms] of Object.entries(base)) {
    if (perms && typeof perms === 'object') {
      merged[module] = {
        ...perms,
        ...(custom as any)[module]
      }
    }
  }
  
  return merged as UserPermissions
}

export function getUserPermissions(user: User): UserPermissions {
  if (!user) return DEFAULT_PERMISSIONS
  const normalizedRole = (user.role || 'member').toLowerCase()
  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[normalizedRole] || ROLE_DEFAULT_PERMISSIONS.member
  
  // If user has custom permissions saved, merge them
  if (user.permissions && user.permissions.__mode === 'inherit') {
    // If inherit mode, user.permissions contains only DIFFs
    return mergePermissions(roleDefaults, user.permissions)
  } else if (user.permissions && user.permissions.__mode === 'custom') {
    // If custom mode, user.permissions is the source of truth (but better merge to be safe against schema changes)
    return mergePermissions(roleDefaults, user.permissions)
  }
  
  return roleDefaults
}

export function hasPermission(user: User | null, module: keyof UserPermissions, action: string): boolean {
  if (!user) return false
  
  // Admin always has permission? Optional: uncomment to force super-admin bypass
  if (user.role === 'admin') return true 

  const perms = getUserPermissions(user)
  const modulePerms = perms[module] as any
  
  if (!modulePerms) return false
  return modulePerms[action] === true
}
