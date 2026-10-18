'use server';

import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth/rbac';
import {
  notifications,
  serviceTickets,
  maintenanceTasks,
  maintenanceScheduleOccurrences,
  maintenancePlans,
} from '@/lib/db/schema';
import { eq, and, isNull, inArray, notInArray, sql } from 'drizzle-orm';

export interface NavBadgeCounts {
  notifications: number;
  triage: number;
  tickets: number;
  maintenance: number;
  workOrders: number;
  pmPlans: number;
  hasMaintenanceDue: boolean;
}

const DEFAULT_COUNTS: NavBadgeCounts = {
  notifications: 0,
  triage: 0,
  tickets: 0,
  maintenance: 0,
  workOrders: 0,
  pmPlans: 0,
  hasMaintenanceDue: false,
};

/**
 * Fetch dynamic navigation badge counts for the current user and their scope.
 */
export async function getNavBadgeCounts(): Promise<NavBadgeCounts> {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const orgId = user.organizationId;
    const roles = user.roles || [];

    const isStaffOnly =
      roles.some((r) => ['STAFF', 'DEPT_MGR'].includes(r)) &&
      !roles.some((r) =>
        ['BIOMED_ENG', 'BIOMED_TECH', 'BIOMED_MGR', 'SYS_ADMIN', 'ORG_ADMIN', 'HOSP_ADMIN'].includes(r)
      );

    const isBmeOrAdmin = roles.some((r) =>
      ['BIOMED_ENG', 'BIOMED_TECH', 'BIOMED_MGR', 'SYS_ADMIN', 'ORG_ADMIN', 'HOSP_ADMIN'].includes(r)
    );

    // 1. Unread notifications for this user
    const [unreadNotifResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.recipientUserId, userId), isNull(notifications.readAt)));

    const notificationsCount = unreadNotifResult?.count || 0;

    let triageCount = 0;
    let ticketsCount = 0;
    let workOrdersCount = 0;
    let pmDueCount = 0;

    if (isStaffOnly) {
      // Staff: open tickets reported by this user
      const [staffTicketsResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(serviceTickets)
        .where(
          and(
            eq(serviceTickets.reportedByUserId, userId),
            notInArray(serviceTickets.statusCode, ['resolved', 'closed', 'cancelled'])
          )
        );
      ticketsCount = staffTicketsResult?.count || 0;
    } else if (isBmeOrAdmin && orgId) {
      // BME / Admin: Triage queue tickets (new, acknowledged, in_triage)
      const [triageResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(serviceTickets)
        .where(
          and(
            eq(serviceTickets.organizationId, orgId),
            inArray(serviceTickets.statusCode, ['new', 'acknowledged', 'in_triage'])
          )
        );
      triageCount = triageResult?.count || 0;

      // Active helpdesk tickets in the organization
      const [orgTicketsResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(serviceTickets)
        .where(
          and(
            eq(serviceTickets.organizationId, orgId),
            notInArray(serviceTickets.statusCode, ['resolved', 'closed', 'cancelled'])
          )
        );
      ticketsCount = orgTicketsResult?.count || 0;

      // Maintenance Work orders active / pending
      const [tasksResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(maintenanceTasks)
        .where(
          and(
            eq(maintenanceTasks.organizationId, orgId),
            inArray(maintenanceTasks.statusCode, [
              'assigned',
              'in_progress',
              'waiting_dependency',
            ])
          )
        );
      workOrdersCount = tasksResult?.count || 0;

      // PM schedule occurrences overdue or due today
      const pmResult = await db.execute(sql`
        SELECT COUNT(*)::int as count
        FROM maintenance_schedule_occurrences mso
        JOIN maintenance_plans mp ON mso.maintenance_plan_id = mp.id
        WHERE mp.organization_id = ${orgId}
          AND mso.due_state IN ('due_today', 'overdue')
      `);
      pmDueCount = Number((pmResult.rows[0] as any)?.count) || 0;
    }

    return {
      notifications: notificationsCount,
      triage: triageCount,
      tickets: ticketsCount,
      maintenance: pmDueCount + workOrdersCount,
      workOrders: workOrdersCount,
      pmPlans: pmDueCount,
      hasMaintenanceDue: pmDueCount > 0 || workOrdersCount > 0,
    };
  } catch (error) {
    console.error('[getNavBadgeCounts] Failed to fetch badge counts:', error);
    return DEFAULT_COUNTS;
  }
}
