'use server';

import { db } from '@/lib/db';
import {
  checklistTemplates,
  checklistTemplateVersions,
  maintenanceChecklistResults,
  maintenanceTasks,
  maintenanceParts,
  maintenanceCosts,
} from '@/lib/db/schema';
import { requireAuth, requireScope } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit';
import { eq, and, desc, count } from 'drizzle-orm';
import {
  createChecklistTemplateSchema,
  createChecklistVersionSchema,
  saveChecklistProgressSchema,
  maintenancePartSchema,
  maintenanceCostSchema,
} from '@/lib/validators/maintenance';
import { z } from 'zod';

// ── Checklist Template Actions ──────────────────────────────────────────────

export async function createChecklistTemplate(input: z.infer<typeof createChecklistTemplateSchema>) {
  const user = await requireAuth();

  try {
    const data = createChecklistTemplateSchema.parse(input);
    await requireScope({ organizationId: data.organizationId });

    // Create the template
    const [template] = await db.insert(checklistTemplates).values({
      organizationId: data.organizationId,
      deviceCategoryId: data.deviceCategoryId,
      name: data.name,
      code: data.code,
      maintenanceType: data.maintenanceType,
    }).returning();

    // Create initial version (v1)
    const [version] = await db.insert(checklistTemplateVersions).values({
      checklistTemplateId: template.id,
      versionNumber: 1,
      itemsJsonb: data.items,
      isActive: true,
      createdByUserId: user.id,
    }).returning();

    await createAuditLog({
      actionType: 'CREATE',
      entityType: 'CHECKLIST_TEMPLATE',
      entityId: template.id,
      organizationId: data.organizationId,
      userId: user.id,
      details: { name: data.name, itemCount: data.items.length },
    });

    return { success: true, data: { ...template, activeVersion: version } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createChecklistVersion(
  templateId: string,
  input: z.infer<typeof createChecklistVersionSchema>
) {
  const user = await requireAuth();

  try {
    const data = createChecklistVersionSchema.parse(input);

    const template = await db.query.checklistTemplates.findFirst({
      where: eq(checklistTemplates.id, templateId),
    });
    if (!template) return { success: false, error: 'Template not found' };
    await requireScope({ organizationId: template.organizationId });

    // Deactivate all existing versions
    await db
      .update(checklistTemplateVersions)
      .set({ isActive: false })
      .where(eq(checklistTemplateVersions.checklistTemplateId, templateId));

    // Get current max version
    const existing = await db.query.checklistTemplateVersions.findMany({
      where: eq(checklistTemplateVersions.checklistTemplateId, templateId),
      orderBy: [desc(checklistTemplateVersions.versionNumber)],
      limit: 1,
    });
    const nextVersion = (existing[0]?.versionNumber ?? 0) + 1;

    const [version] = await db.insert(checklistTemplateVersions).values({
      checklistTemplateId: templateId,
      versionNumber: nextVersion,
      itemsJsonb: data.items,
      isActive: true,
      createdByUserId: user.id,
    }).returning();

    await createAuditLog({
      actionType: 'UPDATE',
      entityType: 'CHECKLIST_TEMPLATE',
      entityId: templateId,
      organizationId: template.organizationId,
      userId: user.id,
      details: { versionNumber: nextVersion, itemCount: data.items.length },
    });

    return { success: true, data: version };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function listChecklistTemplates(organizationId: string) {
  const user = await requireAuth();

  try {
    await requireScope({ organizationId });

    const templates = await db.query.checklistTemplates.findMany({
      where: and(
        eq(checklistTemplates.organizationId, organizationId),
        eq(checklistTemplates.isActive, true)
      ),
      orderBy: [desc(checklistTemplates.createdAt)],
      with: {
        versions: {
          where: eq(checklistTemplateVersions.isActive, true),
          limit: 1,
        },
      },
    });

    return { success: true, data: templates };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getChecklistTemplateById(id: string) {
  const user = await requireAuth();

  try {
    const template = await db.query.checklistTemplates.findFirst({
      where: eq(checklistTemplates.id, id),
      with: {
        versions: {
          orderBy: [desc(checklistTemplateVersions.versionNumber)],
        },
      },
    });

    if (!template) return { success: false, error: 'Template not found' };
    await requireScope({ organizationId: template.organizationId });

    return { success: true, data: template };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Checklist Execution Actions ─────────────────────────────────────────────

export async function saveChecklistProgress(
  taskId: string,
  input: z.infer<typeof saveChecklistProgressSchema>
) {
  const user = await requireAuth();

  try {
    const data = saveChecklistProgressSchema.parse(input);

    const task = await db.query.maintenanceTasks.findFirst({
      where: eq(maintenanceTasks.id, taskId),
      with: { checklistTemplateVersion: true },
    });
    if (!task) return { success: false, error: 'Task not found' };
    await requireScope({ organizationId: task.organizationId, hospitalId: task.hospitalId });

    // Get the template items to snapshot labels
    const templateItems: any[] = (task.checklistTemplateVersion?.itemsJsonb as any[]) || [];

    for (const item of data.items) {
      const templateItem = templateItems.find((ti: any) => ti.id === item.templateItemId);
      const labelSnapshot = templateItem?.label || item.templateItemId;
      const orderNum = templateItem?.itemOrder ?? 0;

      // Upsert: update if exists, insert if new
      const existing = await db.query.maintenanceChecklistResults.findFirst({
        where: and(
          eq(maintenanceChecklistResults.maintenanceTaskId, taskId),
          eq(maintenanceChecklistResults.templateItemId, item.templateItemId)
        ),
      });

      if (existing) {
        await db
          .update(maintenanceChecklistResults)
          .set({
            resultCode: item.resultCode,
            measuredValue: item.measuredValue,
            unit: item.unit,
            notes: item.notes,
            performedByUserId: user.id,
            completedAt: item.resultCode ? new Date() : null,
          })
          .where(eq(maintenanceChecklistResults.id, existing.id));
      } else {
        await db.insert(maintenanceChecklistResults).values({
          maintenanceTaskId: taskId,
          templateItemId: item.templateItemId,
          itemLabelSnapshot: labelSnapshot,
          itemOrder: orderNum,
          resultCode: item.resultCode,
          measuredValue: item.measuredValue,
          unit: item.unit,
          notes: item.notes,
          performedByUserId: user.id,
          completedAt: item.resultCode ? new Date() : undefined,
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function validateChecklistCompletion(taskId: string): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const task = await db.query.maintenanceTasks.findFirst({
    where: eq(maintenanceTasks.id, taskId),
    with: {
      checklistTemplateVersion: true,
      checklistResults: true,
    },
  });

  if (!task) return { valid: false, errors: ['Task not found'] };

  // If no checklist is attached, it's valid
  if (!task.checklistTemplateVersionId || !task.checklistTemplateVersion) {
    return { valid: true, errors: [] };
  }

  const templateItems: any[] = (task.checklistTemplateVersion.itemsJsonb as any[]) || [];
  const results = task.checklistResults || [];
  const errors: string[] = [];

  for (const item of templateItems) {
    if (!item.isRequired) continue;

    const result = results.find((r: any) => r.templateItemId === item.id);

    if (!result || !result.resultCode) {
      errors.push(`Required item "${item.label}" has not been completed`);
      continue;
    }

    // Failed items must have notes
    if ((result.resultCode === 'failed' || result.resultCode === 'requires_follow_up') && !result.notes) {
      errors.push(`Item "${item.label}" is marked ${result.resultCode} but has no explanation notes`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── Parts Actions ───────────────────────────────────────────────────────────

export async function addMaintenancePart(taskId: string, input: z.infer<typeof maintenancePartSchema>) {
  const user = await requireAuth();

  try {
    const data = maintenancePartSchema.parse(input);

    const task = await db.query.maintenanceTasks.findFirst({
      where: eq(maintenanceTasks.id, taskId),
    });
    if (!task) return { success: false, error: 'Task not found' };
    await requireScope({ organizationId: task.organizationId, hospitalId: task.hospitalId });

    const [part] = await db.insert(maintenanceParts).values({
      maintenanceTaskId: taskId,
      partNumber: data.partNumber,
      partName: data.partName,
      quantity: data.quantity,
      unitCost: data.unitCost,
      currency: data.currency,
      supplierName: data.supplierName,
      notes: data.notes,
      recordedByUserId: user.id,
    }).returning();

    return { success: true, data: part };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMaintenancePart(partId: string) {
  const user = await requireAuth();

  try {
    const part = await db.query.maintenanceParts.findFirst({
      where: eq(maintenanceParts.id, partId),
      with: { maintenanceTask: true },
    });
    if (!part) return { success: false, error: 'Part not found' };

    const task = part.maintenanceTask;
    if (!task) return { success: false, error: 'Linked task not found' };
    await requireScope({ organizationId: task.organizationId, hospitalId: task.hospitalId });

    // Only allow deletion while task is in active work state
    const editableStates = ['in_progress', 'returned_for_rework', 'work_complete'];
    if (!editableStates.includes(task.statusCode)) {
      return { success: false, error: `Cannot modify parts in ${task.statusCode} state` };
    }

    await db.delete(maintenanceParts).where(eq(maintenanceParts.id, partId));

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Costs Actions ───────────────────────────────────────────────────────────

export async function addMaintenanceCost(taskId: string, input: z.infer<typeof maintenanceCostSchema>) {
  const user = await requireAuth();

  try {
    const data = maintenanceCostSchema.parse(input);

    const task = await db.query.maintenanceTasks.findFirst({
      where: eq(maintenanceTasks.id, taskId),
    });
    if (!task) return { success: false, error: 'Task not found' };
    await requireScope({ organizationId: task.organizationId, hospitalId: task.hospitalId });

    const [cost] = await db.insert(maintenanceCosts).values({
      maintenanceTaskId: taskId,
      costType: data.costType,
      amount: data.amount,
      currency: data.currency,
      vendorName: data.vendorName,
      invoiceNumber: data.invoiceNumber,
      description: data.description,
      recordedByUserId: user.id,
    }).returning();

    return { success: true, data: cost };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMaintenanceCost(costId: string) {
  const user = await requireAuth();

  try {
    const cost = await db.query.maintenanceCosts.findFirst({
      where: eq(maintenanceCosts.id, costId),
      with: { maintenanceTask: true },
    });
    if (!cost) return { success: false, error: 'Cost entry not found' };

    const task = cost.maintenanceTask;
    if (!task) return { success: false, error: 'Linked task not found' };
    await requireScope({ organizationId: task.organizationId, hospitalId: task.hospitalId });

    const editableStates = ['in_progress', 'returned_for_rework', 'work_complete'];
    if (!editableStates.includes(task.statusCode)) {
      return { success: false, error: `Cannot modify costs in ${task.statusCode} state` };
    }

    await db.delete(maintenanceCosts).where(eq(maintenanceCosts.id, costId));

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTaskPartsAndCosts(taskId: string) {
  const user = await requireAuth();

  try {
    const task = await db.query.maintenanceTasks.findFirst({
      where: eq(maintenanceTasks.id, taskId),
    });
    if (!task) return { success: false, error: 'Task not found' };
    await requireScope({ organizationId: task.organizationId, hospitalId: task.hospitalId });

    const parts = await db.query.maintenanceParts.findMany({
      where: eq(maintenanceParts.maintenanceTaskId, taskId),
    });

    const costs = await db.query.maintenanceCosts.findMany({
      where: eq(maintenanceCosts.maintenanceTaskId, taskId),
    });

    const totalPartsCost = parts.reduce((sum, p) => sum + (p.unitCost || 0) * p.quantity, 0);
    const totalOtherCosts = costs.reduce((sum, c) => sum + c.amount, 0);

    return {
      success: true,
      data: {
        parts,
        costs,
        totalPartsCost,
        totalOtherCosts,
        grandTotal: totalPartsCost + totalOtherCosts,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
