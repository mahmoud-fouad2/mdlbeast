/**
 * ============================================================================
 * خدمة الصلاحيات الموحدة - Unified Permissions Service
 * ============================================================================
 * 
 * إدارة وفحص الصلاحيات بشكل موحد
 * 
 * @version 1.0
 * ============================================================================
 */

import { query } from '../config/database'
import { createLogger } from '../lib/logger'

const logger = createLogger('Permissions')

// ============================================================================
// TYPES
// ============================================================================

export interface UserPermissions {
  // 1. إدارة المشاريع (Projects Administration)
  projects?: {
    view_idx?: boolean // Dashboard/Sidebar Access
    view_all?: boolean
    view_own?: boolean // My Projects
    create?: boolean
    edit?: boolean
    delete?: boolean
    assign_team?: boolean
    
    // Project Finance (Within Project Context)
    create_payment_request?: boolean // For Engineers
    view_payment_requests?: boolean
    approve_payment_request?: boolean // For Managers
    
    view_change_orders?: boolean
    create_change_order?: boolean
    approve_change_order?: boolean
    
    // Sidebar Tab Visibility
    view_project_reports_tab?: boolean // تقارير المشاريع في السايد بار
  }

  // 2. إدارة الأرشيف (Archive Administration)
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

  // 3. إدارة المدفوعات والمالية (Finance Administration)
  finance?: {
    view_idx?: boolean
    view_all_payments?: boolean
    view_own_payments?: boolean // رؤية مدفوعات مشاريعي فقط (للمدراء)
    manage_payments?: boolean // Accountant Only
    collect_payment?: boolean // تحصيل الدفعات المستحقة
    generate_invoices?: boolean
    view_financial_reports?: boolean
    manage_installments?: boolean
    
    // Sidebar Tab Visibility
    view_payments_tab?: boolean // المدفوعات في السايد بار
  }

  // 4. إدارة التقارير (Reports Administration)
  reports?: {
    view_idx?: boolean
    view_own_supervision?: boolean
    view_all_supervision?: boolean
    create_supervision?: boolean
    approve_supervision?: boolean
    delete_supervision?: boolean
    export_snapshots?: boolean
    
    view_internal?: boolean
    create_internal?: boolean
  }

  // 5. إدارة الموارد البشرية والمستخدمين (HR & User Management)
  // دمج الموارد البشرية مع إدارة المستخدمين
  users?: {
    view_idx?: boolean
    view_list?: boolean
    create?: boolean
    edit?: boolean
    delete?: boolean
    manage_permissions?: boolean
    view_audit_logs?: boolean
    // HR Management (دمج الموارد البشرية)
    manage_attendance?: boolean // إدارة الحضور والغياب
    view_payroll?: boolean // عرض كشوف الرواتب
    manage_leaves?: boolean // إدارة الإجازات
    view_performance?: boolean // عرض تقييمات الأداء
  }

  // 6. إدارة النظام (System & Settings)
  // دمج إدارة المستخدمين داخل إدارة النظام أيضاً
  system?: {
    view_idx?: boolean
    manage_settings?: boolean
    manage_backups?: boolean
    manage_email?: boolean
    // User management within system (for admins)
    manage_users?: boolean // إدارة المستخدمين من لوحة النظام
    manage_roles?: boolean // إدارة الأدوار
  }

  // 7. التواصل الداخلي
  communication?: {
    access_chat?: boolean
    view_announcements?: boolean
    moderate_chat?: boolean
  }

  // 8. الموافقات (General Approvals)
  approvals?: {
    view_idx?: boolean
    view_own?: boolean
    view_pending?: boolean
    action_approve?: boolean
    action_reject?: boolean
    override_any?: boolean
  }
  
  // 9. إدارة العملاء
  clients?: {
    view_idx?: boolean
    view_list?: boolean
    create?: boolean
    edit?: boolean
    delete?: boolean
  }

  /**
   * Meta (not a real module):
   * - inherit: role defaults + overrides
   * - custom: user permissions are authoritative (missing = false)
   */
  __mode?: 'inherit' | 'custom'
}

