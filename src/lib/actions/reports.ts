'use server';

import { db } from '@/lib/db';
import { requireAuth, requirePermission } from '@/lib/auth/rbac';
import { 
  devices, serviceTickets, maintenanceTasks, 
  maintenanceScheduleOccurrences, maintenanceCosts, maintenanceRecords,
  users, hospitals, departments, deviceCategories
} from '@/lib/db/schema';
import { eq, and, sql, gte, lte, desc, inArray, or } from 'drizzle-orm';
import { z } from 'zod';
import {
  inventoryReportFiltersSchema,
  ticketPerformanceFiltersSchema,
  maintenanceComplianceFiltersSchema,
  costReportFiltersSchema,
  workloadReportFiltersSchema,
  deviceHistoryFiltersSchema
} from '@/lib/validators/reports';

export async function getInventoryReport(filters: z.infer<typeof inventoryReportFiltersSchema>) {
  const user = await requireAuth();
  await requirePermission('REPORTS', 'VIEW');
  if (!user.organizationId) return [];

  const conditions: any[] = [eq(devices.organizationId, user.organizationId)];
  if (filters.hospitalId) conditions.push(eq(devices.hospitalId, filters.hospitalId));
  if (filters.departmentId) conditions.push(eq(devices.departmentId, filters.departmentId));
  if (filters.deviceCategoryId) conditions.push(eq(devices.deviceCategoryId, filters.deviceCategoryId));
  if (filters.status) conditions.push(eq(devices.currentStatusCode, filters.status as any));

  const groupByColumn = (() => {
    switch(filters.groupBy) {
      case 'hospital': return devices.hospitalId;
      case 'department': return devices.departmentId;
      case 'category': return devices.deviceCategoryId;
      case 'status': return devices.currentStatusCode;
      case 'manufacturer': return devices.manufacturerId;
      default: return devices.departmentId;
    }
  })();

  const results = await db.select({
    groupId: groupByColumn,
    totalCount: sql<number>`count(*)::int`,
    operationalCount: sql<number>`sum(case when ${devices.currentStatusCode} = 'operational' then 1 else 0 end)::int`,
    maintenanceCount: sql<number>`sum(case when ${devices.currentStatusCode} in ('under_maintenance', 'under_repair') then 1 else 0 end)::int`,
    outOfServiceCount: sql<number>`sum(case when ${devices.currentStatusCode} = 'out_of_service' then 1 else 0 end)::int`,
    decommissionedCount: sql<number>`sum(case when ${devices.currentStatusCode} = 'decommissioned' then 1 else 0 end)::int`,
  })
  .from(devices)
  .where(and(...conditions))
  .groupBy(groupByColumn);

  return results;
}

export async function getTicketPerformanceReport(filters: z.infer<typeof ticketPerformanceFiltersSchema>) {
  const user = await requireAuth();
  await requirePermission('REPORTS', 'VIEW');
  if (!user.organizationId) return null;

  const conditions: any[] = [eq(serviceTickets.organizationId, user.organizationId)];
  if (filters.hospitalId) conditions.push(eq(serviceTickets.hospitalId, filters.hospitalId));
  if (filters.departmentId) conditions.push(eq(serviceTickets.departmentId, filters.departmentId));
  if (filters.startDate) conditions.push(gte(serviceTickets.reportedAt, new Date(filters.startDate)));
  if (filters.endDate) conditions.push(lte(serviceTickets.reportedAt, new Date(filters.endDate)));

  const results = await db.select({
    total: sql<number>`count(*)::int`,
    openCount: sql<number>`sum(case when ${serviceTickets.statusCode} not in ('resolved', 'closed', 'cancelled') then 1 else 0 end)::int`,
    closedCount: sql<number>`sum(case when ${serviceTickets.statusCode} in ('resolved', 'closed') then 1 else 0 end)::int`,
    avgResponseTime: sql<number>`coalesce(avg(extract(epoch from (${serviceTickets.acceptedAt} - ${serviceTickets.reportedAt})) / 3600), 0)::float`,
    avgResolutionTime: sql<number>`coalesce(avg(extract(epoch from (${serviceTickets.resolvedAt} - ${serviceTickets.reportedAt})) / 3600), 0)::float`,
    priorityP1: sql<number>`sum(case when ${serviceTickets.priorityCode} = 'p1_critical' then 1 else 0 end)::int`,
    priorityP2: sql<number>`sum(case when ${serviceTickets.priorityCode} = 'p2_high' then 1 else 0 end)::int`,
    priorityP3: sql<number>`sum(case when ${serviceTickets.priorityCode} = 'p3_normal' then 1 else 0 end)::int`,
    priorityP4: sql<number>`sum(case when ${serviceTickets.priorityCode} = 'p4_low' then 1 else 0 end)::int`,
  })
  .from(serviceTickets)
  .where(and(...conditions));

  return results[0] || null;
}

