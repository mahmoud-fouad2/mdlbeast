import type { User } from "../types"

export function isManager(user?: Partial<User>) {
  return !!user && (user.role === 'manager' || user.role === 'admin')
}

export function isSupervisor(user?: Partial<User>) {
  return !!user && (user.role === 'supervisor' || isManager(user))
}

export function isMember(user?: Partial<User>) {
  return !!user && user.role === 'member'
}

export function canAccessDocument(user: Partial<User> | undefined, doc: any) {
  if (!user) return false
  // admin can access everything
  if (user.role === 'admin') return true
  // manager can access documents in their tenant, or all documents if no tenant assigned
  if (user.role === 'manager') {
    if (!user.tenant_id) return true // manager without tenant can access all
    if (doc.tenant_id === user.tenant_id) return true // same tenant
    if (!doc.tenant_id) return true // document without tenant
    return false
  }
  // supervisor: same as manager
  if (user.role === 'supervisor') {
    if (!user.tenant_id) return true // supervisor without tenant can access all
    if (doc.tenant_id && user.tenant_id && doc.tenant_id === user.tenant_id) return true
    if (!doc.tenant_id) return true // document without tenant
    return false
  }
  // member/regular user: only own documents
  if (doc.user_id && user.id && Number(doc.user_id) === Number(user.id)) return true
  return false
}
