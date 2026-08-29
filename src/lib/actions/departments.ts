'use server';

import { db } from '@/lib/db';
import { departments } from '@/lib/db/schema';
import { requireAuth, requireRole, requireScope } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit';
import { createDepartmentSchema, updateDepartmentSchema } from '@/lib/validators/departments';
import { eq, and } from 'drizzle-orm';

export async function getDepartments(filters?: { hospitalId?: string; organizationId?: string } | string) {
  await requireAuth();
  try {
    let whereClause = undefined;
    if (typeof filters === 'string') {
      whereClause = eq(departments.hospitalId, filters);
    } else if (filters?.hospitalId) {
      whereClause = eq(departments.hospitalId, filters.hospitalId);
    } else if (filters?.organizationId) {
      whereClause = eq(departments.organizationId, filters.organizationId);
    }
    const data = await db.query.departments.findMany({ where: whereClause });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDepartmentById(id: string) {
  await requireAuth();
  try {
    const data = await db.query.departments.findFirst({
      where: eq(departments.id, id),
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createDepartment(input: unknown) {
  const session = await requireAuth();
  const validated = createDepartmentSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  await requireScope({ organizationId: validated.data.organizationId, hospitalId: validated.data.hospitalId });

  try {
    return await db.transaction(async (tx) => {
      const [newDept] = await tx.insert(departments).values(validated.data).returning();
      await createAuditLog(tx, {
        action: 'CREATE',
        entityType: 'department',
        entityId: newDept.id,
        actorId: session.id,
        details: validated.data,
      });
      return { success: true, data: newDept };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDepartment(id: string, input: unknown) {
  const session = await requireAuth();
  const validated = updateDepartmentSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  await requireRole('SYS_ADMIN', 'ORG_ADMIN');

  try {
    const dept = await db.query.departments.findFirst({ where: eq(departments.id, id) });
    if (!dept) return { success: false, error: 'Department not found' };
    await requireScope({ organizationId: dept.organizationId, hospitalId: dept.hospitalId, departmentId: id });

    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(departments).set(validated.data).where(eq(departments.id, id)).returning();
      await createAuditLog(tx, {
        action: 'UPDATE',
        entityType: 'department',
        entityId: id,
        actorId: session.id,
        details: validated.data,
      });
      return { success: true, data: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function archiveDepartment(id: string) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  
  try {
    const dept = await db.query.departments.findFirst({ where: eq(departments.id, id) });
    if (!dept) return { success: false, error: 'Department not found' };
    await requireScope({ organizationId: dept.organizationId, hospitalId: dept.hospitalId, departmentId: id });

    return await db.transaction(async (tx) => {
      const [archived] = await tx.update(departments).set({ status: 'archived' }).where(eq(departments.id, id)).returning();
      await createAuditLog(tx, {
        action: 'ARCHIVE',
        entityType: 'department',
        entityId: id,
        actorId: session.id,
        details: { status: 'archived' },
      });
      return { success: true, data: archived };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
