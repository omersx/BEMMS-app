'use server';

import { db } from '@/lib/db';
import {
  maintenanceTasks,
  maintenanceRecords,
  maintenanceParts,
  maintenanceCosts,
  maintenanceChecklistResults,
  recordVersions,
  electronicSignatures,
  devices,
  maintenancePlans,
  maintenanceScheduleOccurrences,
} from '@/lib/db/schema';
import { requireAuth, requireScope } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit';
import { eq, and } from 'drizzle-orm';
import { buildCanonicalSnapshot, computeSHA256 } from '@/lib/utils/crypto';
import { electronicSignatureSchema, reviewWorkSchema, releaseDeviceSchema } from '@/lib/validators/maintenance';
import { verifySignatureAuth, createSignatureEvent } from './signature-auth';
import { getAttestationText } from '@/lib/utils/attestations';
import { z } from 'zod';
import crypto from 'crypto';

function generateRecordNumber() {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `MTR-${yearMonth}-${randomStr}`;
}

// Build the canonical data snapshot for a maintenance task
async function buildMaintenanceSnapshot(taskId: string, txDb?: any) {
  const dbClient = txDb || db;
  const task = await dbClient.query.maintenanceTasks.findFirst({
    where: eq(maintenanceTasks.id, taskId),
    with: {
      device: true,
      checklistResults: true,
    },
  });

  if (!task) throw new Error('Task not found');

  const parts = await dbClient.query.maintenanceParts.findMany({
    where: eq(maintenanceParts.maintenanceTaskId, taskId),
  });

  const costs = await dbClient.query.maintenanceCosts.findMany({
    where: eq(maintenanceCosts.maintenanceTaskId, taskId),
  });

  return {
    taskId: task.id,
    taskNumber: task.taskNumber,
    deviceId: task.deviceId,
    deviceSnapshot: task.deviceSnapshot,
    maintenanceType: task.maintenanceType,
    technicalProblemCategory: task.technicalProblemCategory,
    title: task.title,
    description: task.description,
    checklistResults: (task.checklistResults || []).map((r: any) => ({
      templateItemId: r.templateItemId,
      itemLabel: r.itemLabelSnapshot,
      resultCode: r.resultCode,
      measuredValue: r.measuredValue,
      unit: r.unit,
      notes: r.notes,
    })),
    parts: parts.map((p: any) => ({
      partNumber: p.partNumber,
      partName: p.partName,
      quantity: p.quantity,
      unitCost: p.unitCost,
    })),
    costs: costs.map((c: any) => ({
      costType: c.costType,
      amount: c.amount,
      description: c.description,
    })),
    startedAt: task.startedAt?.toISOString(),
    completedAt: task.completedAt?.toISOString(),
  };
}

/**
 * Performer signs the completed maintenance work.
 * Creates a maintenance record, record version with SHA-256 hash, and electronic signature.
 * Transitions task to awaiting_review.
 *
 * SECURITY: Verifies password re-authentication before signing.
 * INTEGRITY: Wraps all operations in a database transaction.
 * TRACEABILITY: Creates signature_events with hash chain.
 */
