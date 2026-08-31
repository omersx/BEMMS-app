'use server';

import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth/rbac';
import { 
  devices, serviceTickets, maintenanceTasks, 
  maintenanceScheduleOccurrences, userAccessScopes, users,
  departments,
  userRoleAssignments
} from '@/lib/db/schema';
import { eq, and, sql, isNull, inArray, or, desc, lt, gte, ne, not } from 'drizzle-orm';

export async function getDashboardStats() {
  const user = await requireAuth();
  const orgId = user.organizationId;
  if (!orgId) return null;

  const stats = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM devices WHERE organization_id = ${orgId}) as "totalDevices",
      (SELECT COUNT(*) FROM devices WHERE organization_id = ${orgId} AND current_status_code = 'operational') as "activeDevices",
      (SELECT COUNT(*) FROM devices WHERE organization_id = ${orgId} AND current_status_code = 'out_of_service') as "outOfService",
      (SELECT COUNT(*) FROM service_tickets WHERE organization_id = ${orgId} AND status_code NOT IN ('resolved', 'closed', 'cancelled')) as "openTickets",
      (SELECT COUNT(*) FROM service_tickets WHERE organization_id = ${orgId} AND status_code NOT IN ('resolved', 'closed', 'cancelled') AND priority_code = 'p1_critical') as "criticalTickets",
      (SELECT COUNT(*) FROM maintenance_schedule_occurrences mso JOIN maintenance_plans mp ON mso.maintenance_plan_id = mp.id WHERE mp.organization_id = ${orgId} AND mso.due_state IN ('scheduled', 'due_soon', 'due_today', 'overdue')) as "maintenanceDue",
      (SELECT COUNT(*) FROM maintenance_schedule_occurrences mso JOIN maintenance_plans mp ON mso.maintenance_plan_id = mp.id WHERE mp.organization_id = ${orgId} AND mso.due_state = 'overdue') as "maintenanceOverdue"
  `);

  const s = stats.rows[0] as any;

  let pmComplianceRate = 100;
  const due = Number(s.maintenanceDue) || 0;
  const overdue = Number(s.maintenanceOverdue) || 0;
  if (due > 0) {
    pmComplianceRate = Math.round(((due - overdue) / due) * 100);
  }

  return {
    totalDevices: Number(s.totalDevices) || 0,
    activeDevices: Number(s.activeDevices) || 0,
    outOfService: Number(s.outOfService) || 0,
    openTickets: Number(s.openTickets) || 0,
    criticalTickets: Number(s.criticalTickets) || 0,
    maintenanceDue: due,
    maintenanceOverdue: overdue,
    pmComplianceRate,
  };
}

export async function getMyTickets(limit = 5) {
  const user = await requireAuth();
  const orgId = user.organizationId;
  if (!orgId) return [];

  const tickets = await db.query.serviceTickets.findMany({
    where: and(
      eq(serviceTickets.organizationId, orgId),
      or(
        eq(serviceTickets.reportedByUserId, user.id),
        eq(serviceTickets.statusCode, 'waiting_requester')
      )
    ),
    with: {
      device: true,
    },
    orderBy: [desc(serviceTickets.updatedAt), desc(serviceTickets.reportedAt)],
    limit
  });

  return tickets.map(t => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    title: t.title,
    statusCode: t.statusCode,
    priorityCode: t.priorityCode,
    reportedAt: t.reportedAt,
    deviceName: t.device?.name
  }));
}

export async function getDepartmentAlerts() {
  const user = await requireAuth();
  const orgId = user.organizationId;
  if (!orgId) return [];

  const userScopes = await db.query.userAccessScopes.findMany({
    where: eq(userAccessScopes.userId, user.id)
  });
  const deptIds = userScopes.map(s => s.departmentId).filter(Boolean) as string[];

  if (deptIds.length === 0) {
    if (user.roles.includes('SYS_ADMIN') || user.roles.includes('ORG_ADMIN') || user.roles.includes('HOSP_ADMIN') || user.roles.includes('BIOMED_MGR')) {
      const dev = await db.query.devices.findMany({
        where: and(
          eq(devices.organizationId, orgId),
          ne(devices.currentStatusCode, 'operational')
        ),
        with: {
          department: true,
        },
        limit: 10
      });
      return dev.map(d => ({
        id: d.id,
        name: d.name,
        assetNumber: d.assetNumber,
        currentStatusCode: d.currentStatusCode,
        departmentName: d.department?.name,
        locationDescription: d.exactLocationDescription
      }));
    }
    return [];
  }

  const dev = await db.query.devices.findMany({
    where: and(
      eq(devices.organizationId, orgId),
      inArray(devices.departmentId, deptIds),
      ne(devices.currentStatusCode, 'operational')
    ),
    with: {
      department: true,
    },
    limit: 10
  });

  return dev.map(d => ({
    id: d.id,
    name: d.name,
    assetNumber: d.assetNumber,
    currentStatusCode: d.currentStatusCode,
    departmentName: d.department?.name,
    locationDescription: d.exactLocationDescription
  }));
}

export async function getTriageQueue(limit = 5) {
  const user = await requireAuth();
  const orgId = user.organizationId;
  if (!orgId) return [];

  const tickets = await db.query.serviceTickets.findMany({
    where: and(
      eq(serviceTickets.organizationId, orgId),
      eq(serviceTickets.statusCode, 'new')
    ),
    with: {
      device: true,
    },
    orderBy: [desc(serviceTickets.priorityCode), desc(serviceTickets.reportedAt)],
    limit
  });

  return tickets.map(t => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    title: t.title,
    statusCode: t.statusCode,
    priorityCode: t.priorityCode,
    reportedAt: t.reportedAt,
    deviceName: t.device?.name
  }));
}

export async function getMyAssignedWork(limit = 10) {
  const user = await requireAuth();
  const orgId = user.organizationId;
  if (!orgId) return [];

  const [tix, tsk] = await Promise.all([
    db.query.serviceTickets.findMany({
      where: and(
        eq(serviceTickets.organizationId, orgId),
        eq(serviceTickets.assignedEngineerUserId, user.id),
        not(inArray(serviceTickets.statusCode, ['resolved', 'closed', 'cancelled']))
      ),
      with: { device: true },
      limit
    }),
    db.query.maintenanceTasks.findMany({
      where: and(
        eq(maintenanceTasks.organizationId, orgId),
        eq(maintenanceTasks.assignedEngineerUserId, user.id),
        not(inArray(maintenanceTasks.statusCode, ['work_complete', 'awaiting_review', 'awaiting_release', 'closed', 'cancelled']))
      ),
      with: { device: true },
      limit
    })
  ]);

  const assigned = [
    ...tix.map(t => ({
      id: t.id,
      number: t.ticketNumber,
      title: t.title,
      statusCode: t.statusCode,
      priorityCode: t.priorityCode,
      date: t.reportedAt,
      deviceName: t.device?.name,
      type: 'ticket' as const
    })),
    ...tsk.map(t => ({
      id: t.id,
      number: t.taskNumber,
      title: t.title,
      statusCode: t.statusCode,
      priorityCode: t.priorityCode || 'p3_normal',
      date: t.dueDate,
      deviceName: t.device?.name,
      type: 'task' as const
    }))
  ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, limit);

  return assigned;
}

export async function getMaintenanceDueSummary() {
  const user = await requireAuth();
  const orgId = user.organizationId;
  if (!orgId) return { due_today: 0, due_soon: 0, overdue: 0 };

  const summary = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM maintenance_schedule_occurrences mso JOIN maintenance_plans mp ON mso.maintenance_plan_id = mp.id WHERE mp.organization_id = ${orgId} AND mso.due_state = 'due_today') as "due_today",
      (SELECT COUNT(*) FROM maintenance_schedule_occurrences mso JOIN maintenance_plans mp ON mso.maintenance_plan_id = mp.id WHERE mp.organization_id = ${orgId} AND mso.due_state = 'due_soon') as "due_soon",
      (SELECT COUNT(*) FROM maintenance_schedule_occurrences mso JOIN maintenance_plans mp ON mso.maintenance_plan_id = mp.id WHERE mp.organization_id = ${orgId} AND mso.due_state = 'overdue') as "overdue"
  `);

  const s = summary.rows[0] as any;
  return {
    due_today: Number(s.due_today) || 0,
    due_soon: Number(s.due_soon) || 0,
    overdue: Number(s.overdue) || 0,
  };
}