// الصلاحيات الافتراضية لكل دور
const DEFAULT_PERMISSIONS: Record<string, UserPermissions> = {
  admin: {
    projects: { view_idx: true, view_all: true, view_own: true, create: true, edit: true, delete: true, assign_team: true, create_payment_request: true, view_payment_requests: true, approve_payment_request: true, view_change_orders: true, create_change_order: true, approve_change_order: true, view_project_reports_tab: true },
    archive: { view_idx: true, view_all: true, view_own: true, create: true, edit: true, delete: true, stamp: true, export: true },
    finance: { view_idx: true, view_all_payments: true, view_own_payments: true, manage_payments: true, collect_payment: true, generate_invoices: true, view_financial_reports: true, manage_installments: true, view_payments_tab: true },
    reports: { view_idx: true, view_own_supervision: true, view_all_supervision: true, create_supervision: true, approve_supervision: true, delete_supervision: true, export_snapshots: true, view_internal: true, create_internal: true },
    users: { view_idx: true, view_list: true, create: true, edit: true, delete: true, manage_permissions: true, view_audit_logs: true, manage_attendance: true, view_payroll: true, manage_leaves: true, view_performance: true },
    system: { view_idx: true, manage_settings: true, manage_backups: true, manage_email: true, manage_users: true, manage_roles: true },
    communication: { access_chat: true, view_announcements: true, moderate_chat: true },
    approvals: { view_idx: true, view_own: true, view_pending: true, action_approve: true, action_reject: true, override_any: true },
    clients: { view_idx: true, view_list: true, create: true, edit: true, delete: true }
  },
  
  manager: {
    projects: { view_idx: true, view_all: true, view_own: true, create: true, edit: true, delete: false, assign_team: true, create_payment_request: true, view_payment_requests: true, approve_payment_request: true, view_change_orders: true, create_change_order: false, approve_change_order: true, view_project_reports_tab: true },
    archive: { view_idx: true, view_all: true, view_own: true, create: true, edit: true, delete: false, stamp: true, export: true },
    finance: { view_idx: true, view_all_payments: false, view_own_payments: true, manage_payments: false, collect_payment: false, generate_invoices: true, view_financial_reports: false, manage_installments: false, view_payments_tab: false }, 
    reports: { view_idx: true, view_own_supervision: true, view_all_supervision: true, create_supervision: true, approve_supervision: true, delete_supervision: false, export_snapshots: true, view_internal: true, create_internal: true },
    users: { view_idx: true, view_list: true, create: true, edit: true, delete: false, manage_permissions: false, view_audit_logs: true, manage_attendance: true, view_payroll: true, manage_leaves: true, view_performance: true },
    system: { view_idx: false, manage_settings: false, manage_backups: false, manage_email: false, manage_users: false, manage_roles: false },
    communication: { access_chat: true, view_announcements: true, moderate_chat: true },
    approvals: { view_idx: true, view_own: true, view_pending: true, action_approve: true, action_reject: true, override_any: false },
    clients: { view_idx: true, view_list: true, create: true, edit: true, delete: false }
  },
  
  accountant: {
    projects: { view_idx: false, view_all: true, view_own: false, create: false, edit: false, delete: false, assign_team: false, create_payment_request: false, view_payment_requests: true, approve_payment_request: false, view_change_orders: true, create_change_order: false, approve_change_order: false, view_project_reports_tab: false },
    archive: { view_idx: true, view_all: true, view_own: false, create: false, edit: false, delete: false, stamp: false, export: true },
    finance: { view_idx: true, view_all_payments: true, manage_payments: true, collect_payment: true, generate_invoices: true, view_financial_reports: true, manage_installments: true, view_payments_tab: true },
    reports: { view_idx: true, view_own_supervision: false, view_all_supervision: false, create_supervision: false, approve_supervision: false, delete_supervision: false, export_snapshots: true, view_internal: true, create_internal: true },
    users: { view_idx: false, view_list: false, create: false, edit: false, delete: false, manage_permissions: false, view_audit_logs: false, manage_attendance: false, view_payroll: false, manage_leaves: false, view_performance: false },
    system: { view_idx: false, manage_settings: false, manage_backups: false, manage_email: false, manage_users: false, manage_roles: false },
    communication: { access_chat: true, view_announcements: true, moderate_chat: false },
    approvals: { view_idx: true, view_own: true, view_pending: false, action_approve: false, action_reject: false, override_any: false },
    clients: { view_idx: true, view_list: true, create: false, edit: false, delete: false }
  },

  supervisor: { 
    projects: { view_idx: true, view_all: true, view_own: true, create: false, edit: true, delete: false, assign_team: false, create_payment_request: true, view_payment_requests: true, approve_payment_request: false, view_change_orders: true, create_change_order: true, approve_change_order: false, view_project_reports_tab: true },
    archive: { view_idx: true, view_all: true, view_own: true, create: true, edit: true, delete: false, stamp: false, export: false },
    finance: { view_idx: false, view_all_payments: false, manage_payments: false, collect_payment: false, generate_invoices: false, view_financial_reports: false, manage_installments: false, view_payments_tab: false },
    reports: { view_idx: true, view_own_supervision: true, view_all_supervision: true, create_supervision: true, approve_supervision: false, delete_supervision: false, export_snapshots: false, view_internal: true, create_internal: true },
    users: { view_idx: false, view_list: false, create: false, edit: false, delete: false, manage_permissions: false, view_audit_logs: false, manage_attendance: false, view_payroll: false, manage_leaves: false, view_performance: false },
    system: { view_idx: false, manage_settings: false, manage_backups: false, manage_email: false, manage_users: false, manage_roles: false },
    communication: { access_chat: true, view_announcements: true, moderate_chat: false },
    approvals: { view_idx: true, view_own: true, view_pending: false, action_approve: false, action_reject: false, override_any: false },
    clients: { view_idx: false, view_list: false, create: false, edit: false, delete: false }
  },

  member: {
    projects: { view_idx: true, view_all: false, view_own: true, create: false, edit: false, delete: false, assign_team: false, create_payment_request: false, view_payment_requests: false, approve_payment_request: false, view_change_orders: false, create_change_order: false, approve_change_order: false, view_project_reports_tab: false },
    archive: { view_idx: true, view_all: false, view_own: true, create: true, edit: false, delete: false, stamp: false, export: false },
    finance: { view_idx: false, view_all_payments: false, manage_payments: false, collect_payment: false, generate_invoices: false, view_financial_reports: false, manage_installments: false, view_payments_tab: false },
    reports: { view_idx: true, view_own_supervision: true, view_all_supervision: false, create_supervision: true, approve_supervision: false, delete_supervision: false, export_snapshots: false, view_internal: true, create_internal: true },
    users: { view_idx: false, view_list: false, create: false, edit: false, delete: false, manage_permissions: false, view_audit_logs: false, manage_attendance: false, view_payroll: false, manage_leaves: false, view_performance: false },
    system: { view_idx: false, manage_settings: false, manage_backups: false, manage_email: false, manage_users: false, manage_roles: false },
    communication: { access_chat: true, view_announcements: true, moderate_chat: false },
    approvals: { view_idx: true, view_own: true, view_pending: false, action_approve: false, action_reject: false, override_any: false },
    clients: { view_idx: false, view_list: false, create: false, edit: false, delete: false }
  }
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * جلب صلاحيات مستخدم (يدمج الصلاحيات الافتراضية مع المخصصة)
 */
export async function getUserPermissions(userId: number): Promise<UserPermissions> {
  try {
    const result = await query(`
      SELECT role, permissions 
      FROM users 
      WHERE id = $1 AND is_active = true
    `, [userId])
    
    if (result.rows.length === 0) {
      return DEFAULT_PERMISSIONS.member
    }
    
    const { role, permissions: rawCustomPermissions } = result.rows[0]
    const normalizedRole = (role || 'member').toLowerCase()
    
    return computeEffectivePermissions(normalizedRole, rawCustomPermissions)
  } catch (error) {
    logger.error('Failed to get user permissions', error, { userId })
    return DEFAULT_PERMISSIONS.member
  }
}

/**
 * Compute effective permissions for a user using their role + stored permissions JSON.
 * This avoids extra DB queries when the full user row is already available.
 */
export function computeEffectivePermissions(role: string, rawCustomPermissions: unknown): UserPermissions {
  const normalizedRole = (role || 'member').toLowerCase()
  const defaultPerms = DEFAULT_PERMISSIONS[normalizedRole] || DEFAULT_PERMISSIONS.member

  const customPermissions = parsePermissionsJson(rawCustomPermissions)

  // Backward-compatible behavior:
  // - If no custom permissions, use role defaults.
  // - If custom permissions exist and explicitly set __mode: 'custom', they become authoritative.
  // - Otherwise (inherit), merge onto role defaults.
  if (customPermissions && typeof customPermissions === 'object') {
    const mode = getPermissionsMode(customPermissions)
    const base = mode === 'custom' ? createAllFalsePermissions() : defaultPerms
    const merged = mergePermissions(base, stripPermissionsMeta(customPermissions))
    return normalizePermissions(merged)
  }

  return normalizePermissions(defaultPerms)
}

/**
 * فحص صلاحية محددة
 */
export async function checkPermission(
  userId: number, 
  module: keyof UserPermissions, 
  action: string
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId)
    const modulePerms = permissions[module] as Record<string, boolean> | undefined
    
    if (!modulePerms) return false
    return modulePerms[action] === true
  } catch (error) {
    logger.error('Failed to check permission', error, { userId, module, action })
    return false
  }
}