export async function signMaintenanceRecord(
  taskId: string,
  completionData: {
    diagnosis?: string;
    rootCause?: string;
    workPerformed: string;
    findings?: string;
    recommendations?: string;
    finalResultCode: string;
    finalDeviceStatusCode: string;
  },
  signatureInput: z.infer<typeof electronicSignatureSchema>
) {
  const user = await requireAuth();

  try {
    const sigData = electronicSignatureSchema.parse(signatureInput);

    // ── 0. Re-authenticate the signer ──
    const authResult = await verifySignatureAuth(user.id, sigData.password);
    if (!authResult.success) {
      return { success: false, error: authResult.error };
    }

    const task = await db.query.maintenanceTasks.findFirst({
      where: eq(maintenanceTasks.id, taskId),
    });
    if (!task) return { success: false, error: 'Task not found' };
    await requireScope({ organizationId: task.organizationId, hospitalId: task.hospitalId });

    if (task.statusCode !== 'work_complete') {
      return { success: false, error: `Task must be in work_complete state, currently: ${task.statusCode}` };
    }

    // ── Execute all DB writes in a single transaction ──
    const result = await db.transaction(async (tx) => {
      // 1. Create the maintenance record
      const [record] = await tx.insert(maintenanceRecords).values({
        recordNumber: generateRecordNumber(),
        organizationId: task.organizationId,
        deviceId: task.deviceId,
        maintenanceTaskId: taskId,
        serviceTicketId: task.serviceTicketId,
        maintenanceType: task.maintenanceType,
        technicalCategory: task.technicalProblemCategory,
        diagnosis: completionData.diagnosis,
        rootCause: completionData.rootCause,
        workPerformed: completionData.workPerformed,
        findings: completionData.findings,
        recommendations: completionData.recommendations,
        finalResultCode: completionData.finalResultCode as any,
        finalDeviceStatusCode: completionData.finalDeviceStatusCode as any,
        startedAt: task.startedAt || new Date(),
        completedAt: task.completedAt || new Date(),
        createdByUserId: user.id,
      }).returning();

      // 2. Build canonical snapshot and hash
      const snapshotData = await buildMaintenanceSnapshot(taskId);
      const fullSnapshot = {
        ...snapshotData,
        record: {
          diagnosis: completionData.diagnosis,
          rootCause: completionData.rootCause,
          workPerformed: completionData.workPerformed,
          findings: completionData.findings,
          recommendations: completionData.recommendations,
          finalResultCode: completionData.finalResultCode,
          finalDeviceStatusCode: completionData.finalDeviceStatusCode,
        },
      };
      const canonicalJson = buildCanonicalSnapshot(fullSnapshot as any);
      const contentHash = computeSHA256(canonicalJson);

      // 3. Create record version
      const [version] = await tx.insert(recordVersions).values({
        organizationId: task.organizationId,
        entityType: 'maintenance_record',
        entityId: record.id,
        versionNumber: 1,
        canonicalSnapshotJsonb: fullSnapshot,
        contentHashSha256: contentHash,
        createdByUserId: user.id,
      }).returning();

      // 4. Create electronic signature
      const [signature] = await tx.insert(electronicSignatures).values({
        organizationId: task.organizationId,
        recordVersionId: version.id,
        entityType: 'maintenance_record',
        entityId: record.id,
        signaturePurpose: 'perform',
        signerUserId: user.id,
        signerNameSnapshot: user.fullName || user.email || 'Unknown',
        signerRoleSnapshot: user.roles?.join(', ') || 'Engineer',
        attestationTextVersion: getAttestationText('perform'),
        authMethod: 'password_reauth',
        signedAt: new Date(),
        signedContentHashSha256: contentHash,
        comments: sigData.comments,
      }).returning();

      // 5. Create signature event (hash chain)
      await createSignatureEvent(tx, {
        signatureId: signature.id,
        eventType: 'created',
        actorUserId: user.id,
        organizationId: task.organizationId,
        newStatus: 'active',
      });

      // 6. Update task: link record, transition to awaiting_review
      await tx.update(maintenanceTasks).set({
        statusCode: 'awaiting_review',
        resultRecordId: record.id,
        updatedAt: new Date(),
        updatedByUserId: user.id,
      }).where(eq(maintenanceTasks.id, taskId));

      // 7. Audit log
      await createAuditLog(tx, {
        actionType: 'SIGN',
        entityType: 'MAINTENANCE_RECORD',
        entityId: record.id,
        organizationId: task.organizationId,
        actorUserId: user.id,
        newState: { purpose: 'perform', contentHash, signatureId: signature.id },
      });

      return { record, version, signature };
    });

    return { success: true, data: { record: result.record, version: result.version } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Reviewer approves or rejects the maintenance work.
 * Enforces Performer ≠ Reviewer.
 *
 * SECURITY: Verifies password re-authentication before signing.
 * INTEGRITY: Wraps all operations in a database transaction.
 * TRACEABILITY: Creates signature_events with hash chain.
 */
export async function reviewMaintenanceRecord(
  taskId: string,
  input: z.infer<typeof reviewWorkSchema>
) {
  const user = await requireAuth();

  try {
    const data = reviewWorkSchema.parse(input);

    // ── 0. Re-authenticate the reviewer ──
    const authResult = await verifySignatureAuth(user.id, data.password);
    if (!authResult.success) {
      return { success: false, error: authResult.error };
    }

    const task = await db.query.maintenanceTasks.findFirst({
      where: eq(maintenanceTasks.id, taskId),
    });
    if (!task) return { success: false, error: 'Task not found' };
    await requireScope({ organizationId: task.organizationId, hospitalId: task.hospitalId });

    if (task.statusCode !== 'awaiting_review') {
      return { success: false, error: `Task must be in awaiting_review state` };
    }

    // Performer ≠ Reviewer enforcement
    const performerSig = await db.query.electronicSignatures.findFirst({
      where: and(
        eq(electronicSignatures.entityId, task.resultRecordId!),
        eq(electronicSignatures.signaturePurpose, 'perform'),
        eq(electronicSignatures.signatureStatus, 'active'),
      ),
    });

    if (performerSig && performerSig.signerUserId === user.id) {
      return { success: false, error: 'Reviewer cannot be the same person as the performer' };
    }

    // Get the latest record version to sign against
    const latestVersion = await db.query.recordVersions.findFirst({
      where: and(
        eq(recordVersions.entityId, task.resultRecordId!),
        eq(recordVersions.entityType, 'maintenance_record')
      ),
    });
    if (!latestVersion) return { success: false, error: 'Record version not found' };

    // ── Execute in transaction ──
    const result = await db.transaction(async (tx) => {
      if (data.decision === 'approve') {
        // Create reviewer signature
        const [signature] = await tx.insert(electronicSignatures).values({
          organizationId: task.organizationId,
          recordVersionId: latestVersion.id,
          entityType: 'maintenance_record',
          entityId: task.resultRecordId!,
          signaturePurpose: 'review',
          signerUserId: user.id,
          signerNameSnapshot: user.fullName || user.email || 'Unknown',
          signerRoleSnapshot: user.roles?.join(', ') || 'Reviewer',
          attestationTextVersion: getAttestationText('review'),
          authMethod: 'password_reauth',
          signedAt: new Date(),
          signedContentHashSha256: latestVersion.contentHashSha256,
          comments: data.reviewNotes,
        }).returning();

        // Create signature event
        await createSignatureEvent(tx, {
          signatureId: signature.id,
          eventType: 'approved',
          actorUserId: user.id,
          organizationId: task.organizationId,
          newStatus: 'active',
        });

        // Transition to awaiting_release
        await tx.update(maintenanceTasks).set({
          statusCode: 'awaiting_release',
          updatedAt: new Date(),
          updatedByUserId: user.id,
        }).where(eq(maintenanceTasks.id, taskId));

        await createAuditLog(tx, {
          actionType: 'SIGN',
          entityType: 'MAINTENANCE_RECORD',
          entityId: task.resultRecordId!,
          organizationId: task.organizationId,
          actorUserId: user.id,
          newState: { purpose: 'review', decision: 'approve', signatureId: signature.id },
        });

        return { decision: 'approve' as const, signatureId: signature.id };
      } else {
        // Reject -> returned_for_rework
        await tx.update(maintenanceTasks).set({
          statusCode: 'returned_for_rework',
          updatedAt: new Date(),
          updatedByUserId: user.id,
        }).where(eq(maintenanceTasks.id, taskId));

        await createAuditLog(tx, {
          actionType: 'UPDATE',
          entityType: 'MAINTENANCE_RECORD',
          entityId: task.resultRecordId!,
          organizationId: task.organizationId,
          actorUserId: user.id,
          newState: { purpose: 'review', decision: 'reject', reason: data.rejectionReason },
        });

        return { decision: 'reject' as const };
      }
    });

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Final release: authorizes device return to clinical use.
 * Updates device status, next PM due date, and finalizes record.
 *
 * SECURITY: Verifies password re-authentication before signing.
 * INTEGRITY: Wraps all operations in a database transaction.
 * TRACEABILITY: Creates signature_events with hash chain.
 */
export async function releaseDeviceMaintenance(
  taskId: string,
  input: z.infer<typeof releaseDeviceSchema>
) {
  const user = await requireAuth();

  try {
    const data = releaseDeviceSchema.parse(input);

    // ── 0. Re-authenticate the release authority ──
    const authResult = await verifySignatureAuth(user.id, data.password);
    if (!authResult.success) {
      return { success: false, error: authResult.error };
    }

    const task = await db.query.maintenanceTasks.findFirst({
      where: eq(maintenanceTasks.id, taskId),
    });
    if (!task) return { success: false, error: 'Task not found' };
    await requireScope({ organizationId: task.organizationId, hospitalId: task.hospitalId });

    if (task.statusCode !== 'awaiting_release') {
      return { success: false, error: `Task must be in awaiting_release state` };
    }

    // Get the latest record version
    const latestVersion = await db.query.recordVersions.findFirst({
      where: and(
        eq(recordVersions.entityId, task.resultRecordId!),
        eq(recordVersions.entityType, 'maintenance_record')
      ),
    });
    if (!latestVersion) return { success: false, error: 'Record version not found' };

    // ── Execute in transaction ──
    await db.transaction(async (tx) => {
      // Create release signature
      const [signature] = await tx.insert(electronicSignatures).values({
        organizationId: task.organizationId,
        recordVersionId: latestVersion.id,
        entityType: 'maintenance_record',
        entityId: task.resultRecordId!,
        signaturePurpose: 'release',
        signerUserId: user.id,
        signerNameSnapshot: user.fullName || user.email || 'Unknown',
        signerRoleSnapshot: user.roles?.join(', ') || 'Release Authority',
        attestationTextVersion: getAttestationText('release'),
        authMethod: 'password_reauth',
        signedAt: new Date(),
        signedContentHashSha256: latestVersion.contentHashSha256,
        comments: data.releaseNotes,
      }).returning();

      // Create signature event
      await createSignatureEvent(tx, {
        signatureId: signature.id,
        eventType: 'approved',
        actorUserId: user.id,
        organizationId: task.organizationId,
        newStatus: 'active',
      });

      // Finalize the maintenance record
      await tx.update(maintenanceRecords).set({
        isFinalized: true,
        finalDeviceStatusCode: data.finalDeviceStatusCode as any,
        updatedAt: new Date(),
      }).where(eq(maintenanceRecords.id, task.resultRecordId!));

      // Close the task
      await tx.update(maintenanceTasks).set({
        statusCode: 'closed',
        updatedAt: new Date(),
        updatedByUserId: user.id,
      }).where(eq(maintenanceTasks.id, taskId));

      // Update the device status
      await tx.update(devices).set({
        currentStatusCode: data.finalDeviceStatusCode as any,
        lastMaintenanceCompletedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(devices.id, task.deviceId));

      // If this task is linked to a PM occurrence, update the plan's next due date
      if (task.maintenanceScheduleOccurrenceId) {
        const occurrence = await db.query.maintenanceScheduleOccurrences.findFirst({
          where: eq(maintenanceScheduleOccurrences.id, task.maintenanceScheduleOccurrenceId),
          with: { maintenancePlan: true },
        });

        if (occurrence) {
          await tx.update(maintenanceScheduleOccurrences).set({
            dueState: 'completed',
            qualifyingRecordId: task.resultRecordId,
          }).where(eq(maintenanceScheduleOccurrences.id, occurrence.id));

          if (occurrence.maintenancePlan && occurrence.maintenancePlan.calculationMethod === 'completion_based') {
            const plan = occurrence.maintenancePlan;
            const nextDate = new Date();
            if (plan.frequencyUnit === 'days') nextDate.setDate(nextDate.getDate() + plan.frequencyInterval);
            else if (plan.frequencyUnit === 'weeks') nextDate.setDate(nextDate.getDate() + (plan.frequencyInterval * 7));
            else if (plan.frequencyUnit === 'months') nextDate.setMonth(nextDate.getMonth() + plan.frequencyInterval);
            else if (plan.frequencyUnit === 'years') nextDate.setFullYear(nextDate.getFullYear() + plan.frequencyInterval);

            await tx.update(maintenancePlans).set({
              nextDueDate: nextDate,
              lastQualifyingRecordId: task.resultRecordId,
              updatedAt: new Date(),
            }).where(eq(maintenancePlans.id, plan.id));
          }
        }
      }

      // Audit log
      await createAuditLog(tx, {
        actionType: 'SIGN',
        entityType: 'MAINTENANCE_RECORD',
        entityId: task.resultRecordId!,
        organizationId: task.organizationId,
        actorUserId: user.id,
        newState: { purpose: 'release', finalDeviceStatus: data.finalDeviceStatusCode, signatureId: signature.id },
      });
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get all signatures for a maintenance record.
 */
export async function getRecordSignatures(recordId: string) {
  const user = await requireAuth();

  try {
    const record = await db.query.maintenanceRecords.findFirst({
      where: eq(maintenanceRecords.id, recordId),
    });
    if (!record) return { success: false, error: 'Record not found' };
    await requireScope({ organizationId: record.organizationId });

    const versions = await db.query.recordVersions.findMany({
      where: and(
        eq(recordVersions.entityId, recordId),
        eq(recordVersions.entityType, 'maintenance_record')
      ),
    });

    const signatures = await db.query.electronicSignatures.findMany({
      where: and(
        eq(electronicSignatures.entityId, recordId),
        eq(electronicSignatures.entityType, 'maintenance_record')
      ),
    });

    return { success: true, data: { versions, signatures } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
