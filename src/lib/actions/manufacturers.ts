'use server';

import { db } from '@/lib/db';
import { manufacturers } from '@/lib/db/schema';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit';
import { createManufacturerSchema, updateManufacturerSchema } from '@/lib/validators/devices';
import { eq, desc } from 'drizzle-orm';

export async function getManufacturers(organizationId?: string) {
  await requireAuth();
  try {
    if (organizationId) {
      const data = await db.query.manufacturers.findMany({
        where: eq(manufacturers.organizationId, organizationId),
        orderBy: [desc(manufacturers.createdAt)],
      });
      return { success: true, data };
    }
    const data = await db.query.manufacturers.findMany({
      orderBy: [desc(manufacturers.createdAt)],
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getManufacturerById(id: string) {
  await requireAuth();
  try {
    const data = await db.query.manufacturers.findFirst({
      where: eq(manufacturers.id, id),
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createManufacturer(input: unknown) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN', 'BIOMED_MGR');
  const validated = createManufacturerSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    return await db.transaction(async (tx) => {
      const [newMfr] = await tx.insert(manufacturers).values({
        ...validated.data,
        createdByUserId: session.id,
      }).returning();
      await createAuditLog(tx, {
        action: 'CREATE', entityType: 'manufacturer', entityId: newMfr.id,
        actorId: session.id, details: validated.data,
      });
      return { success: true, data: newMfr };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateManufacturer(id: string, input: unknown) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN', 'BIOMED_MGR');
  const validated = updateManufacturerSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(manufacturers)
        .set(validated.data)
        .where(eq(manufacturers.id, id))
        .returning();
      await createAuditLog(tx, {
        action: 'UPDATE', entityType: 'manufacturer', entityId: id,
        actorId: session.id, details: validated.data,
      });
      return { success: true, data: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function archiveManufacturer(id: string) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN', 'BIOMED_MGR');
  try {
    return await db.transaction(async (tx) => {
      const [archived] = await tx.update(manufacturers)
        .set({ status: 'archived', archivedAt: new Date() })
        .where(eq(manufacturers.id, id))
        .returning();
      await createAuditLog(tx, {
        action: 'ARCHIVE', entityType: 'manufacturer', entityId: id,
        actorId: session.id, details: { status: 'archived' },
      });
      return { success: true, data: archived };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