export async function getMaintenanceComplianceReport(filters: z.infer<typeof maintenanceComplianceFiltersSchema>) {
  const user = await requireAuth();
  await requirePermission('REPORTS', 'VIEW');
  if (!user.organizationId) return { totalScheduled: 0, completed: 0, overdue: 0, complianceRate: 0 };

  const conditions: any[] = [
    eq(maintenanceTasks.organizationId, user.organizationId),
    eq(maintenanceTasks.maintenanceType, 'preventive_maintenance' as any),
  ];
  if (filters.hospitalId) conditions.push(eq(maintenanceTasks.hospitalId, filters.hospitalId));
  if (filters.departmentId) conditions.push(eq(maintenanceTasks.departmentId, filters.departmentId as any));
  if (filters.startDate) conditions.push(gte(maintenanceTasks.dueDate, new Date(filters.startDate)));
  if (filters.endDate) conditions.push(lte(maintenanceTasks.dueDate, new Date(filters.endDate)));

  const results = await db.select({
    totalScheduled: sql<number>`count(*)::int`,
    completed: sql<number>`sum(case when ${maintenanceTasks.statusCode} in ('closed', 'work_complete', 'awaiting_review', 'awaiting_release') then 1 else 0 end)::int`,
    overdue: sql<number>`sum(case when ${maintenanceTasks.statusCode} not in ('closed', 'cancelled') and ${maintenanceTasks.dueDate} < now() then 1 else 0 end)::int`,
  })
  .from(maintenanceTasks)
  .where(and(...conditions));

  const data = results[0] || { totalScheduled: 0, completed: 0, overdue: 0 };
  const complianceRate = data.totalScheduled > 0
    ? Math.round((data.completed / data.totalScheduled) * 100)
    : 0;

  return { ...data, complianceRate };
}

export async function getCostReport(filters: z.infer<typeof costReportFiltersSchema>) {
  const user = await requireAuth();
  await requirePermission('REPORTS', 'VIEW');
  if (!user.organizationId) return { totalCost: 0, byCostType: [] };

  const conditions: any[] = [eq(maintenanceTasks.organizationId, user.organizationId)];
  if (filters.hospitalId) conditions.push(eq(maintenanceTasks.hospitalId, filters.hospitalId));
  if (filters.startDate) conditions.push(gte(maintenanceCosts.recordedAt, new Date(filters.startDate)));
  if (filters.endDate) conditions.push(lte(maintenanceCosts.recordedAt, new Date(filters.endDate)));

  const results = await db.select({
    costType: maintenanceCosts.costType,
    totalAmount: sql<number>`coalesce(sum(${maintenanceCosts.amount}), 0)::int`,
    count: sql<number>`count(*)::int`,
  })
  .from(maintenanceCosts)
  .innerJoin(maintenanceTasks, eq(maintenanceCosts.maintenanceTaskId, maintenanceTasks.id))
  .where(and(...conditions))
  .groupBy(maintenanceCosts.costType);

  const totalCost = results.reduce((acc, r) => acc + (r.totalAmount || 0), 0);

  return { totalCost, byCostType: results };
}

export async function getWorkloadReport(filters: z.infer<typeof workloadReportFiltersSchema>) {
  const user = await requireAuth();
  await requirePermission('REPORTS', 'VIEW');
  if (!user.organizationId) return [];

  const conditions: any[] = [eq(maintenanceTasks.organizationId, user.organizationId)];
  if (filters.hospitalId) conditions.push(eq(maintenanceTasks.hospitalId, filters.hospitalId));

  const results = await db.select({
    engineerId: maintenanceTasks.assignedEngineerUserId,
    assignedCount: sql<number>`count(*)::int`,
    completedCount: sql<number>`sum(case when ${maintenanceTasks.statusCode} in ('closed', 'work_complete', 'awaiting_review', 'awaiting_release') then 1 else 0 end)::int`,
    inProgressCount: sql<number>`sum(case when ${maintenanceTasks.statusCode} in ('assigned', 'in_progress') then 1 else 0 end)::int`,
    priorityP1Count: sql<number>`sum(case when ${maintenanceTasks.priorityCode} = 'p1_critical' then 1 else 0 end)::int`,
    pmCount: sql<number>`sum(case when ${maintenanceTasks.maintenanceType} = 'preventive_maintenance' then 1 else 0 end)::int`,
  })
  .from(maintenanceTasks)
  .where(and(...conditions, sql`${maintenanceTasks.assignedEngineerUserId} IS NOT NULL`))
  .groupBy(maintenanceTasks.assignedEngineerUserId);

  return results;
}

export async function getDeviceHistoryReport(filters: z.infer<typeof deviceHistoryFiltersSchema>) {
  const user = await requireAuth();
  await requirePermission('REPORTS', 'VIEW');
  if (!user.organizationId) return { tickets: [], tasks: [] };

  if (!filters.deviceId) {
    throw new Error('Device ID is required for device history report');
  }

  const [tickets, tasks] = await Promise.all([
    db.query.serviceTickets.findMany({
      where: and(
        eq(serviceTickets.deviceId, filters.deviceId),
        eq(serviceTickets.organizationId, user.organizationId),
      ),
      orderBy: [desc(serviceTickets.reportedAt)],
    }),
    db.query.maintenanceTasks.findMany({
      where: and(
        eq(maintenanceTasks.deviceId, filters.deviceId),
        eq(maintenanceTasks.organizationId, user.organizationId),
      ),
      orderBy: [desc(maintenanceTasks.createdAt)],
    }),
  ]);

  return { tickets, tasks };
}
