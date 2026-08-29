'use server';

import { db } from '@/lib/db';
import { deviceCategories } from '@/lib/db/schema';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit';
import { createDeviceCategorySchema, updateDeviceCategorySchema } from '@/lib/validators/devices';
import { eq, and, desc } from 'drizzle-orm';

export async function getDeviceCategories(organizationId?: string) {
  await requireAuth();
  try {
    if (organizationId) {
      const data = await db.query.deviceCategories.findMany({
        where: eq(deviceCategories.organizationId, organizationId),
        orderBy: [desc(deviceCategories.createdAt)],
      });
      return { success: true, data };
    }
    const data = await db.query.deviceCategories.findMany({
      orderBy: [desc(deviceCategories.createdAt)],
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDeviceCategoryById(id: string) {
  await requireAuth();
  try {
    const data = await db.query.deviceCategories.findFirst({
      where: eq(deviceCategories.id, id),
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createDeviceCategory(input: unknown) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN', 'BIOMED_MGR');
  const validated = createDeviceCategorySchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    return await db.transaction(async (tx) => {
      const [newCat] = await tx.insert(deviceCategories).values({
        ...validated.data,
        createdByUserId: session.id,
      }).returning();
      await createAuditLog(tx, {
        action: 'CREATE', entityType: 'device_category', entityId: newCat.id,
        actorId: session.id, details: validated.data,
      });
      return { success: true, data: newCat };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDeviceCategory(id: string, input: unknown) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN', 'BIOMED_MGR');
  const validated = updateDeviceCategorySchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(deviceCategories)
        .set({ ...validated.data, updatedByUserId: session.id })
        .where(eq(deviceCategories.id, id))
        .returning();
      await createAuditLog(tx, {
        action: 'UPDATE', entityType: 'device_category', entityId: id,
        actorId: session.id, details: validated.data,
      });
      return { success: true, data: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function archiveDeviceCategory(id: string) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN', 'BIOMED_MGR');
  try {
    return await db.transaction(async (tx) => {
      const [archived] = await tx.update(deviceCategories)
        .set({ status: 'archived', archivedAt: new Date(), archivedByUserId: session.id })
        .where(eq(deviceCategories.id, id))
        .returning();
      await createAuditLog(tx, {
        action: 'ARCHIVE', entityType: 'device_category', entityId: id,
        actorId: session.id, details: { status: 'archived' },
      });
      return { success: true, data: archived };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
