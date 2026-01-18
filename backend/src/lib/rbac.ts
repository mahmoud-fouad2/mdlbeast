import { hasPermission } from "./permissions"
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

export function canAccessDocument(user: any, doc: any) {
  if (!user) return false
  
  if (hasPermission(user, 'archive', 'view_all')) return true
  
  if (hasPermission(user, 'archive', 'view_own')) {
      if (doc.user_id && user.id && Number(doc.user_id) === Number(user.id)) return true
  }
  
  return false
}

