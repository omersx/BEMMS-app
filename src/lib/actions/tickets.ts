'use server';

import { db } from '@/lib/db';
import {
  serviceTickets, serviceTicketComments, serviceTicketEvents, devices,
  recordVersions, electronicSignatures, signatureEvents, deviceStatusHistory,
} from '@/lib/db/schema';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit';
import {
  createTicketSchema, triageTicketSchema, assignTicketSchema,
  resolveTicketSchema, closeTicketSchema, cancelTicketSchema,
  reopenTicketSchema, createTicketCommentSchema, acceptTicketSchema,
  updateTicketDeviceStatusSchema, RESOLUTION_DEVICE_STATUSES,
} from '@/lib/validators/tickets';
import { eq, and, or, desc, ilike, notInArray, inArray } from 'drizzle-orm';
import { verifySignatureAuth, createSignatureEvent } from './signature-auth';
import { getAttestationText } from '@/lib/utils/attestations';
import { buildCanonicalSnapshot, computeSHA256 } from '@/lib/utils/crypto';

// ── Ticket Number Generation ────────────────────────────────────────────────────

function generateTicketNumber(): string {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const seq = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
  return `TCK-${ym}-${seq}`;
}

// ── Create Ticket ───────────────────────────────────────────────────────────────

export async function createTicket(input: unknown) {
  const session = await requireAuth();
  const validated = createTicketSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    // Build device snapshot if deviceId provided
    let device: any = null;
    let deviceSnapshot: any = null;
    let locationSnapshot: any = null;
    if (validated.data.deviceId) {
      device = await db.query.devices.findFirst({
        where: eq(devices.id, validated.data.deviceId),
        with: { hospital: true, department: true, location: true, deviceCategory: true, manufacturer: true },
      });
      if (device) {
        deviceSnapshot = {
          name: device.name,
          assetNumber: device.assetNumber,
          serialNumber: device.serialNumber,
          internalCode: device.internalCode,
          currentStatusCode: device.currentStatusCode,
          category: (device as any).deviceCategory?.name,
          manufacturer: (device as any).manufacturer?.name,
        };
        locationSnapshot = {
          hospital: (device as any).hospital?.name,
          department: (device as any).department?.name,
          location: (device as any).location?.name,
        };
      }
    }

    return await db.transaction(async (tx) => {
      const ticketNumber = generateTicketNumber();

      const [ticket] = await tx.insert(serviceTickets).values({
        ticketNumber,
        organizationId: validated.data.organizationId,
        deviceId: validated.data.deviceId || null,
        hospitalId: validated.data.hospitalId,
        departmentId: validated.data.departmentId,
        locationId: validated.data.locationId || null,
        source: validated.data.source,
        ticketType: validated.data.ticketType,
        title: validated.data.title,
        description: validated.data.description,
        reportedImpact: validated.data.reportedImpact,
        reportedProblemCategory: validated.data.reportedProblemCategory || null,
        reportedLocationCorrection: validated.data.reportedLocationCorrection || null,
        requesterContactName: validated.data.requesterContactName || null,
        requesterContactPhone: validated.data.requesterContactPhone || null,
        reportedByUserId: session.id,
        statusCode: 'new',
        priorityCode: validated.data.reportedImpact === 'patient_care_affected' ? 'p1_critical' : 'p3_normal',
        deviceSnapshot,
        locationSnapshot,
      }).returning();

      // Automatically update device status if issue is reported on operational equipment
      if (validated.data.deviceId && device) {
        let newDeviceStatus: string | null = null;
        if (['patient_care_affected', 'device_not_usable'].includes(validated.data.reportedImpact)) {
          newDeviceStatus = 'under_repair';
        } else if (validated.data.reportedImpact === 'device_usable') {
          newDeviceStatus = 'operational_with_limitations';
        }

        if (newDeviceStatus && ['operational', 'standby'].includes(device.currentStatusCode)) {
          await tx.update(devices)
            .set({
              currentStatusCode: newDeviceStatus as any,
              statusChangedAt: new Date(),
              statusChangedByUserId: session.id,
              updatedAt: new Date(),
            })
            .where(eq(devices.id, validated.data.deviceId));

          await tx.insert(deviceStatusHistory).values({
            organizationId: validated.data.organizationId,
            deviceId: validated.data.deviceId,
            previousStatusCode: device.currentStatusCode,
            newStatusCode: newDeviceStatus,
            reason: `Problem Ticket ${ticketNumber} reported: ${validated.data.title}`,
            notes: `Reported impact: ${validated.data.reportedImpact}. ${validated.data.description.substring(0, 200)}`,
            effectiveAt: new Date(),
            changedByUserId: session.id,
            relatedTicketId: ticket.id,
          });
        }
      }

      // Create initial timeline event
      await tx.insert(serviceTicketEvents).values({
        serviceTicketId: ticket.id,
        eventType: 'created',
        newValueJsonb: { ticketNumber, source: validated.data.source, impact: validated.data.reportedImpact },
        visibility: 'public',
        actorUserId: session.id,
      });

      await createAuditLog(tx, {
        action: 'CREATE', entityType: 'service_ticket', entityId: ticket.id,
        actorId: session.id, details: { ticketNumber, deviceId: validated.data.deviceId, source: validated.data.source },
      });

      return { success: true, data: ticket };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Get Ticket By ID ────────────────────────────────────────────────────────────

export async function getTicketById(id: string) {
  await requireAuth();
  try {
    const data = await db.query.serviceTickets.findFirst({
      where: eq(serviceTickets.id, id),
      with: {
        device: true,
        hospital: true,
        department: true,
        location: true,
        reportedByUser: true,
        triagedByUser: true,
        assignedEngineer: true,
        resolvedByUser: true,
        closedByUser: true,
      },
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── List Tickets ────────────────────────────────────────────────────────────────

export async function listTickets(filters?: {
  search?: string;
  organizationId?: string;
  hospitalId?: string;
  departmentId?: string;
  statusCode?: string;
  priorityCode?: string;
  assignedEngineerUserId?: string;
  reportedByUserId?: string;
  deviceId?: string;
  page?: number;
  pageSize?: number;
}) {
  await requireAuth();
  try {
    const conditions: any[] = [];
    if (filters?.organizationId) conditions.push(eq(serviceTickets.organizationId, filters.organizationId));
    if (filters?.hospitalId) conditions.push(eq(serviceTickets.hospitalId, filters.hospitalId));
    if (filters?.departmentId) conditions.push(eq(serviceTickets.departmentId, filters.departmentId));
    if (filters?.statusCode) conditions.push(eq(serviceTickets.statusCode, filters.statusCode as any));
    if (filters?.priorityCode) conditions.push(eq(serviceTickets.priorityCode, filters.priorityCode as any));
    if (filters?.assignedEngineerUserId) conditions.push(eq(serviceTickets.assignedEngineerUserId, filters.assignedEngineerUserId));
    if (filters?.reportedByUserId) conditions.push(eq(serviceTickets.reportedByUserId, filters.reportedByUserId));
    if (filters?.deviceId) conditions.push(eq(serviceTickets.deviceId, filters.deviceId));
    if (filters?.search) {
      conditions.push(
        or(
          ilike(serviceTickets.title, `%${filters.search}%`),
          ilike(serviceTickets.ticketNumber, `%${filters.search}%`),
          ilike(serviceTickets.description, `%${filters.search}%`),
        )
      );
    }

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 25;
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.query.serviceTickets.findMany({
      where: whereClause,
      with: {
        device: true,
        hospital: true,
        department: true,
        reportedByUser: true,
        assignedEngineer: true,
      },
      orderBy: [desc(serviceTickets.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Triage Queue ────────────────────────────────────────────────────────────────

export async function getTriageQueue(filters?: {
  organizationId?: string;
  hospitalId?: string;
}) {
  await requireAuth();
  await requireRole('SYS_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG');
  try {
    const conditions: any[] = [
      or(
        eq(serviceTickets.statusCode, 'new'),
        eq(serviceTickets.statusCode, 'acknowledged'),
        eq(serviceTickets.statusCode, 'in_triage'),
      ),
    ];
    if (filters?.organizationId) conditions.push(eq(serviceTickets.organizationId, filters.organizationId));
    if (filters?.hospitalId) conditions.push(eq(serviceTickets.hospitalId, filters.hospitalId));

    const data = await db.query.serviceTickets.findMany({
      where: and(...conditions),
      with: {
        device: true,
        hospital: true,
        department: true,
        reportedByUser: true,
        assignedEngineer: true,
      },
      orderBy: [desc(serviceTickets.priorityCode), desc(serviceTickets.createdAt)],
    });

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Triage Ticket ───────────────────────────────────────────────────────────────

export async function triageTicket(ticketId: string, input: unknown) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG');
  const validated = triageTicketSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    const ticket = await db.query.serviceTickets.findFirst({ where: eq(serviceTickets.id, ticketId) });
    if (!ticket) return { success: false, error: 'Ticket not found' };

    return await db.transaction(async (tx) => {
      // If an engineer is assigned, triage is complete → advance to in_progress
      // Otherwise, mark as in_triage (awaiting assignment)
      const newStatus = validated.data.assignedEngineerUserId ? 'in_progress' : 'in_triage';

      const updateData: any = {
        priorityCode: validated.data.priorityCode,
        priorityReason: validated.data.priorityReason || null,
        selectedMaintenanceType: validated.data.selectedMaintenanceType || null,
        selectedTechnicalCategory: validated.data.selectedTechnicalCategory || null,
        internalTriageNote: validated.data.internalTriageNote || null,
        triagedByUserId: session.id,
        triagedAt: new Date(),
        statusCode: newStatus as any,
        updatedAt: new Date(),
      };

      if (validated.data.assignedEngineerUserId) {
        updateData.assignedEngineerUserId = validated.data.assignedEngineerUserId;
        updateData.assignedAt = new Date();
      }

      const [updated] = await tx.update(serviceTickets)
        .set(updateData)
        .where(eq(serviceTickets.id, ticketId))
        .returning();

      await tx.insert(serviceTicketEvents).values({
        serviceTicketId: ticketId,
        eventType: 'triaged',
        previousValueJsonb: { statusCode: ticket.statusCode, priorityCode: ticket.priorityCode },
        newValueJsonb: {
          statusCode: newStatus,
          priorityCode: validated.data.priorityCode,
          maintenanceType: validated.data.selectedMaintenanceType,
          assignedEngineer: validated.data.assignedEngineerUserId || null,
        },
        visibility: 'internal',
        actorUserId: session.id,
      });

      await createAuditLog(tx, {
        action: 'UPDATE', entityType: 'service_ticket', entityId: ticketId,
        actorId: session.id, details: { action: 'triage', newStatus, ...validated.data },
      });

      return { success: true, data: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Assign Ticket ───────────────────────────────────────────────────────────────

export async function assignTicket(ticketId: string, input: unknown) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG');
  const validated = assignTicketSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    const ticket = await db.query.serviceTickets.findFirst({ where: eq(serviceTickets.id, ticketId) });
    if (!ticket) return { success: false, error: 'Ticket not found' };

    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(serviceTickets)
        .set({
          assignedEngineerUserId: validated.data.assignedEngineerUserId,
          assignedTeamId: validated.data.assignedTeamId || null,
          assignedAt: new Date(),
          statusCode: 'in_progress',
          updatedAt: new Date(),
        })
        .where(eq(serviceTickets.id, ticketId))
        .returning();

      await tx.insert(serviceTicketEvents).values({
        serviceTicketId: ticketId,
        eventType: ticket.assignedEngineerUserId ? 'reassigned' : 'assigned',
        previousValueJsonb: { assignedEngineerUserId: ticket.assignedEngineerUserId },
        newValueJsonb: { assignedEngineerUserId: validated.data.assignedEngineerUserId },
        reason: validated.data.handoffNote,
        visibility: 'internal',
        actorUserId: session.id,
      });

      await createAuditLog(tx, {
        action: 'UPDATE', entityType: 'service_ticket', entityId: ticketId,
        actorId: session.id, details: { action: 'assign', ...validated.data },
      });

      return { success: true, data: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Accept Ticket (with Electronic Signature) ───────────────────────────────────

export async function acceptTicket(ticketId: string, input: unknown) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG', 'BIOMED_TECH');
  const validated = acceptTicketSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    const ticket = await db.query.serviceTickets.findFirst({ where: eq(serviceTickets.id, ticketId) });
    if (!ticket) return { success: false, error: 'Ticket not found' };
    if (['resolved', 'closed', 'cancelled'].includes(ticket.statusCode)) {
      return { success: false, error: `Cannot accept ticket in '${ticket.statusCode}' status` };
    }

    // Verify password for electronic signature
    const authResult = await verifySignatureAuth(session.id, validated.data.signaturePassword);
    if (!authResult.success) {
      return { success: false, error: authResult.error };
    }

    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(serviceTickets)
        .set({
          statusCode: 'in_progress',
          assignedEngineerUserId: ticket.assignedEngineerUserId || session.id,
          acceptedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(serviceTickets.id, ticketId))
        .returning();

      // If device linked, update status to under_maintenance if operational
      if (ticket.deviceId) {
        const dev = await tx.query.devices.findFirst({ where: eq(devices.id, ticket.deviceId) });
        if (dev && dev.currentStatusCode === 'operational') {
          await tx.update(devices)
            .set({
              currentStatusCode: 'under_maintenance',
              statusChangedAt: new Date(),
              statusChangedByUserId: session.id,
              updatedAt: new Date(),
            })
            .where(eq(devices.id, ticket.deviceId));
        }
      }

      // Record Version + Electronic Signature + Hash Chain
      const prevVersions = await tx.query.recordVersions.findMany({
        where: and(
          eq(recordVersions.entityType, 'ticket_resolution'),
          eq(recordVersions.entityId, ticketId),
        ),
      });
      const versionNumber = prevVersions.length + 1;

      const snapshotData = {
        ticketId,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        action: 'accept',
        acceptedByUserId: session.id,
        acceptedAt: new Date().toISOString(),
      };
      const canonicalJson = buildCanonicalSnapshot(snapshotData as any);
      const contentHash = computeSHA256(canonicalJson);

      const [version] = await tx.insert(recordVersions).values({
        organizationId: ticket.organizationId,
        entityType: 'ticket_resolution',
        entityId: ticketId,
        versionNumber,
        canonicalSnapshotJsonb: snapshotData,
        contentHashSha256: contentHash,
        createdByUserId: session.id,
      }).returning();

      const [sig] = await tx.insert(electronicSignatures).values({
        organizationId: ticket.organizationId,
        recordVersionId: version.id,
        entityType: 'ticket_resolution',
        entityId: ticketId,
        signaturePurpose: 'accept',
        signerUserId: session.id,
        signerNameSnapshot: session.fullName || session.email || 'Biomedical Engineer',
        signerRoleSnapshot: session.roles?.join(', ') || 'BIOMED_ENG',
        attestationTextVersion: getAttestationText('accept'),
        authMethod: 'password_reauth',
        signedAt: new Date(),
        signedContentHashSha256: contentHash,
        comments: validated.data.signatureComments || null,
      }).returning();

      await createSignatureEvent(tx, {
        signatureId: sig.id,
        eventType: 'created',
        actorUserId: session.id,
        organizationId: ticket.organizationId,
        newStatus: 'active',
      });

      await tx.insert(serviceTicketEvents).values({
        serviceTicketId: ticketId,
        eventType: 'accepted',
        previousValueJsonb: { statusCode: ticket.statusCode },
        newValueJsonb: {
          statusCode: 'in_progress',
          signatureId: sig.id,
          contentHash: sig.signedContentHashSha256,
        },
        reason: 'Engineer accepted work on ticket and signed electronically',
        visibility: 'public',
        actorUserId: session.id,
      });

      await createAuditLog(tx, {
        action: 'UPDATE', entityType: 'service_ticket', entityId: ticketId,
        actorId: session.id, details: { action: 'accept', signatureId: sig.id },
      });

      return { success: true, data: updated, signature: sig };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Resolve Ticket ──────────────────────────────────────────────────────────────

export async function resolveTicket(ticketId: string, input: unknown) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG');
  const validated = resolveTicketSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    const ticket = await db.query.serviceTickets.findFirst({ where: eq(serviceTickets.id, ticketId) });
    if (!ticket) return { success: false, error: 'Ticket not found' };
    if (!['in_progress', 'in_triage', 'waiting_parts_vendor'].includes(ticket.statusCode)) {
      return { success: false, error: `Cannot resolve ticket in '${ticket.statusCode}' status` };
    }

    // Validate that finalDeviceStatusCode represents a legitimate resolution outcome
    if (!RESOLUTION_DEVICE_STATUSES.includes(validated.data.finalDeviceStatusCode as any)) {
      return {
        success: false,
        error: `Cannot resolve ticket with device status '${validated.data.finalDeviceStatusCode}'. A ticket can only be resolved when work is complete or device is retired. Use 'Update Status' to track ongoing repair work.`,
      };
    }

    // Verify signature password if provided
    if (validated.data.signaturePassword) {
      const authResult = await verifySignatureAuth(session.id, validated.data.signaturePassword);
      if (!authResult.success) {
        return { success: false, error: authResult.error };
      }
    }

    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(serviceTickets)
        .set({
          statusCode: 'resolved',
          resolutionSummary: validated.data.resolutionSummary,
          finalDeviceStatusCode: validated.data.finalDeviceStatusCode as any,
          waitingReason: null,
          waitingDependencyType: null,
          resolvedAt: new Date(),
          resolvedByUserId: session.id,
          updatedAt: new Date(),
        })
        .where(eq(serviceTickets.id, ticketId))
        .returning();

      // Update device status and audit history if device is linked
      if (ticket.deviceId) {
        const currentDev = await tx.query.devices.findFirst({ where: eq(devices.id, ticket.deviceId) });
        const prevStatusCode = currentDev?.currentStatusCode || 'under_repair';

        const limitationsNote = validated.data.finalDeviceStatusCode === 'operational_with_limitations'
          ? (validated.data.limitationsNote || validated.data.resolutionSummary)
          : null;

        await tx.update(devices)
          .set({
            currentStatusCode: validated.data.finalDeviceStatusCode as any,
            statusLimitationsNote: limitationsNote,
            statusChangedAt: new Date(),
            statusChangedByUserId: session.id,
            updatedAt: new Date(),
          })
          .where(eq(devices.id, ticket.deviceId));

        await tx.insert(deviceStatusHistory).values({
          organizationId: ticket.organizationId,
          deviceId: ticket.deviceId,
          previousStatusCode: prevStatusCode,
          newStatusCode: validated.data.finalDeviceStatusCode,
          reason: `Ticket ${ticket.ticketNumber} resolved: ${validated.data.resolutionSummary.substring(0, 100)}`,
          notes: limitationsNote ? `Limitations: ${limitationsNote} | Summary: ${validated.data.resolutionSummary}` : validated.data.resolutionSummary,
          effectiveAt: new Date(),
          changedByUserId: session.id,
          relatedTicketId: ticketId,
        });
      }

      // If signed with password: create record version + electronic signature + signature event
      let signatureRecord: any = null;
      if (validated.data.signaturePassword) {
        const prevVersions = await tx.query.recordVersions.findMany({
          where: and(
            eq(recordVersions.entityType, 'ticket_resolution'),
            eq(recordVersions.entityId, ticketId),
          ),
        });
        const versionNumber = prevVersions.length + 1;

        const snapshotData = {
          ticketId,
          ticketNumber: ticket.ticketNumber,
          title: ticket.title,
          description: ticket.description,
          deviceId: ticket.deviceId,
          action: 'resolve',
          resolutionSummary: validated.data.resolutionSummary,
          finalDeviceStatusCode: validated.data.finalDeviceStatusCode,
          resolvedByUserId: session.id,
          resolvedAt: new Date().toISOString(),
        };
        const canonicalJson = buildCanonicalSnapshot(snapshotData as any);
        const contentHash = computeSHA256(canonicalJson);

        const [version] = await tx.insert(recordVersions).values({
          organizationId: ticket.organizationId,
          entityType: 'ticket_resolution',
          entityId: ticketId,
          versionNumber,
          canonicalSnapshotJsonb: snapshotData,
          contentHashSha256: contentHash,
          createdByUserId: session.id,
        }).returning();

        const [sig] = await tx.insert(electronicSignatures).values({
          organizationId: ticket.organizationId,
          recordVersionId: version.id,
          entityType: 'ticket_resolution',
          entityId: ticketId,
          signaturePurpose: 'resolve',
          signerUserId: session.id,
          signerNameSnapshot: session.fullName || session.email || 'Biomedical Engineer',
          signerRoleSnapshot: session.roles?.join(', ') || 'BIOMED_ENG',
          attestationTextVersion: getAttestationText('resolve'),
          authMethod: 'password_reauth',
          signedAt: new Date(),
          signedContentHashSha256: contentHash,
          comments: validated.data.signatureComments || null,
        }).returning();
        signatureRecord = sig;

        await createSignatureEvent(tx, {
          signatureId: sig.id,
          eventType: 'created',
          actorUserId: session.id,
          organizationId: ticket.organizationId,
          newStatus: 'active',
        });
      }

      await tx.insert(serviceTicketEvents).values({
        serviceTicketId: ticketId,
        eventType: 'resolved',
        previousValueJsonb: { statusCode: ticket.statusCode },
        newValueJsonb: {
          statusCode: 'resolved',
          finalDeviceStatus: validated.data.finalDeviceStatusCode,
          signatureId: signatureRecord?.id || null,
          contentHash: signatureRecord?.signedContentHashSha256 || null,
        },
        reason: validated.data.resolutionSummary,
        visibility: 'public',
        actorUserId: session.id,
      });

      await createAuditLog(tx, {
        action: 'UPDATE', entityType: 'service_ticket', entityId: ticketId,
        actorId: session.id, details: { action: 'resolve', signed: !!signatureRecord, ...validated.data },
      });

      return { success: true, data: updated, signature: signatureRecord };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Close Ticket ────────────────────────────────────────────────────────────────

export async function closeTicket(ticketId: string, input: unknown) {
  const session = await requireAuth();
  const validated = closeTicketSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    const ticket = await db.query.serviceTickets.findFirst({ where: eq(serviceTickets.id, ticketId) });
    if (!ticket) return { success: false, error: 'Ticket not found' };
    if (ticket.statusCode !== 'resolved') {
      return { success: false, error: 'Ticket must be resolved before closing' };
    }

    // Verify signature password if provided
    if (validated.data.signaturePassword) {
      const authResult = await verifySignatureAuth(session.id, validated.data.signaturePassword);
      if (!authResult.success) {
        return { success: false, error: authResult.error };
      }
    }

    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(serviceTickets)
        .set({
          statusCode: 'closed',
          closedAt: new Date(),
          closedByUserId: session.id,
          closureReason: validated.data.closureReason || null,
          updatedAt: new Date(),
        })
        .where(eq(serviceTickets.id, ticketId))
        .returning();

      let signatureRecord: any = null;
      if (validated.data.signaturePassword) {
        const prevVersions = await tx.query.recordVersions.findMany({
          where: and(
            eq(recordVersions.entityType, 'ticket_resolution'),
            eq(recordVersions.entityId, ticketId),
          ),
        });
        const versionNumber = prevVersions.length + 1;

        const snapshotData = {
          ticketId,
          ticketNumber: ticket.ticketNumber,
          title: ticket.title,
          description: ticket.description,
          action: 'close',
          closureReason: validated.data.closureReason || null,
          closedByUserId: session.id,
          closedAt: new Date().toISOString(),
        };
        const canonicalJson = buildCanonicalSnapshot(snapshotData as any);
        const contentHash = computeSHA256(canonicalJson);

        const [version] = await tx.insert(recordVersions).values({
          organizationId: ticket.organizationId,
          entityType: 'ticket_resolution',
          entityId: ticketId,
          versionNumber,
          canonicalSnapshotJsonb: snapshotData,
          contentHashSha256: contentHash,
          createdByUserId: session.id,
        }).returning();

        const [sig] = await tx.insert(electronicSignatures).values({
          organizationId: ticket.organizationId,
          recordVersionId: version.id,
          entityType: 'ticket_resolution',
          entityId: ticketId,
          signaturePurpose: 'close',
          signerUserId: session.id,
          signerNameSnapshot: session.fullName || session.email || 'System User',
          signerRoleSnapshot: session.roles?.join(', ') || 'STAFF',
          attestationTextVersion: getAttestationText('close'),
          authMethod: 'password_reauth',
          signedAt: new Date(),
          signedContentHashSha256: contentHash,
          comments: validated.data.signatureComments || null,
        }).returning();
        signatureRecord = sig;

        await createSignatureEvent(tx, {
          signatureId: sig.id,
          eventType: 'created',
          actorUserId: session.id,
          organizationId: ticket.organizationId,
          newStatus: 'active',
        });
      }

      await tx.insert(serviceTicketEvents).values({
        serviceTicketId: ticketId,
        eventType: 'closed',
        previousValueJsonb: { statusCode: 'resolved' },
        newValueJsonb: {
          statusCode: 'closed',
          signatureId: signatureRecord?.id || null,
          contentHash: signatureRecord?.signedContentHashSha256 || null,
        },
        reason: validated.data.closureReason,
        visibility: 'public',
        actorUserId: session.id,
      });

      await createAuditLog(tx, {
        action: 'UPDATE', entityType: 'service_ticket', entityId: ticketId,
        actorId: session.id, details: { action: 'close', signed: !!signatureRecord },
      });

      return { success: true, data: updated, signature: signatureRecord };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Cancel Ticket ───────────────────────────────────────────────────────────────

export async function cancelTicket(ticketId: string, input: unknown) {
  const session = await requireAuth();
  const validated = cancelTicketSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    const ticket = await db.query.serviceTickets.findFirst({ where: eq(serviceTickets.id, ticketId) });
    if (!ticket) return { success: false, error: 'Ticket not found' };
    const cancellableStatuses = ['new', 'acknowledged', 'in_triage', 'waiting_requester'];
    if (!cancellableStatuses.includes(ticket.statusCode)) {
      return { success: false, error: `Cannot cancel ticket in '${ticket.statusCode}' status` };
    }

    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(serviceTickets)
        .set({
          statusCode: 'cancelled',
          cancelledAt: new Date(),
          cancelledByUserId: session.id,
          cancellationReason: validated.data.cancellationReason,
          updatedAt: new Date(),
        })
        .where(eq(serviceTickets.id, ticketId))
        .returning();

      await tx.insert(serviceTicketEvents).values({
        serviceTicketId: ticketId,
        eventType: 'cancelled',
        previousValueJsonb: { statusCode: ticket.statusCode },
        newValueJsonb: { statusCode: 'cancelled' },
        reason: validated.data.cancellationReason,
        visibility: 'public',
        actorUserId: session.id,
      });

      await createAuditLog(tx, {
        action: 'DEACTIVATE', entityType: 'service_ticket', entityId: ticketId,
        actorId: session.id, details: { action: 'cancel', reason: validated.data.cancellationReason },
      });

      return { success: true, data: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Reopen Ticket ───────────────────────────────────────────────────────────────

export async function reopenTicket(ticketId: string, input: unknown) {
  const session = await requireAuth();
  const validated = reopenTicketSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    const ticket = await db.query.serviceTickets.findFirst({ where: eq(serviceTickets.id, ticketId) });
    if (!ticket) return { success: false, error: 'Ticket not found' };
    if (!['resolved', 'closed', 'cancelled'].includes(ticket.statusCode)) {
      return { success: false, error: `Cannot reopen ticket in '${ticket.statusCode}' status` };
    }

    return await db.transaction(async (tx) => {
      // Determine next status: if assigned to an engineer, resume work in_progress; otherwise back to in_triage
      const nextStatus = ticket.assignedEngineerUserId ? 'in_progress' : 'in_triage';

      const [updated] = await tx.update(serviceTickets)
        .set({
          statusCode: nextStatus as any,
          reopenedAt: new Date(),
          reopenedByUserId: session.id,
          reopenReason: validated.data.reopenReason,
          resolvedAt: null,
          resolvedByUserId: null,
          resolutionSummary: null,
          finalDeviceStatusCode: null,
          closedAt: null,
          closedByUserId: null,
          closureReason: null,
          cancelledAt: null,
          cancelledByUserId: null,
          cancellationReason: null,
          updatedAt: new Date(),
        })
        .where(eq(serviceTickets.id, ticketId))
        .returning();

      // If linked to a device, restore device to under_repair and audit
      if (ticket.deviceId) {
        const currentDev = await tx.query.devices.findFirst({ where: eq(devices.id, ticket.deviceId) });
        const prevStatusCode = currentDev?.currentStatusCode || 'operational';

        await tx.update(devices)
          .set({
            currentStatusCode: 'under_repair',
            statusChangedAt: new Date(),
            statusChangedByUserId: session.id,
            updatedAt: new Date(),
          })
          .where(eq(devices.id, ticket.deviceId));

        await tx.insert(deviceStatusHistory).values({
          organizationId: ticket.organizationId,
          deviceId: ticket.deviceId,
          previousStatusCode: prevStatusCode,
          newStatusCode: 'under_repair',
          reason: `Ticket ${ticket.ticketNumber} reopened: ${validated.data.reopenReason}`,
          notes: `Reopened by ${session.fullName || session.email}. Resuming repair work.`,
          effectiveAt: new Date(),
          changedByUserId: session.id,
          relatedTicketId: ticketId,
        });
      }

      await tx.insert(serviceTicketEvents).values({
        serviceTicketId: ticketId,
        eventType: 'reopened',
        previousValueJsonb: { statusCode: ticket.statusCode },
        newValueJsonb: { statusCode: nextStatus },
        reason: validated.data.reopenReason,
        visibility: 'public',
        actorUserId: session.id,
      });

      await createAuditLog(tx, {
        action: 'UPDATE', entityType: 'service_ticket', entityId: ticketId,
        actorId: session.id, details: { action: 'reopen', nextStatus, reason: validated.data.reopenReason },
      });

      return { success: true, data: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Update Ticket Device Status (Interim Progress) ──────────────────────────────

export async function updateTicketDeviceStatus(ticketId: string, input: unknown) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG', 'BIOMED_TECH');
  const validated = updateTicketDeviceStatusSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    const ticket = await db.query.serviceTickets.findFirst({ where: eq(serviceTickets.id, ticketId) });
    if (!ticket) return { success: false, error: 'Ticket not found' };

    return await db.transaction(async (tx) => {
      let prevDeviceStatus = 'unknown';
      const isWaitingForParts = validated.data.deviceStatusCode === 'waiting_for_parts';
      const reasonText = validated.data.partName
        ? `Waiting for spare parts: ${validated.data.partName}`
        : validated.data.notes;

      // Update linked device if present
      if (ticket.deviceId) {
        const dev = await tx.query.devices.findFirst({ where: eq(devices.id, ticket.deviceId) });
        prevDeviceStatus = dev?.currentStatusCode || 'unknown';

        const limitationsNote = validated.data.deviceStatusCode === 'operational_with_limitations'
          ? (validated.data.limitationsNote || validated.data.notes)
          : null;

        await tx.update(devices)
          .set({
            currentStatusCode: validated.data.deviceStatusCode as any,
            statusLimitationsNote: limitationsNote,
            statusChangedAt: new Date(),
            statusChangedByUserId: session.id,
            updatedAt: new Date(),
          })
          .where(eq(devices.id, ticket.deviceId));

        await tx.insert(deviceStatusHistory).values({
          organizationId: ticket.organizationId,
          deviceId: ticket.deviceId,
          previousStatusCode: prevDeviceStatus,
          newStatusCode: validated.data.deviceStatusCode,
          reason: `Ticket ${ticket.ticketNumber} status update: ${reasonText.substring(0, 100)}`,
          notes: limitationsNote
            ? `Limitations: ${limitationsNote} | Note: ${validated.data.notes}`
            : (validated.data.supplierDetails
              ? `${validated.data.notes} | Supplier/PO: ${validated.data.supplierDetails}`
              : validated.data.notes),
          effectiveAt: new Date(),
          changedByUserId: session.id,
          relatedTicketId: ticketId,
        });
      }

      // If waiting_for_parts, update ticket statusCode to waiting_parts_vendor and save waiting details
      // If moving out of waiting_parts_vendor, restore ticket statusCode to in_progress
      const ticketUpdateData: any = { updatedAt: new Date() };
      let newTicketStatus = ticket.statusCode;

      if (isWaitingForParts) {
        newTicketStatus = 'waiting_parts_vendor';
        ticketUpdateData.statusCode = 'waiting_parts_vendor';
        ticketUpdateData.waitingReason = validated.data.partName || validated.data.notes;
        ticketUpdateData.waitingDependencyType = validated.data.supplierDetails || null;
      } else if (ticket.statusCode === 'waiting_parts_vendor') {
        newTicketStatus = 'in_progress';
        ticketUpdateData.statusCode = 'in_progress';
        ticketUpdateData.waitingReason = null;
        ticketUpdateData.waitingDependencyType = null;
      }

      // Add timeline event to ticket
      await tx.insert(serviceTicketEvents).values({
        serviceTicketId: ticketId,
        eventType: 'status_changed',
        previousValueJsonb: {
          deviceStatusCode: prevDeviceStatus,
          ticketStatusCode: ticket.statusCode,
        },
        newValueJsonb: {
          deviceStatusCode: validated.data.deviceStatusCode,
          ticketStatusCode: newTicketStatus,
          notes: validated.data.notes,
          partName: validated.data.partName || null,
          supplierDetails: validated.data.supplierDetails || null,
        },
        reason: reasonText,
        visibility: 'public',
        actorUserId: session.id,
      });

      const [updated] = await tx.update(serviceTickets)
        .set(ticketUpdateData)
        .where(eq(serviceTickets.id, ticketId))
        .returning();

      await createAuditLog(tx, {
        action: 'UPDATE', entityType: 'service_ticket', entityId: ticketId,
        actorId: session.id,
        details: { action: 'update_device_status', ...validated.data },
      });

      return { success: true, data: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Add Comment ─────────────────────────────────────────────────────────────────

export async function addTicketComment(ticketId: string, input: unknown) {
  const session = await requireAuth();
  const validated = createTicketCommentSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    const [comment] = await db.insert(serviceTicketComments).values({
      serviceTicketId: ticketId,
      authorUserId: session.id,
      visibility: validated.data.visibility,
      body: validated.data.body,
    }).returning();

    return { success: true, data: comment };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Get Ticket Comments ─────────────────────────────────────────────────────────

export async function getTicketComments(ticketId: string) {
  await requireAuth();
  try {
    const data = await db.query.serviceTicketComments.findMany({
      where: eq(serviceTicketComments.serviceTicketId, ticketId),
      with: { author: true },
      orderBy: [desc(serviceTicketComments.createdAt)],
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Get Ticket Timeline ─────────────────────────────────────────────────────────

export async function getTicketTimeline(ticketId: string) {
  await requireAuth();
  try {
    const data = await db.query.serviceTicketEvents.findMany({
      where: eq(serviceTicketEvents.serviceTicketId, ticketId),
      with: { actor: true },
      orderBy: [desc(serviceTicketEvents.createdAt)],
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Get Active Tickets for Device (duplicate check) ─────────────────────────────

export async function getDeviceActiveTickets(deviceId: string) {
  await requireAuth();
  try {
    const data = await db.query.serviceTickets.findMany({
      where: and(
        eq(serviceTickets.deviceId, deviceId),
        notInArray(serviceTickets.statusCode, ['closed', 'cancelled']),
      ),
      with: { reportedByUser: true },
      orderBy: [desc(serviceTickets.createdAt)],
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Get Full Ticket History for Device ──────────────────────────────────────────

export async function getDeviceTicketHistory(deviceId: string) {
  await requireAuth();
  try {
    const data = await db.query.serviceTickets.findMany({
      where: eq(serviceTickets.deviceId, deviceId),
      with: {
        reportedByUser: true,
        assignedEngineer: true,
      },
      orderBy: [desc(serviceTickets.createdAt)],
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Get Electronic Signatures for Ticket ────────────────────────────────────────

export async function getTicketSignatures(ticketId: string) {
  await requireAuth();
  try {
    const signatures = await db.query.electronicSignatures.findMany({
      where: and(
        eq(electronicSignatures.entityType, 'ticket_resolution'),
        eq(electronicSignatures.entityId, ticketId),
      ),
      with: {
        signerUser: true,
      },
      orderBy: [desc(electronicSignatures.signedAt)],
    });

    const sigIds = signatures.map((s) => s.id);
    let events: any[] = [];
    if (sigIds.length > 0) {
      events = await db.query.signatureEvents.findMany({
        where: inArray(signatureEvents.signatureId, sigIds),
        orderBy: [desc(signatureEvents.timestamp)],
      });
    }

    return { success: true, data: { signatures, events } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Hold Ticket for Spare Parts ─────────────────────────────────────────────────

export async function holdTicketForParts(ticketId: string, input: { waitingReason: string; partDescription?: string }) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG', 'BIOMED_TECH');

  if (!input.waitingReason?.trim()) {
    return { success: false, error: 'Reason for waiting on spare parts is required' };
  }

  try {
    const ticket = await db.query.serviceTickets.findFirst({ where: eq(serviceTickets.id, ticketId) });
    if (!ticket) return { success: false, error: 'Ticket not found' };
    if (ticket.statusCode !== 'in_progress') {
      return { success: false, error: 'Ticket must be in progress to put on hold for parts' };
    }

    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(serviceTickets)
        .set({
          statusCode: 'waiting_parts_vendor',
          waitingReason: input.waitingReason.trim(),
          waitingDependencyType: 'parts_vendor',
          updatedAt: new Date(),
        })
        .where(eq(serviceTickets.id, ticketId))
        .returning();

      // If device linked, update status to waiting_for_parts
      if (ticket.deviceId) {
        const currentDev = await tx.query.devices.findFirst({ where: eq(devices.id, ticket.deviceId) });
        await tx.update(devices)
          .set({
            currentStatusCode: 'waiting_for_parts',
            statusChangedAt: new Date(),
            statusChangedByUserId: session.id,
            updatedAt: new Date(),
          })
          .where(eq(devices.id, ticket.deviceId));

        await tx.insert(deviceStatusHistory).values({
          organizationId: ticket.organizationId,
          deviceId: ticket.deviceId,
          previousStatusCode: currentDev?.currentStatusCode || 'under_repair',
          newStatusCode: 'waiting_for_parts',
          reason: `Ticket ${ticket.ticketNumber} on hold: waiting for spare parts (${input.waitingReason.trim()})`,
          notes: input.partDescription ? `Part details: ${input.partDescription}` : null,
          effectiveAt: new Date(),
          changedByUserId: session.id,
          relatedTicketId: ticketId,
        });
      }

      await tx.insert(serviceTicketEvents).values({
        serviceTicketId: ticketId,
        eventType: 'status_changed',
        previousValueJsonb: { statusCode: 'in_progress' },
        newValueJsonb: { statusCode: 'waiting_parts_vendor', waitingReason: input.waitingReason.trim() },
        reason: input.waitingReason.trim(),
        visibility: 'public',
        actorUserId: session.id,
      });

      await createAuditLog(tx, {
        action: 'UPDATE', entityType: 'service_ticket', entityId: ticketId,
        actorId: session.id, details: { action: 'hold_for_parts', ...input },
      });

      return { success: true, data: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Resume Ticket Work (Parts Received) ─────────────────────────────────────────

export async function resumeTicketWork(ticketId: string) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG', 'BIOMED_TECH');

  try {
    const ticket = await db.query.serviceTickets.findFirst({ where: eq(serviceTickets.id, ticketId) });
    if (!ticket) return { success: false, error: 'Ticket not found' };
    if (!['waiting_parts_vendor', 'waiting_requester'].includes(ticket.statusCode)) {
      return { success: false, error: `Cannot resume ticket from '${ticket.statusCode}' status` };
    }

    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(serviceTickets)
        .set({
          statusCode: 'in_progress',
          waitingReason: null,
          waitingDependencyType: null,
          updatedAt: new Date(),
        })
        .where(eq(serviceTickets.id, ticketId))
        .returning();

      // If device linked, update status back to under_repair
      if (ticket.deviceId) {
        await tx.update(devices)
          .set({
            currentStatusCode: 'under_repair',
            statusChangedAt: new Date(),
            statusChangedByUserId: session.id,
            updatedAt: new Date(),
          })
          .where(eq(devices.id, ticket.deviceId));

        await tx.insert(deviceStatusHistory).values({
          organizationId: ticket.organizationId,
          deviceId: ticket.deviceId,
          previousStatusCode: 'waiting_for_parts',
          newStatusCode: 'under_repair',
          reason: `Ticket ${ticket.ticketNumber}: spare parts arrived, repair resumed`,
          effectiveAt: new Date(),
          changedByUserId: session.id,
          relatedTicketId: ticketId,
        });
      }

      await tx.insert(serviceTicketEvents).values({
        serviceTicketId: ticketId,
        eventType: 'status_changed',
        previousValueJsonb: { statusCode: ticket.statusCode },
        newValueJsonb: { statusCode: 'in_progress' },
        reason: 'Spare parts received / dependency cleared, repair work resumed',
        visibility: 'public',
        actorUserId: session.id,
      });

      await createAuditLog(tx, {
        action: 'UPDATE', entityType: 'service_ticket', entityId: ticketId,
        actorId: session.id, details: { action: 'resume_work' },
      });

      return { success: true, data: updated };
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}



