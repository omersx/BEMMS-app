'use server';

import { db } from '@/lib/db';
import { manufacturers } from '@/lib/db/schema';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit';
import { createManufacturerSchema, updateManufacturerSchema } from '@/lib/validators/devices';
import { DEFAULT_MANUFACTURERS } from '@/lib/constants/manufacturers';
import { eq, desc, asc } from 'drizzle-orm';

export async function getManufacturers(organizationId?: string) {
  const session = await requireAuth();
  try {
    const orgId = organizationId || session.organizationId;
    let data = await db.query.manufacturers.findMany({
      where: orgId ? eq(manufacturers.organizationId, orgId) : undefined,
      orderBy: [asc(manufacturers.name)],
    });

    // Auto-seed default global manufacturers if empty for this organization
    if (data.length === 0 && orgId) {
      for (const mfr of DEFAULT_MANUFACTURERS) {
        await db.insert(manufacturers).values({
          organizationId: orgId,
          name: mfr.name,
          code: mfr.code,
          country: mfr.country,
          website: mfr.website,
          createdByUserId: session.id,
        });
      }
      data = await db.query.manufacturers.findMany({
        where: eq(manufacturers.organizationId, orgId),
        orderBy: [asc(manufacturers.name)],
      });
    }

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
  await requireRole('SYS_ADMIN', 'ORG_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG');

  let orgId = (input as any)?.organizationId || session.organizationId;
  if (!orgId) {
    const firstOrg = await db.query.organizations.findFirst();
    orgId = firstOrg?.id;
  }

  const payload = typeof input === 'object' && input !== null
    ? { organizationId: orgId, ...input }
    : input;

  const validated = createManufacturerSchema.safeParse(payload);
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
