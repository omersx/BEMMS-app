'use server';

import { db } from '@/lib/db';
import { 
  maintenancePlans, 
  maintenanceScheduleOccurrences,
  maintenanceTasks,
  devices,
  users
} from '@/lib/db/schema';
import { requireAuth, requireScope } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit';
import { eq, and, desc, ilike, or, count, getTableColumns, sql, lte, asc } from 'drizzle-orm';
import {
  createMaintenancePlanSchema,
  updateMaintenancePlanSchema,
  deferOccurrenceSchema,
} from '@/lib/validators/maintenance';
import { createMaintenanceTask } from './maintenance-tasks';
import { z } from 'zod';

export async function createMaintenancePlan(input: z.infer<typeof createMaintenancePlanSchema>) {
  const user = await requireAuth();

  try {
    const data = createMaintenancePlanSchema.parse(input);
    await requireScope({ organizationId: data.organizationId, hospitalId: data.hospitalId });

    // Ensure the baseline date is valid
    const baselineDate = new Date(data.startBaselineDate);
    if (isNaN(baselineDate.getTime())) {
      return { success: false, error: 'Invalid baseline date' };
    }

    // Calculate initial next due date
    const nextDueDate = new Date(baselineDate);
    
    // Create the plan
    const [newPlan] = await db.insert(maintenancePlans).values({
      organizationId: data.organizationId,
      hospitalId: data.hospitalId,
      departmentId: data.departmentId,
      deviceId: data.deviceId,
      planTypeCode: data.planTypeCode,
      title: data.title,
      calculationMethod: data.calculationMethod,
      frequencyInterval: data.frequencyInterval,
      frequencyUnit: data.frequencyUnit,
      startBaselineDate: baselineDate,
      nextDueDate: nextDueDate, // Initial nextDueDate is the baseline date for the first run
      leadTimeDays: data.leadTimeDays,
      assignedEngineerUserId: data.assignedEngineerUserId,
      checklistTemplateVersionId: data.checklistTemplateVersionId,
      instructions: data.instructions,
      createdByUserId: user.id,
      updatedByUserId: user.id,
    }).returning();

    await createAuditLog({
      actionType: 'CREATE',
      entityType: 'MAINTENANCE_PLAN',
      entityId: newPlan.id,
      organizationId: newPlan.organizationId,
      hospitalId: newPlan.hospitalId,
      departmentId: newPlan.departmentId,
      userId: user.id,
      details: { title: data.title, calculationMethod: data.calculationMethod }
    });

    return { success: true, data: newPlan };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMaintenancePlanById(id: string) {
  const user = await requireAuth();

  try {
    const plan = await db.query.maintenancePlans.findFirst({
      where: eq(maintenancePlans.id, id),
      with: {
        device: true,
        assignedEngineer: true,
        occurrences: {
          orderBy: [desc(maintenanceScheduleOccurrences.currentDueDate)],
          limit: 10
        }
      }
    });

    if (!plan) return { success: false, error: 'Maintenance plan not found' };
    await requireScope({ organizationId: plan.organizationId, hospitalId: plan.hospitalId });

    return { success: true, data: plan };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMaintenancePlan(id: string, input: z.infer<typeof updateMaintenancePlanSchema>) {
  const user = await requireAuth();

  try {
    const data = updateMaintenancePlanSchema.parse(input);
    const plan = await db.query.maintenancePlans.findFirst({ where: eq(maintenancePlans.id, id) });

    if (!plan) return { success: false, error: 'Plan not found' };
    await requireScope({ organizationId: plan.organizationId, hospitalId: plan.hospitalId });

    const [updated] = await db.update(maintenancePlans).set({
      title: data.title,
      frequencyInterval: data.frequencyInterval,
      frequencyUnit: data.frequencyUnit,
      leadTimeDays: data.leadTimeDays,
      assignedEngineerUserId: data.assignedEngineerUserId,
      checklistTemplateVersionId: data.checklistTemplateVersionId,
      instructions: data.instructions,
      updatedAt: new Date(),
      updatedByUserId: user.id
    }).where(eq(maintenancePlans.id, id)).returning();

    await createAuditLog({
      actionType: 'UPDATE',
      entityType: 'MAINTENANCE_PLAN',
      entityId: id,
      organizationId: plan.organizationId,
      userId: user.id,
      details: { revisionNote: data.revisionNote }
    });

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function pauseMaintenancePlan(id: string, reason: string) {
  const user = await requireAuth();

  try {
    const plan = await db.query.maintenancePlans.findFirst({ where: eq(maintenancePlans.id, id) });
    if (!plan) return { success: false, error: 'Plan not found' };
    await requireScope({ organizationId: plan.organizationId, hospitalId: plan.hospitalId });

    const [updated] = await db.update(maintenancePlans).set({
      status: 'paused',
      pauseReason: reason,
      updatedAt: new Date(),
      updatedByUserId: user.id
    }).where(eq(maintenancePlans.id, id)).returning();

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resumeMaintenancePlan(id: string) {
  const user = await requireAuth();

  try {
    const plan = await db.query.maintenancePlans.findFirst({ where: eq(maintenancePlans.id, id) });
    if (!plan) return { success: false, error: 'Plan not found' };
    await requireScope({ organizationId: plan.organizationId, hospitalId: plan.hospitalId });

    const [updated] = await db.update(maintenancePlans).set({
      status: 'active',
      pauseReason: null,
      updatedAt: new Date(),
      updatedByUserId: user.id
    }).where(eq(maintenancePlans.id, id)).returning();

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generateScheduledTasks() {
  // In production, this would be secured differently (e.g. secret cron token). 
  // For now, require auth but allow any logged-in biomed/admin to trigger it.
  const user = await requireAuth();
  
  if (!user.roles.includes('SYS_ADMIN') && !user.roles.includes('BIOMED_MGR') && !user.roles.includes('BIOMED_ENG')) {
      return { success: false, error: 'Unauthorized to trigger task generation' };
  }

  try {
    // 1. Find all active plans where nextDueDate - leadTime <= now
    const now = new Date();
    
    // We fetch all active plans and filter in memory for complex date math, 
    // or we could do it in SQL. For simplicity/reliability across DB engines, we'll do basic SQL + memory.
    const activePlans = await db.query.maintenancePlans.findMany({
      where: eq(maintenancePlans.status, 'active')
    });

    let generatedCount = 0;

    for (const plan of activePlans) {
      const leadTimeMs = (plan.leadTimeDays || 30) * 24 * 60 * 60 * 1000;
      const generationDate = new Date(plan.nextDueDate.getTime() - leadTimeMs);

      if (now >= generationDate) {
        // Check if we already generated an occurrence for this specific due date
        // to ensure idempotency.
        const existingOccurrence = await db.query.maintenanceScheduleOccurrences.findFirst({
          where: and(
            eq(maintenanceScheduleOccurrences.maintenancePlanId, plan.id),
            eq(maintenanceScheduleOccurrences.originalDueDate, plan.nextDueDate)
          )
        });

        if (!existingOccurrence) {
          // 1. Create the occurrence
          const [occurrence] = await db.insert(maintenanceScheduleOccurrences).values({
            maintenancePlanId: plan.id,
            deviceId: plan.deviceId,
            originalDueDate: plan.nextDueDate,
            currentDueDate: plan.nextDueDate,
            dueState: 'scheduled',
            generatedAt: new Date()
          }).returning();

          // 2. Create the associated maintenance task
          const taskData = {
            organizationId: plan.organizationId,
            hospitalId: plan.hospitalId,
            departmentId: plan.departmentId || undefined,
            deviceId: plan.deviceId,
            maintenanceScheduleOccurrenceId: occurrence.id,
            maintenanceType: plan.planTypeCode || 'preventive_maintenance',
            title: plan.title || `Preventive Maintenance`,
            assignedEngineerUserId: plan.assignedEngineerUserId || undefined,
            dueDate: plan.nextDueDate.toISOString(),
            checklistTemplateVersionId: plan.checklistTemplateVersionId || undefined,
            description: plan.instructions || undefined,
            priorityCode: 'p3_normal' as const
          };

          const taskResult = await createMaintenanceTask(taskData);

          if (taskResult.success && taskResult.data) {
             // 3. Link the task back to the occurrence
             await db.update(maintenanceScheduleOccurrences)
               .set({ generatedTaskId: taskResult.data.id })
               .where(eq(maintenanceScheduleOccurrences.id, occurrence.id));
             
             // 4. Calculate the NEXT due date for the plan and update it
             // For fixed_calendar, we just add the interval to the current nextDueDate
             // For completion_based, we DO NOT advance it here. It gets advanced when the task is completed.
             if (plan.calculationMethod === 'fixed_calendar') {
                const nextDate = new Date(plan.nextDueDate);
                if (plan.frequencyUnit === 'days') nextDate.setDate(nextDate.getDate() + plan.frequencyInterval);
                else if (plan.frequencyUnit === 'weeks') nextDate.setDate(nextDate.getDate() + (plan.frequencyInterval * 7));
                else if (plan.frequencyUnit === 'months') nextDate.setMonth(nextDate.getMonth() + plan.frequencyInterval);
                else if (plan.frequencyUnit === 'years') nextDate.setFullYear(nextDate.getFullYear() + plan.frequencyInterval);
                
                await db.update(maintenancePlans)
                  .set({ nextDueDate: nextDate, updatedAt: new Date() })
                  .where(eq(maintenancePlans.id, plan.id));
             }

             generatedCount++;
          }
        }
      }
    }

    return { success: true, count: generatedCount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deferScheduleOccurrence(occurrenceId: string, input: z.infer<typeof deferOccurrenceSchema>) {
  const user = await requireAuth();

  try {
    const data = deferOccurrenceSchema.parse(input);
    const occurrence = await db.query.maintenanceScheduleOccurrences.findFirst({
      where: eq(maintenanceScheduleOccurrences.id, occurrenceId),
      with: { maintenancePlan: true }
    });

    if (!occurrence || !occurrence.maintenancePlan) return { success: false, error: 'Occurrence not found' };
    await requireScope({ organizationId: occurrence.maintenancePlan.organizationId, hospitalId: occurrence.maintenancePlan.hospitalId });
    
    if (!user.roles.includes('BIOMED_MGR') && !user.roles.includes('SYS_ADMIN')) {
        return { success: false, error: 'Only managers can approve deferrals' };
    }

    const newDate = new Date(data.newDueDate);

    const [updated] = await db.update(maintenanceScheduleOccurrences).set({
      currentDueDate: newDate,
      dueState: 'deferred',
      deferredAt: new Date(),
      deferralReason: data.deferralReason,
      deferredByUserId: user.id
    }).where(eq(maintenanceScheduleOccurrences.id, occurrenceId)).returning();

    // Also update the linked task's due date
    if (occurrence.generatedTaskId) {
        await db.update(maintenanceTasks)
          .set({ dueDate: newDate, updatedAt: new Date(), updatedByUserId: user.id })
          .where(eq(maintenanceTasks.id, occurrence.generatedTaskId));
    }

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