export async function getAwaitingReview(limit = 5) {
  const user = await requireAuth();
  const orgId = user.organizationId;
  if (!orgId) return [];

  const tasks = await db.query.maintenanceTasks.findMany({
    where: and(
      eq(maintenanceTasks.organizationId, orgId),
      inArray(maintenanceTasks.statusCode, ['awaiting_review', 'awaiting_release'])
    ),
    with: {
      device: true,
    },
    orderBy: [desc(maintenanceTasks.updatedAt)],
    limit
  });

  return tasks.map(t => ({
    id: t.id,
    taskNumber: t.taskNumber,
    title: t.title,
    statusCode: t.statusCode,
    dueDate: t.dueDate,
    deviceName: t.device?.name,
    maintenanceType: t.maintenanceType
  }));
}

export async function getDevicesOutOfService(limit = 10) {
  const user = await requireAuth();
  const orgId = user.organizationId;
  if (!orgId) return [];

  const dev = await db.query.devices.findMany({
    where: and(
      eq(devices.organizationId, orgId),
      eq(devices.currentStatusCode, 'out_of_service')
    ),
    with: {
      department: true,
    },
    limit
  });

  return dev.map(d => ({
    id: d.id,
    name: d.name,
    assetNumber: d.assetNumber,
    currentStatusCode: d.currentStatusCode,
    departmentName: d.department?.name,
    locationDescription: d.exactLocationDescription
  }));
}

export async function getAdminAlerts() {
  const user = await requireAuth();
  const orgId = user.organizationId;
  if (!orgId) return { usersWithoutRoles: 0, pendingInvitations: 0, departmentsWithoutManager: 0 };

  const res = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM users u LEFT JOIN user_role_assignments ura ON u.id = ura.user_id WHERE u.organization_id = ${orgId} AND ura.id IS NULL) as "usersWithoutRoles",
      (SELECT COUNT(*) FROM users WHERE organization_id = ${orgId} AND account_status = 'invited') as "pendingInvitations",
      (SELECT COUNT(*) FROM departments WHERE organization_id = ${orgId} AND manager_user_id IS NULL AND status = 'active') as "departmentsWithoutManager"
  `);
  
  const s = res.rows[0] as any;
  return {
    usersWithoutRoles: Number(s.usersWithoutRoles) || 0,
    pendingInvitations: Number(s.pendingInvitations) || 0,
    departmentsWithoutManager: Number(s.departmentsWithoutManager) || 0,
  };
}