/**
 * فحص صلاحيات متعددة (يجب أن تتوفر جميعها)
 */
export async function checkAllPermissions(
  userId: number,
  checks: Array<{ module: keyof UserPermissions; action: string }>
): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  
  for (const check of checks) {
    const modulePerms = permissions[check.module] as Record<string, boolean> | undefined
    if (!modulePerms || modulePerms[check.action] !== true) {
      return false
    }
  }
  
  return true
}

/**
 * فحص صلاحيات متعددة (يكفي توفر واحدة)
 */
export async function checkAnyPermission(
  userId: number,
  checks: Array<{ module: keyof UserPermissions; action: string }>
): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  
  for (const check of checks) {
    const modulePerms = permissions[check.module] as Record<string, boolean> | undefined
    if (modulePerms && modulePerms[check.action] === true) {
      return true
    }
  }
  
  return false
}

/**
 * تحديث صلاحيات مستخدم
 */
export async function updateUserPermissions(
  userId: number, 
  permissions: Partial<UserPermissions>,
  updatedBy: number
): Promise<boolean> {
  try {
    // If the UI sends a sparse object, unmentioned keys would fall back to role defaults.
    // To make "custom permissions override role" reliable, ensure __mode defaults to 'custom'
    // unless explicitly set.
    const payload: Partial<UserPermissions> = {
      __mode: (permissions as any)?.__mode || 'custom',
      ...(permissions as any)
    }

    await query(`
      UPDATE users 
      SET 
        permissions = $2,
        updated_at = NOW()
      WHERE id = $1
    `, [userId, JSON.stringify(payload)])
    
    logger.info('User permissions updated', { userId, updatedBy })
    return true
  } catch (error) {
    logger.error('Failed to update user permissions', error, { userId })
    return false
  }
}

