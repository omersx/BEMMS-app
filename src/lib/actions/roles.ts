'use server';

import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth/rbac';

export async function getRoles() {
  await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  try {
    const data = await db.query.roles.findMany();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPermissionsMatrix() {
  await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  try {
    const data = await db.query.rolePermissions.findMany({
      with: {
        role: true,
        permission: true,
      }
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
