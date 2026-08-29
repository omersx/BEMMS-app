'use server';

import { db } from '@/lib/db';
import {
  serviceTickets, serviceTicketComments, serviceTicketEvents, devices,
} from '@/lib/db/schema';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit';
import {
  createTicketSchema, triageTicketSchema, assignTicketSchema,
  resolveTicketSchema, closeTicketSchema, cancelTicketSchema,
  reopenTicketSchema, createTicketCommentSchema,
} from '@/lib/validators/tickets';
import { eq, and, or, desc, ilike, notInArray } from 'drizzle-orm';

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
    let deviceSnapshot: any = null;
    let locationSnapshot: any = null;
    if (validated.data.deviceId) {
      const device = await db.query.devices.findFirst({
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
      const updateData: any = {
        priorityCode: validated.data.priorityCode,
        priorityReason: validated.data.priorityReason || null,
        selectedMaintenanceType: validated.data.selectedMaintenanceType || null,
        selectedTechnicalCategory: validated.data.selectedTechnicalCategory || null,
        internalTriageNote: validated.data.internalTriageNote || null,
        triagedByUserId: session.id,
        triagedAt: new Date(),
        statusCode: 'in_triage' as const,
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
          statusCode: 'in_triage',
          priorityCode: validated.data.priorityCode,
          maintenanceType: validated.data.selectedMaintenanceType,
        },
        visibility: 'internal',
        actorUserId: session.id,
      });

      await createAuditLog(tx, {
        action: 'UPDATE', entityType: 'service_ticket', entityId: ticketId,
        actorId: session.id, details: { action: 'triage', ...validated.data },
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

// ── Resolve Ticket ──────────────────────────────────────────────────────────────

export async function resolveTicket(ticketId: string, input: unknown) {
  const session = await requireAuth();
  await requireRole('SYS_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG');
  const validated = resolveTicketSchema.safeParse(input);
  if (!validated.success) return { success: false, error: validated.error.message };

  try {
    const ticket = await db.query.serviceTickets.findFirst({ where: eq(serviceTickets.id, ticketId) });
    if (!ticket) return { success: false, error: 'Ticket not found' };
    if (!['in_progress', 'in_triage'].includes(ticket.statusCode)) {
      return { success: false, error: `Cannot resolve ticket in '${ticket.statusCode}' status` };
    }

    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(serviceTickets)
        .set({
          statusCode: 'resolved',
          resolutionSummary: validated.data.resolutionSummary,
          finalDeviceStatusCode: validated.data.finalDeviceStatusCode as any,
          resolvedAt: new Date(),
          resolvedByUserId: session.id,
          updatedAt: new Date(),
        })
        .where(eq(serviceTickets.id, ticketId))
        .returning();

      // Update device status if device is linked
      if (ticket.deviceId) {
        await tx.update(devices)
          .set({
            currentStatusCode: validated.data.finalDeviceStatusCode as any,
            statusChangedAt: new Date(),
            statusChangedByUserId: session.id,
            updatedAt: new Date(),
          })
          .where(eq(devices.id, ticket.deviceId));
      }

      await tx.insert(serviceTicketEvents).values({
        serviceTicketId: ticketId,
        eventType: 'resolved',
        previousValueJsonb: { statusCode: ticket.statusCode },
        newValueJsonb: { statusCode: 'resolved', finalDeviceStatus: validated.data.finalDeviceStatusCode },
        reason: validated.data.resolutionSummary,
        visibility: 'public',
        actorUserId: session.id,
      });

      await createAuditLog(tx, {
        action: 'UPDATE', entityType: 'service_ticket', entityId: ticketId,
        actorId: session.id, details: { action: 'resolve', ...validated.data },
      });

      return { success: true, data: updated };
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

      await tx.insert(serviceTicketEvents).values({
        serviceTicketId: ticketId,
        eventType: 'closed',
        previousValueJsonb: { statusCode: 'resolved' },
        newValueJsonb: { statusCode: 'closed' },
        reason: validated.data.closureReason,
        visibility: 'public',
        actorUserId: session.id,
      });

      await createAuditLog(tx, {
        action: 'UPDATE', entityType: 'service_ticket', entityId: ticketId,
        actorId: session.id, details: { action: 'close' },
      });

      return { success: true, data: updated };
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
      const [updated] = await tx.update(serviceTickets)
        .set({
          statusCode: 'in_triage',
          reopenedAt: new Date(),
          reopenedByUserId: session.id,
          reopenReason: validated.data.reopenReason,
          resolvedAt: null, resolvedByUserId: null, resolutionSummary: null,
          closedAt: null, closedByUserId: null,
          cancelledAt: null, cancelledByUserId: null, cancellationReason: null,
          updatedAt: new Date(),
        })
        .where(eq(serviceTickets.id, ticketId))
        .returning();

      await tx.insert(serviceTicketEvents).values({
        serviceTicketId: ticketId,
        eventType: 'reopened',
        previousValueJsonb: { statusCode: ticket.statusCode },
        newValueJsonb: { statusCode: 'in_triage' },
        reason: validated.data.reopenReason,
        visibility: 'public',
        actorUserId: session.id,
      });

      await createAuditLog(tx, {
        action: 'UPDATE', entityType: 'service_ticket', entityId: ticketId,
        actorId: session.id, details: { action: 'reopen', reason: validated.data.reopenReason },
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