/**
 * جلب الصلاحيات الافتراضية لدور معين
 */
export function getDefaultPermissions(role: string): UserPermissions {
  const normalizedRole = role.toLowerCase()
  return normalizePermissions(DEFAULT_PERMISSIONS[normalizedRole] || DEFAULT_PERMISSIONS.member)
}

/**
 * دمج صلاحيتين (الثانية تُعدّل الأولى)
 */
function mergePermissions(base: UserPermissions, custom: Partial<UserPermissions>): UserPermissions {
  const merged = { ...base }
  
  for (const [module, perms] of Object.entries(custom)) {
    if (perms && typeof perms === 'object') {
      (merged as any)[module] = {
        ...(merged as any)[module],
        ...perms
      }
    }
  }
  
  return merged
}

// ============================================================================
// NORMALIZATION / MODE HELPERS
// ============================================================================

type PermissionShape = Record<Exclude<keyof UserPermissions, '__mode'>, string[]>

let _shapeCache: PermissionShape | null = null

function getPermissionShape(): PermissionShape {
  if (_shapeCache) return _shapeCache

  const admin = DEFAULT_PERMISSIONS.admin
  const shape: any = {}

  for (const [moduleName, modulePerms] of Object.entries(admin)) {
    if (!modulePerms || typeof modulePerms !== 'object') continue
    shape[moduleName] = Object.keys(modulePerms)
  }

  _shapeCache = shape
  return shape
}

