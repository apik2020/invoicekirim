/**
 * Team permissions and role-based access control
 */

export enum TeamRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export const ROLE_HIERARCHY: Record<TeamRole, number> = {
  [TeamRole.OWNER]: 4,
  [TeamRole.ADMIN]: 3,
  [TeamRole.MEMBER]: 2,
  [TeamRole.VIEWER]: 1,
}

export interface Permission {
  resource: string
  actions: ('create' | 'read' | 'update' | 'delete' | 'manage')[]
}

// Default permissions per role
export const DEFAULT_PERMISSIONS: Record<TeamRole, Permission[]> = {
  [TeamRole.OWNER]: [
    { resource: '*', actions: ['manage'] }, // Full access
  ],
  [TeamRole.ADMIN]: [
    { resource: 'team', actions: ['read', 'update'] },
    { resource: 'members', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'invoices', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'clients', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'templates', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'items', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'payments', actions: ['read', 'create'] },
    { resource: 'settings', actions: ['read', 'update'] },
    { resource: 'apiKeys', actions: ['create', 'read', 'delete'] },
    { resource: 'webhooks', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'branding', actions: ['read', 'update'] },
    { resource: 'analytics', actions: ['read'] },
  ],
  [TeamRole.MEMBER]: [
    { resource: 'team', actions: ['read'] },
    { resource: 'members', actions: ['read'] },
    { resource: 'invoices', actions: ['create', 'read', 'update'] },
    { resource: 'clients', actions: ['create', 'read', 'update'] },
    { resource: 'templates', actions: ['create', 'read', 'update'] },
    { resource: 'items', actions: ['create', 'read', 'update'] },
    { resource: 'payments', actions: ['read'] },
    { resource: 'analytics', actions: ['read'] },
  ],
  [TeamRole.VIEWER]: [
    { resource: 'team', actions: ['read'] },
    { resource: 'members', actions: ['read'] },
    { resource: 'invoices', actions: ['read'] },
    { resource: 'clients', actions: ['read'] },
    { resource: 'templates', actions: ['read'] },
    { resource: 'items', actions: ['read'] },
    { resource: 'payments', actions: ['read'] },
    { resource: 'analytics', actions: ['read'] },
  ],
}

/**
 * Check if a role has permission to perform an action on a resource
 */
export function hasPermission(
  role: TeamRole,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'manage'
): boolean {
  const permissions = DEFAULT_PERMISSIONS[role]

  for (const permission of permissions) {
    // Check if resource matches (wildcard or exact)
    if (permission.resource === '*' || permission.resource === resource) {
      // Check if action is allowed
      if (permission.actions.includes('manage') || permission.actions.includes(action)) {
        return true
      }
    }
  }

  return false
}

/**
 * Check if role A is higher or equal to role B
 */
export function isRoleAtLeast(roleA: TeamRole, roleB: TeamRole): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB]
}

/**
 * Check if user can manage another member (based on roles)
 */
export function canManageMember(
  actorRole: TeamRole,
  targetRole: TeamRole
): boolean {
  // Can't manage owners
  if (targetRole === TeamRole.OWNER) {
    return false
  }

  // Only owners and admins can manage members
  if (actorRole !== TeamRole.OWNER && actorRole !== TeamRole.ADMIN) {
    return false
  }

  // Actor must have higher or equal role
  return isRoleAtLeast(actorRole, targetRole)
}

/**
 * Get all permissions for a role as a flat object
 */
export function getPermissionsForRole(role: TeamRole): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  const permissions = DEFAULT_PERMISSIONS[role]

  for (const permission of permissions) {
    if (permission.resource === '*') {
      result['all'] = permission.actions
    } else {
      result[permission.resource] = permission.actions
    }
  }

  return result
}
