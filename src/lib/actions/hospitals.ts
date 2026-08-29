'use server';

import { db } from '@/lib/db';
import { hospitals } from '@/lib/db/schema';
import { requireAuth, requireRole, requireScope } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit';
import { createHospitalSchema, updateHospitalSchema } from '@/lib/validators/hospitals';
import { eq, and } from 'drizzle-orm';

export async function getHospitals(filters?: { organizationId?: string } | string) {
  await requireAuth();
  try {
    const orgId = typeof filters === 'string' ? filters : filters?.organizationId;
    const whereClause = orgId ? eq(hospitals.organizationId, orgId) : undefined;
    const data = await db.query.hospitals.findMany({ where: whereClause });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getHospitalById(id: string) {
  await requireAuth();
  try {
    const data = await db.query.hospitals.findFirst({
      where: eq(hospitals.id, id),
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createHospital(input: unknown) {
  const session = await requireAuth();
  const validated = createHospitalSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  await requireScope({ organizationId: validated.data.organizationId });

  try {
    return await db.transaction(async (tx) => {
      const [newHospital] = await tx.insert(hospitals).values(validated.data).returning();
      await createAuditLog(tx, {
        action: 'CREATE',
        entityType: 'hospital',
        entityId: newHospital.id,
        actorId: session.id,
        details: validated.data,
      });
      return { success: true, data: newHospital };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateHospital(id: string, input: unknown) {
  const session = await requireAuth();
  const validated = updateHospitalSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  await requireRole('SYS_ADMIN', 'ORG_ADMIN');

  try {
    const hospital = await db.query.hospitals.findFirst({ where: eq(hospitals.id, id) });
    if (!hospital) return { success: false, error: 'Hospital not found' };
    await requireScope({ organizationId: hospital.organizationId, hospitalId: id });

    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(hospitals).set(validated.data).where(eq(hospitals.id, id)).returning();
      await createAuditLog(tx, {
        action: 'UPDATE',
        entityType: 'hospital',
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

export async function archiveHospital(id: string) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  
  try {
    const hospital = await db.query.hospitals.findFirst({ where: eq(hospitals.id, id) });
    if (!hospital) return { success: false, error: 'Hospital not found' };
    await requireScope({ organizationId: hospital.organizationId, hospitalId: id });

    return await db.transaction(async (tx) => {
      const [archived] = await tx.update(hospitals).set({ status: 'archived' }).where(eq(hospitals.id, id)).returning();
      await createAuditLog(tx, {
        action: 'ARCHIVE',
        entityType: 'hospital',
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