function createAllFalsePermissions(): UserPermissions {
  const shape = getPermissionShape()
  const result: any = {}

  for (const [moduleName, keys] of Object.entries(shape)) {
    result[moduleName] = {}
    for (const k of keys) result[moduleName][k] = false
  }

  return result
}

function normalizePermissions(p: UserPermissions): UserPermissions {
  const shape = getPermissionShape()
  const out: any = {}

  for (const [moduleName, keys] of Object.entries(shape)) {
    const modulePerms = (p as any)[moduleName] || {}
    out[moduleName] = {}
    for (const k of keys) out[moduleName][k] = modulePerms?.[k] === true
  }

  // Preserve meta if present
  if ((p as any).__mode) out.__mode = (p as any).__mode
  return out
}

function parsePermissionsJson(raw: any): any {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }
  return null
}

function getPermissionsMode(perms: any): 'inherit' | 'custom' {
  const v = String(perms?.__mode || perms?.mode || perms?._mode || 'inherit').toLowerCase()
  return v === 'custom' ? 'custom' : 'inherit'
}

function stripPermissionsMeta(perms: any): any {
  if (!perms || typeof perms !== 'object') return perms
  const { __mode, mode, _mode, ...rest } = perms
  return rest
}

// ============================================================================
// EXPRESS MIDDLEWARE HELPERS
// ============================================================================

export function requireAnyPermission(checks: Array<{ module: keyof UserPermissions; action: string }>) {
  return async (req: any, res: any, next: any) => {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'غير مصرح' })

    // Cache permissions per-request to avoid repeated DB hits
    if (!req._effectivePermissions) {
      req._effectivePermissions = await getUserPermissions(userId)
    }
    const permissions = req._effectivePermissions as UserPermissions

    for (const check of checks) {
      const modulePerms = permissions[check.module] as Record<string, boolean> | undefined
      if (modulePerms && modulePerms[check.action] === true) return next()
    }

    return res.status(403).json({ error: 'لا تملك الصلاحية للقيام بهذا الإجراء' })
  }
}

export function requireAllPermissions(checks: Array<{ module: keyof UserPermissions; action: string }>) {
  return async (req: any, res: any, next: any) => {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'غير مصرح' })

    if (!req._effectivePermissions) {
      req._effectivePermissions = await getUserPermissions(userId)
    }
    const permissions = req._effectivePermissions as UserPermissions

    for (const check of checks) {
      const modulePerms = permissions[check.module] as Record<string, boolean> | undefined
      if (!modulePerms || modulePerms[check.action] !== true) {
        return res.status(403).json({ error: 'لا تملك الصلاحية للقيام بهذا الإجراء' })
      }
    }

    return next()
  }
}

/**
 * Middleware للتحقق من الصلاحيات في Express
 */
export function requirePermission(module: keyof UserPermissions, action: string) {
  return async (req: any, res: any, next: any) => {
    const userId = req.user?.id
    
    if (!userId) {
      return res.status(401).json({ error: 'غير مصرح' })
    }
    
    if (!req._effectivePermissions) {
      req._effectivePermissions = await getUserPermissions(userId)
    }
    const permissions = req._effectivePermissions as UserPermissions
    const modulePerms = permissions[module] as Record<string, boolean> | undefined
    const hasPermission = Boolean(modulePerms && modulePerms[action] === true)
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'لا تملك الصلاحية للقيام بهذا الإجراء' })
    }
    
    next()
  }
}

export default {
  getUserPermissions,
  computeEffectivePermissions,
  checkPermission,
  checkAllPermissions,
  checkAnyPermission,
  updateUserPermissions,
  getDefaultPermissions,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  DEFAULT_PERMISSIONS
}
