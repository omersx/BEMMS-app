'use server';

import { db } from '@/lib/db';
import { locations } from '@/lib/db/schema';
import { requireAuth, requireRole, requireScope } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit';
import { createLocationSchema, updateLocationSchema } from '@/lib/validators/locations';
import { eq } from 'drizzle-orm';

export async function getLocations(filters?: { hospitalId?: string; departmentId?: string }) {
  await requireAuth();
  try {
    let whereClause = undefined;
    if (filters?.departmentId) {
      whereClause = eq(locations.departmentId, filters.departmentId);
    } else if (filters?.hospitalId) {
      whereClause = eq(locations.hospitalId, filters.hospitalId);
    }
    const data = await db.query.locations.findMany({ where: whereClause });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getLocationTree(hospitalId: string) {
  await requireAuth();
  try {
    const data = await db.query.locations.findMany({
      where: eq(locations.hospitalId, hospitalId),
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createLocation(input: unknown) {
  const session = await requireAuth();
  const validated = createLocationSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  await requireScope({ organizationId: validated.data.organizationId, hospitalId: validated.data.hospitalId, departmentId: validated.data.departmentId });

  try {
    return await db.transaction(async (tx) => {
      const [newLoc] = await tx.insert(locations).values(validated.data).returning();
      await createAuditLog(tx, {
        action: 'CREATE',
        entityType: 'location',
        entityId: newLoc.id,
        actorId: session.id,
        details: validated.data,
      });
      return { success: true, data: newLoc };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateLocation(id: string, input: unknown) {
  const session = await requireAuth();
  const validated = updateLocationSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  await requireRole('SYS_ADMIN', 'ORG_ADMIN');

  try {
    const loc = await db.query.locations.findFirst({ where: eq(locations.id, id) });
    if (!loc) return { success: false, error: 'Location not found' };
    await requireScope({ organizationId: loc.organizationId, hospitalId: loc.hospitalId, departmentId: loc.departmentId, locationId: id });

    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(locations).set(validated.data).where(eq(locations.id, id)).returning();
      await createAuditLog(tx, {
        action: 'UPDATE',
        entityType: 'location',
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

export async function archiveLocation(id: string) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  
  try {
    const loc = await db.query.locations.findFirst({ where: eq(locations.id, id) });
    if (!loc) return { success: false, error: 'Location not found' };
    await requireScope({ organizationId: loc.organizationId, hospitalId: loc.hospitalId, departmentId: loc.departmentId, locationId: id });

    return await db.transaction(async (tx) => {
      const [archived] = await tx.update(locations).set({ status: 'archived' }).where(eq(locations.id, id)).returning();
      await createAuditLog(tx, {
        action: 'ARCHIVE',
        entityType: 'location',
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
