'use server';

import { db } from '@/lib/db';
import { auditLogs, users } from '@/lib/db/schema';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { eq, and, desc, gte, lte, or, ilike, sql, inArray, isNotNull } from 'drizzle-orm';

export interface AuditLogFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  actorId?: string;
  entityType?: string;
  actionType?: string;
  startDate?: string | Date;
  endDate?: string | Date;
}

export interface AuditLogStats {
  total: number;
  last24h: number;
  last7d: number;
  failedLogins24h: number;
}

export interface ActorItem {
  id: string;
  fullName: string;
  email: string;
}

/**
 * Fetches audit logs with filtering and pagination.
 */
export async function getAuditLogs(filters?: AuditLogFilters) {
  await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  try {
    const conditions = [];

    if (filters?.actorId) {
      conditions.push(eq(auditLogs.actorUserId, filters.actorId));
    }
    if (filters?.entityType) {
      conditions.push(eq(auditLogs.entityType, filters.entityType));
    }
    if (filters?.actionType) {
      conditions.push(eq(auditLogs.actionType, filters.actionType as any));
    }
    if (filters?.startDate) {
      const start = typeof filters.startDate === 'string' ? new Date(filters.startDate) : filters.startDate;
      if (start && !isNaN(start.getTime())) {
        conditions.push(gte(auditLogs.timestamp, start));
      }
    }
    if (filters?.endDate) {
      const end = typeof filters.endDate === 'string' ? new Date(filters.endDate) : filters.endDate;
      if (end && !isNaN(end.getTime())) {
        // Include full day if date-only string provided
        if (typeof filters.endDate === 'string' && !filters.endDate.includes('T')) {
          end.setHours(23, 59, 59, 999);
        }
        conditions.push(lte(auditLogs.timestamp, end));
      }
    }
    if (filters?.search && filters.search.trim()) {
      const searchPattern = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(auditLogs.entityId, searchPattern),
          ilike(auditLogs.entityType, searchPattern),
          ilike(auditLogs.changeReason, searchPattern),
          ilike(auditLogs.ipAddress, searchPattern)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const page = Math.max(1, Number(filters?.page) || 1);
    const pageSize = Math.max(1, Number(filters?.pageSize) || 20);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(whereClause);

    const total = countResult?.count || 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const rawData = await db.query.auditLogs.findMany({
      where: whereClause,
      with: {
        actorUser: true,
      },
      orderBy: [desc(auditLogs.timestamp)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    const data = rawData.map((log) => ({
      ...log,
      id: String(log.id),
    }));
    
    return {
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      data: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    };
  }
}

/**
 * Fetches distinct entity types present in the audit log.
 */
export async function getAuditLogEntityTypes(): Promise<{ success: boolean; data: string[]; error?: string }> {
  await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  try {
    const results = await db
      .selectDistinct({ entityType: auditLogs.entityType })
      .from(auditLogs)
      .orderBy(auditLogs.entityType);

    const entityTypes = results
      .map((r) => r.entityType)
      .filter((type): type is string => Boolean(type));

    return { success: true, data: entityTypes };
  } catch (error: any) {
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Fetches users who have logged actions in the audit log.
 */
export async function getAuditLogActors(): Promise<{ success: boolean; data: ActorItem[]; error?: string }> {
  await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  try {
    let actorsList = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
      })
      .from(users)
      .where(
        inArray(
          users.id,
          db
            .selectDistinct({ actorUserId: auditLogs.actorUserId })
            .from(auditLogs)
            .where(isNotNull(auditLogs.actorUserId))
        )
      )
      .orderBy(users.fullName);

    if (actorsList.length === 0) {
      actorsList = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
        })
        .from(users)
        .limit(100)
        .orderBy(users.fullName);
    }

    return { success: true, data: actorsList };
  } catch (error: any) {
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Computes high-level statistics for the audit log dashboard.
 */
export async function getAuditLogStats(): Promise<{
  success: boolean;
  data: AuditLogStats;
  error?: string;
}> {
  await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        last24h: sql<number>`count(*) filter (where ${auditLogs.timestamp} >= ${twentyFourHoursAgo})::int`,
        last7d: sql<number>`count(*) filter (where ${auditLogs.timestamp} >= ${sevenDaysAgo})::int`,
        failedLogins24h: sql<number>`count(*) filter (where ${auditLogs.timestamp} >= ${twentyFourHoursAgo} and ${auditLogs.actionType} = 'FAILED_LOGIN')::int`,
      })
      .from(auditLogs);

    return {
      success: true,
      data: {
        total: stats?.total || 0,
        last24h: stats?.last24h || 0,
        last7d: stats?.last7d || 0,
        failedLogins24h: stats?.failedLogins24h || 0,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      data: { total: 0, last24h: 0, last7d: 0, failedLogins24h: 0 },
      error: error.message,
    };
  }
}

/**
 * Fetches matching audit log rows for CSV export.
 */
export async function exportAuditLogs(filters?: AuditLogFilters) {
  await requireAuth();
  await requireRole('SYS_ADMIN', 'ORG_ADMIN');
  try {
    const conditions = [];

    if (filters?.actorId) {
      conditions.push(eq(auditLogs.actorUserId, filters.actorId));
    }
    if (filters?.entityType) {
      conditions.push(eq(auditLogs.entityType, filters.entityType));
    }
    if (filters?.actionType) {
      conditions.push(eq(auditLogs.actionType, filters.actionType as any));
    }
    if (filters?.startDate) {
      const start = typeof filters.startDate === 'string' ? new Date(filters.startDate) : filters.startDate;
      if (start && !isNaN(start.getTime())) {
        conditions.push(gte(auditLogs.timestamp, start));
      }
    }
    if (filters?.endDate) {
      const end = typeof filters.endDate === 'string' ? new Date(filters.endDate) : filters.endDate;
      if (end && !isNaN(end.getTime())) {
        if (typeof filters.endDate === 'string' && !filters.endDate.includes('T')) {
          end.setHours(23, 59, 59, 999);
        }
        conditions.push(lte(auditLogs.timestamp, end));
      }
    }
    if (filters?.search && filters.search.trim()) {
      const searchPattern = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(auditLogs.entityId, searchPattern),
          ilike(auditLogs.entityType, searchPattern),
          ilike(auditLogs.changeReason, searchPattern),
          ilike(auditLogs.ipAddress, searchPattern)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rawData = await db.query.auditLogs.findMany({
      where: whereClause,
      with: {
        actorUser: true,
      },
      orderBy: [desc(auditLogs.timestamp)],
      limit: 1000,
    });

    const data = rawData.map((log) => ({
      ...log,
      id: String(log.id),
    }));

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}
