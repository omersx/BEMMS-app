import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { rolePermissions, permissions, userAccessScopes, userRoleAssignments, roles as rolesTable } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { RoleCode, SessionUser } from '@/lib/auth/types';

export class AuthorizationError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return session?.user as SessionUser | null;
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthorizationError('Authentication required');
  }
  return user;
}

export function hasRole(userRoles: string[], ...roles: RoleCode[]): boolean {
  return roles.some(role => userRoles.includes(role));
}

export async function requireRole(...roles: RoleCode[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!hasRole(user.roles, ...roles)) {
    throw new AuthorizationError('Insufficient role permissions');
  }
  return user;
}

export async function requireScope(params: { organizationId?: string, hospitalId?: string, departmentId?: string }): Promise<SessionUser> {
  const user = await requireAuth();
  
  if (user.roles.includes('SYS_ADMIN')) {
    return user;
  }
  
  const scopes = await db.query.userAccessScopes.findMany({
    where: eq(userAccessScopes.userId, user.id)
  });
  
  const hasScope = scopes.some(scope => {
    let match = true;
    if (params.organizationId && scope.organizationId && scope.organizationId !== params.organizationId) match = false;
    if (params.hospitalId && scope.hospitalId && scope.hospitalId !== params.hospitalId) match = false;
    if (params.departmentId && scope.departmentId && scope.departmentId !== params.departmentId) match = false;
    return match;
  });

  if (!hasScope) {
    throw new AuthorizationError('Insufficient access scope');
  }
  
  return user;
}

export async function requirePermission(module: string, action: string): Promise<SessionUser> {
  const user = await requireAuth();
  
  if (user.roles.includes('SYS_ADMIN')) {
    return user;
  }

  const userRoles = await db
    .select({ roleId: userRoleAssignments.roleId })
    .from(userRoleAssignments)
    .where(eq(userRoleAssignments.userId, user.id));
    
  if (!userRoles.length) {
    throw new AuthorizationError('No roles assigned');
  }

  const roleIds = userRoles.map(r => r.roleId);

  const permCheck = await db
    .select()
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
        or(...roleIds.map(id => eq(rolePermissions.roleId, id))),
        eq(permissions.module, module as any),
        eq(permissions.action, action as any)
      )
    )
    .limit(1);

  if (permCheck.length === 0) {
    throw new AuthorizationError(`Missing permission: ${module}:${action}`);
  }

  return user;
}
