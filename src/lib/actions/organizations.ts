'use server';

import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit';
import { createOrganizationSchema, updateOrganizationSchema } from '@/lib/validators/organizations';
import { eq } from 'drizzle-orm';

export async function getOrganizations() {
  await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  try {
    const data = await db.query.organizations.findMany();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getOrganizationById(id: string) {
  await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  try {
    const data = await db.query.organizations.findFirst({
      where: eq(organizations.id, id),
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createOrganization(input: unknown) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN');
  const validated = createOrganizationSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    return await db.transaction(async (tx) => {
      const [newOrg] = await tx.insert(organizations).values(validated.data).returning();
      await createAuditLog(tx, {
        action: 'CREATE',
        entityType: 'organization',
        entityId: newOrg.id,
        actorId: session.id,
        details: validated.data,
      });
      return { success: true, data: newOrg };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateOrganization(id: string, input: unknown) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  const validated = updateOrganizationSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(organizations).set(validated.data).where(eq(organizations.id, id)).returning();
      await createAuditLog(tx, {
        action: 'UPDATE',
        entityType: 'organization',
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

export async function archiveOrganization(id: string) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN');
  try {
    return await db.transaction(async (tx) => {
      const [archived] = await tx.update(organizations).set({ status: 'archived' }).where(eq(organizations.id, id)).returning();
      await createAuditLog(tx, {
        action: 'ARCHIVE',
        entityType: 'organization',
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
