'use server';

import { db } from '@/lib/db';
import { 
  maintenanceTasks, 
  serviceTickets, 
  devices,
  checklistTemplateVersions,
  maintenanceChecklistResults,
  users
} from '@/lib/db/schema';
import { requireAuth, requireRole, requireScope } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit';
import { eq, and, desc, inArray, ilike, or, count, getTableColumns, sql } from 'drizzle-orm';
import {
  createMaintenanceTaskSchema,
  assignMaintenanceTaskSchema,
  updateMaintenanceTaskStageSchema,
  completeMaintenanceTaskSchema,
  cancelMaintenanceTaskSchema,
  maintenanceTaskFilterSchema
} from '@/lib/validators/maintenance';
import { z } from 'zod';
import crypto from 'crypto';

function generateTaskNumber() {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TSK-${yearMonth}-${randomStr}`;
}

export async function createMaintenanceTask(input: z.infer<typeof createMaintenanceTaskSchema>) {
  const user = await requireAuth();
  
  try {
    const data = createMaintenanceTaskSchema.parse(input);
    await requireScope({ organizationId: data.organizationId, hospitalId: data.hospitalId });

    const taskNumber = generateTaskNumber();

    const [newTask] = await db.insert(maintenanceTasks).values({
      taskNumber,
      organizationId: data.organizationId,
      hospitalId: data.hospitalId,
      departmentId: data.departmentId,
      locationId: data.locationId,
      deviceId: data.deviceId,
      serviceTicketId: data.serviceTicketId,
      maintenanceScheduleOccurrenceId: data.maintenanceScheduleOccurrenceId,
      maintenanceType: data.maintenanceType,
      technicalProblemCategory: data.technicalProblemCategory,
      title: data.title,
      description: data.description,
      assignedEngineerUserId: data.assignedEngineerUserId,
      priorityCode: data.priorityCode,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      checklistTemplateVersionId: data.checklistTemplateVersionId,
      statusCode: data.assignedEngineerUserId ? 'assigned' : 'draft',
      createdByUserId: user.id,
      updatedByUserId: user.id,
    }).returning();

    await createAuditLog({
      actionType: 'CREATE',
      entityType: 'MAINTENANCE_TASK',
      entityId: newTask.id,
      organizationId: newTask.organizationId,
      hospitalId: newTask.hospitalId,
      departmentId: newTask.departmentId,
      userId: user.id,
      details: { taskNumber, maintenanceType: data.maintenanceType }
    });

    return { success: true, data: newTask };
  } catch (error: any) {
    console.error('Failed to create maintenance task:', error);
    return { success: false, error: error.message };
  }
}

export async function getMaintenanceTaskById(id: string) {
  const user = await requireAuth();

  try {
    const task = await db.query.maintenanceTasks.findFirst({
      where: eq(maintenanceTasks.id, id),
      with: {
        device: true,
        hospital: true,
        department: true,
        assignedEngineer: true,
        serviceTicket: true,
        checklistTemplateVersion: true,
        checklistResults: true,
        createdByUser: true,
      }
    });

    if (!task) return { success: false, error: 'Maintenance task not found' };

    await requireScope({ organizationId: task.organizationId, hospitalId: task.hospitalId });

    return { success: true, data: task };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function listMaintenanceTasks(input?: z.infer<typeof maintenanceTaskFilterSchema>) {
  const user = await requireAuth();

  try {
    const filters = maintenanceTaskFilterSchema.parse(input || { page: 1, pageSize: 20 });
    const conditions = [];

    // Basic role scoping - users should only see tasks in their org/hospital
    if (!user.roles.includes('SYS_ADMIN')) {
      if (user.organizationId) {
        conditions.push(eq(maintenanceTasks.organizationId, user.organizationId));
      }
    }

    if (filters.hospitalId) conditions.push(eq(maintenanceTasks.hospitalId, filters.hospitalId));
    if (filters.departmentId) conditions.push(eq(maintenanceTasks.departmentId, filters.departmentId));
    if (filters.deviceId) conditions.push(eq(maintenanceTasks.deviceId, filters.deviceId));
    if (filters.statusCode) conditions.push(eq(maintenanceTasks.statusCode, filters.statusCode as any));
    if (filters.maintenanceType) conditions.push(eq(maintenanceTasks.maintenanceType, filters.maintenanceType as any));
    if (filters.assignedEngineerUserId) conditions.push(eq(maintenanceTasks.assignedEngineerUserId, filters.assignedEngineerUserId));

    if (filters.search) {
      conditions.push(
        or(
          ilike(maintenanceTasks.taskNumber, `%${filters.search}%`),
          ilike(maintenanceTasks.title, `%${filters.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (filters.page - 1) * filters.pageSize;
    
    const [totalCount, data] = await Promise.all([
      db.select({ count: count() }).from(maintenanceTasks).where(whereClause),
      db.query.maintenanceTasks.findMany({
        where: whereClause,
        orderBy: [desc(maintenanceTasks.createdAt)],
        limit: filters.pageSize,
        offset: offset,
        with: {
          device: { columns: { name: true, assetNumber: true } },
          assignedEngineer: { columns: { fullName: true } }
        }
      })
    ]);

    return { 
      success: true, 
      data, 
      meta: {
        total: totalCount[0].count,
        page: filters.page,
        pageSize: filters.pageSize,
        totalPages: Math.ceil(totalCount[0].count / filters.pageSize)
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function assignMaintenanceTask(id: string, input: z.infer<typeof assignMaintenanceTaskSchema>) {
  const user = await requireAuth();

  try {
    const data = assignMaintenanceTaskSchema.parse(input);
    
    const task = await db.query.maintenanceTasks.findFirst({
      where: eq(maintenanceTasks.id, id),
    });

    if (!task) return { success: false, error: 'Task not found' };
    await requireScope({ organizationId: task.organizationId, hospitalId: task.hospitalId });

    const validStates = ['draft', 'assigned'];
    if (!validStates.includes(task.statusCode)) {
      return { success: false, error: `Cannot assign task in ${task.statusCode} state` };
    }

    const [updated] = await db.update(maintenanceTasks).set({
      assignedEngineerUserId: data.assignedEngineerUserId,
      statusCode: 'assigned',
      updatedAt: new Date(),
      updatedByUserId: user.id
    }).where(eq(maintenanceTasks.id, id)).returning();

    await createAuditLog({
      actionType: 'ASSIGN',
      entityType: 'MAINTENANCE_TASK',
      entityId: id,
      organizationId: task.organizationId,
      userId: user.id,
      details: { assignedTo: data.assignedEngineerUserId, handoffNote: data.handoffNote }
    });

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function startMaintenanceTask(id: string) {
  const user = await requireAuth();

  try {
    const task = await db.query.maintenanceTasks.findFirst({
      where: eq(maintenanceTasks.id, id),
    });

    if (!task) return { success: false, error: 'Task not found' };
    await requireScope({ organizationId: task.organizationId, hospitalId: task.hospitalId });

    const validStates = ['assigned', 'waiting_dependency'];
    if (!validStates.includes(task.statusCode)) {
      return { success: false, error: `Cannot start task from ${task.statusCode} state` };
    }

    const updates: any = {
      statusCode: 'in_progress',
      updatedAt: new Date(),
      updatedByUserId: user.id
    };

    if (!task.startedAt) {
      updates.startedAt = new Date();
    }

    const [updated] = await db.update(maintenanceTasks)
      .set(updates)
      .where(eq(maintenanceTasks.id, id))
      .returning();

    await createAuditLog({
      actionType: 'UPDATE',
      entityType: 'MAINTENANCE_TASK',
      entityId: id,
      organizationId: task.organizationId,
      userId: user.id,
      details: { action: 'start_work', previousState: task.statusCode }
    });

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markTaskWaiting(id: string, input: z.infer<typeof updateMaintenanceTaskStageSchema>) {
  const user = await requireAuth();

  try {
    const data = updateMaintenanceTaskStageSchema.parse(input);
    const task = await db.query.maintenanceTasks.findFirst({
      where: eq(maintenanceTasks.id, id),
    });

    if (!task) return { success: false, error: 'Task not found' };
    await requireScope({ organizationId: task.organizationId, hospitalId: task.hospitalId });

    if (task.statusCode !== 'in_progress') {
      return { success: false, error: `Cannot pause task from ${task.statusCode} state` };
    }

    const [updated] = await db.update(maintenanceTasks).set({
      statusCode: 'waiting_dependency',
      waitingDependencyType: data.waitingDependencyType,
      waitingReason: data.waitingReason,
      updatedAt: new Date(),
      updatedByUserId: user.id
    }).where(eq(maintenanceTasks.id, id)).returning();

    await createAuditLog({
      actionType: 'UPDATE',
      entityType: 'MAINTENANCE_TASK',
      entityId: id,
      organizationId: task.organizationId,
      userId: user.id,
      details: { action: 'mark_waiting', reason: data.waitingReason, type: data.waitingDependencyType }
    });

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function completeTaskWork(id: string, input: z.infer<typeof completeMaintenanceTaskSchema>) {
  const user = await requireAuth();

  try {
    const data = completeMaintenanceTaskSchema.parse(input);
    const task = await db.query.maintenanceTasks.findFirst({
      where: eq(maintenanceTasks.id, id),
      with: { checklistResults: true }
    });

    if (!task) return { success: false, error: 'Task not found' };
    await requireScope({ organizationId: task.organizationId, hospitalId: task.hospitalId });

    const validStates = ['in_progress', 'returned_for_rework'];
    if (!validStates.includes(task.statusCode)) {
      return { success: false, error: `Cannot complete work from ${task.statusCode} state` };
    }

    // TODO: Verify checklist completion logic here (if checklist is attached, verify all required are answered)

    const [updated] = await db.update(maintenanceTasks).set({
      statusCode: 'work_complete',
      completedAt: new Date(),
      updatedAt: new Date(),
      updatedByUserId: user.id
    }).where(eq(maintenanceTasks.id, id)).returning();

    await createAuditLog({
      actionType: 'UPDATE',
      entityType: 'MAINTENANCE_TASK',
      entityId: id,
      organizationId: task.organizationId,
      userId: user.id,
      details: { action: 'work_complete', finalResultCode: data.finalResultCode }
    });

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function cancelMaintenanceTask(id: string, input: z.infer<typeof cancelMaintenanceTaskSchema>) {
  const user = await requireAuth();

  try {
    const data = cancelMaintenanceTaskSchema.parse(input);
    const task = await db.query.maintenanceTasks.findFirst({
      where: eq(maintenanceTasks.id, id),
    });

    if (!task) return { success: false, error: 'Task not found' };
    await requireScope({ organizationId: task.organizationId, hospitalId: task.hospitalId });

    const activeStates = ['draft', 'assigned', 'in_progress', 'waiting_dependency'];
    if (!activeStates.includes(task.statusCode)) {
      return { success: false, error: `Cannot cancel task in ${task.statusCode} state` };
    }

    const [updated] = await db.update(maintenanceTasks).set({
      statusCode: 'cancelled',
      updatedAt: new Date(),
      updatedByUserId: user.id
    }).where(eq(maintenanceTasks.id, id)).returning();

    await createAuditLog({
      actionType: 'UPDATE',
      entityType: 'MAINTENANCE_TASK',
      entityId: id,
      organizationId: task.organizationId,
      userId: user.id,
      details: { action: 'cancel', reason: data.cancellationReason }
    });

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMaintenanceTaskFromTicket(ticketId: string, input: z.infer<typeof createMaintenanceTaskSchema>) {
  const user = await requireAuth();

  try {
    const ticket = await db.query.serviceTickets.findFirst({
      where: eq(serviceTickets.id, ticketId)
    });

    if (!ticket) return { success: false, error: 'Service ticket not found' };
    await requireScope({ organizationId: ticket.organizationId, hospitalId: ticket.hospitalId });

    // Override some fields with ticket context
    const dataToCreate = {
      ...input,
      organizationId: ticket.organizationId,
      hospitalId: ticket.hospitalId,
      departmentId: ticket.departmentId || undefined,
      deviceId: ticket.deviceId!,
      serviceTicketId: ticket.id,
    };

    const result = await createMaintenanceTask(dataToCreate);

    if (result.success) {
      // Transition ticket to in_progress if it isn't already closed/resolved
      if (!['resolved', 'closed', 'cancelled'].includes(ticket.statusCode)) {
         await db.update(serviceTickets)
           .set({ statusCode: 'in_progress', updatedAt: new Date() })
           .where(eq(serviceTickets.id, ticket.id));
      }
    }

    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
