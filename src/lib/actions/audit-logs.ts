'use server';

import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

export async function getAuditLogs(filters?: {
  page?: number;
  pageSize?: number;
  actorId?: string;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  try {
    const conditions = [];
    if (filters?.actorId) conditions.push(eq(auditLogs.actorUserId, filters.actorId));
    if (filters?.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType));
    if (filters?.startDate) conditions.push(gte(auditLogs.timestamp, filters.startDate));
    if (filters?.endDate) conditions.push(lte(auditLogs.timestamp, filters.endDate));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;

    const data = await db.query.auditLogs.findMany({
      where: whereClause,
      with: {
        actorUser: true,
      },
      orderBy: [desc(auditLogs.timestamp)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
