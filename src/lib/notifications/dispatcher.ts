'use server';

import { db } from '@/lib/db';
import { notifications, users } from '@/lib/db/schema';
import { userRoleAssignments, userAccessScopes, roles as rolesTable } from '@/lib/db/schema';
import { eq, and, or, inArray, isNull } from 'drizzle-orm';
import { sendPushToUser, type PushNotificationPayload } from './push-sender';

// ── Types ────────────────────────────────────────────────────────────────────────

interface TicketNotificationData {
  ticketId: string;
  ticketNumber: string;
  title: string;
  organizationId: string;
  hospitalId: string;
  departmentId: string;
  departmentName?: string;
  deviceName?: string;
  reportedImpact: string;
  priorityCode: string;
  reportedByUserId: string;
  reportedByName?: string;
}

// ── Impact Labels ────────────────────────────────────────────────────────────────

const IMPACT_LABELS: Record<string, string> = {
  patient_care_affected: '🚨 Patient care affected — URGENT',
  device_not_usable: '⚠️ Device not usable',
  device_usable: 'Device usable with issue',
};

const PRIORITY_LABELS: Record<string, string> = {
  p1_critical: 'CRITICAL',
  p2_high: 'HIGH',
  p3_normal: 'NORMAL',
  p4_low: 'LOW',
};

// ── Find Scoped Engineers ────────────────────────────────────────────────────────

type UserNotificationPreferences = {
  pushEnabled?: boolean;
  categories?: {
    tickets?: boolean;
    maintenance?: boolean;
    devices?: boolean;
    system?: boolean;
  };
} | null;

/**
 * Find all active biomedical engineers/technicians/managers scoped to the same
 * organization and hospital as the ticket.
 */
async function findScopedEngineers(
  organizationId: string,
  hospitalId: string,
): Promise<Array<{ id: string; fullName: string; notificationPreferences: UserNotificationPreferences }>> {
  const TARGET_ROLE_CODES = [
    'BIOMED_ENG',
    'biomed_eng',
    'BIOMED_TECH',
    'biomed_tech',
    'BIOMED_MGR',
    'biomed_mgr',
    'SYS_ADMIN',
    'sys_admin',
    'ORG_ADMIN',
    'org_admin',
    'HOSP_ADMIN',
    'hosp_admin',
  ];

  // Find role IDs for target roles
  const roles = await db.query.roles.findMany({
    where: inArray(rolesTable.code, TARGET_ROLE_CODES),
    columns: { id: true, code: true },
  });

  if (roles.length === 0) return [];
  const roleIds = roles.map((r) => r.id);

  // Find users with target role assignments
  const roleAssignments = await db.query.userRoleAssignments.findMany({
    where: and(
      inArray(userRoleAssignments.roleId, roleIds),
      or(eq(userRoleAssignments.status, 'active'), isNull(userRoleAssignments.status)),
    ),
    columns: { userId: true },
  });

  const candidateUserIds = [...new Set(roleAssignments.map((ra) => ra.userId))];
  if (candidateUserIds.length === 0) return [];

  // Filter by access scope — must have access to the ticket's organization+hospital
  const scopedUserIds: string[] = [];

  for (const userId of candidateUserIds) {
    const scopes = await db.query.userAccessScopes.findMany({
      where: and(
        eq(userAccessScopes.userId, userId),
        eq(userAccessScopes.organizationId, organizationId),
        or(eq(userAccessScopes.status, 'active'), isNull(userAccessScopes.status)),
      ),
    });

    // User has access if they have an org-level scope, or a scope matching the hospital
    const hasExplicitScope = scopes.some(
      (s) => !s.hospitalId || s.hospitalId === hospitalId,
    );

    if (hasExplicitScope) {
      scopedUserIds.push(userId);
    } else if (scopes.length === 0) {
      // User has no custom hospital-restricted scopes, check if user belongs to this organization
      const u = await db.query.users.findFirst({
        where: and(eq(users.id, userId), eq(users.accountStatus, 'active')),
        columns: { organizationId: true },
      });
      if (u && (!u.organizationId || u.organizationId === organizationId)) {
        scopedUserIds.push(userId);
      }
    }
  }

  // Fallback: If no users matched explicit scopes, notify all active candidate users in this organization
  if (scopedUserIds.length === 0) {
    const orgUsers = await db.query.users.findMany({
      where: and(
        inArray(users.id, candidateUserIds),
        eq(users.accountStatus, 'active'),
      ),
      columns: { id: true, organizationId: true },
    });
    for (const u of orgUsers) {
      if (!u.organizationId || u.organizationId === organizationId) {
        scopedUserIds.push(u.id);
      }
    }
  }

  if (scopedUserIds.length === 0) return [];

  // Get user details
  const engineers = await db.query.users.findMany({
    where: and(
      inArray(users.id, scopedUserIds),
      eq(users.accountStatus, 'active'),
    ),
    columns: {
      id: true,
      fullName: true,
      notificationPreferences: true,
    },
  });

  return engineers;
}

// ── Create In-App Notification ───────────────────────────────────────────────────

async function createInAppNotification(params: {
  organizationId: string;
  recipientUserId: string;
  notificationType: string;
  title: string;
  body: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
}) {
  await db.insert(notifications).values({
    organizationId: params.organizationId,
    recipientUserId: params.recipientUserId,
    notificationType: params.notificationType as any,
    title: params.title,
    body: params.body,
    relatedEntityType: params.relatedEntityType || null,
    relatedEntityId: params.relatedEntityId || null,
    actionUrl: params.actionUrl || null,
  });
}

// ── Notify Engineers on New Ticket ───────────────────────────────────────────────

/**
 * When a staff member creates a ticket, notify all scoped biomedical engineers.
 * Creates both in-app notifications and sends native push notifications.
 */
export async function notifyEngineersOnNewTicket(
  data: TicketNotificationData,
): Promise<{ notifiedCount: number; pushCount: number }> {
  try {
    const engineers = await findScopedEngineers(data.organizationId, data.hospitalId);

    // Exclude the reporter if they happen to be a BME user
    const recipients = engineers.filter((eng) => eng.id !== data.reportedByUserId);

    if (recipients.length === 0) {
      return { notifiedCount: 0, pushCount: 0 };
    }

    const isCritical = data.priorityCode === 'p1_critical' || data.reportedImpact === 'patient_care_affected';
    const impactLabel = IMPACT_LABELS[data.reportedImpact] || data.reportedImpact;

    const locationContext = data.departmentName || 'Unknown department';
    const deviceContext = data.deviceName || 'Unknown device';

    // Notification content
    const notifTitle = isCritical
      ? `🚨 URGENT Ticket: ${data.ticketNumber}`
      : `🔧 New Ticket: ${data.ticketNumber}`;

    const notifBody = `${locationContext} — ${deviceContext}: ${data.title}. ${impactLabel}`;

    const actionUrl = `/tickets/${data.ticketId}`;

    let notifiedCount = 0;
    let pushCount = 0;

    await Promise.allSettled(
      recipients.map(async (engineer) => {
        // Check notification preferences
        const prefs = engineer.notificationPreferences;
        const ticketsEnabled = !prefs || prefs.categories?.tickets !== false;

        if (!ticketsEnabled) return;

        // 1. Create in-app notification
        await createInAppNotification({
          organizationId: data.organizationId,
          recipientUserId: engineer.id,
          notificationType: 'ticket_created',
          title: notifTitle,
          body: notifBody,
          relatedEntityType: 'service_ticket',
          relatedEntityId: data.ticketId,
          actionUrl,
        });
        notifiedCount++;

        // 2. Send native push notification
        const pushEnabled = !prefs || prefs.pushEnabled !== false;
        if (pushEnabled) {
          const pushPayload: PushNotificationPayload = {
            title: notifTitle,
            body: notifBody,
            tag: `ticket-${data.ticketNumber}`,
            url: actionUrl,
            requireInteraction: isCritical,
            vibrate: isCritical ? [200, 100, 200, 100, 200] : [100, 50, 100],
            actions: [
              { action: 'view', title: 'View Ticket' },
            ],
            data: {
              ticketId: data.ticketId,
              ticketNumber: data.ticketNumber,
              priority: data.priorityCode,
              impact: data.reportedImpact,
              type: 'new_ticket',
            },
          };

          const deviceCount = await sendPushToUser(engineer.id, pushPayload);
          pushCount += deviceCount;
        }
      }),
    );

    console.log(`[Dispatcher] Notified ${notifiedCount} engineer(s), ${pushCount} device(s) pushed for ticket ${data.ticketNumber}`);
    return { notifiedCount, pushCount };
  } catch (error) {
    console.error('[Dispatcher] Error notifying engineers:', error);
    return { notifiedCount: 0, pushCount: 0 };
  }
}

// ── Notify Reporter on Ticket Accept ─────────────────────────────────────────────

/**
 * When an engineer accepts a ticket, notify the original reporter.
 */
export async function notifyReporterOnAccept(params: {
  ticketId: string;
  ticketNumber: string;
  title: string;
  organizationId: string;
  reporterUserId: string;
  engineerName: string;
  engineerUserId: string;
}): Promise<void> {
  try {
    const notifTitle = '✅ Your ticket has been accepted';
    const notifBody = `Engineer ${params.engineerName} is now working on your reported issue (${params.ticketNumber}: ${params.title})`;
    const actionUrl = `/tickets/${params.ticketId}`;

    // 1. Create in-app notification for reporter
    await createInAppNotification({
      organizationId: params.organizationId,
      recipientUserId: params.reporterUserId,
      notificationType: 'ticket_updated',
      title: notifTitle,
      body: notifBody,
      relatedEntityType: 'service_ticket',
      relatedEntityId: params.ticketId,
      actionUrl,
    });

    // 2. Send native push to reporter
    const reporter = await db.query.users.findFirst({
      where: eq(users.id, params.reporterUserId),
      columns: { notificationPreferences: true },
    });

    const prefs = reporter?.notificationPreferences;
    const pushEnabled = !prefs || prefs.pushEnabled !== false;
    const ticketsEnabled = !prefs || prefs.categories?.tickets !== false;

    if (pushEnabled && ticketsEnabled) {
      await sendPushToUser(params.reporterUserId, {
        title: notifTitle,
        body: notifBody,
        tag: `ticket-accepted-${params.ticketNumber}`,
        url: actionUrl,
        vibrate: [100, 50, 100],
        data: {
          ticketId: params.ticketId,
          type: 'ticket_accepted',
        },
      });
    }

    console.log(`[Dispatcher] Notified reporter of ticket ${params.ticketNumber} acceptance by ${params.engineerName}`);
  } catch (error) {
    console.error('[Dispatcher] Error notifying reporter on accept:', error);
  }
}

// ── Notify Reporter on Ticket Status Update ──────────────────────────────────────

/**
 * When ticket status changes (resolved, in progress, waiting, etc.),
 * notify the reporter with a plain-language update.
 */
export async function notifyReporterOnStatusChange(params: {
  ticketId: string;
  ticketNumber: string;
  title: string;
  organizationId: string;
  reporterUserId: string;
  newStatus: string;
  actorName: string;
}): Promise<void> {
  try {
    const STATUS_MESSAGES: Record<string, string> = {
      in_progress: 'is being investigated by biomedical engineering',
      in_triage: 'is being evaluated in the engineering triage queue',
      acknowledged: 'has been received and acknowledged by engineering',
      waiting_requester: 'needs your response — please reply',
      waiting_parts_vendor: 'is waiting for parts to arrive',
      resolved: 'has been resolved and repair work is complete',
      closed: 'has been closed',
      cancelled: 'has been cancelled',
      reopened: 'has been reopened for further investigation',
    };

    const statusMsg = STATUS_MESSAGES[params.newStatus];
    if (!statusMsg) return; // Don't notify for internal status transitions

    const notifTitle = params.newStatus === 'waiting_requester'
      ? '💬 Response needed on your ticket'
      : params.newStatus === 'resolved'
      ? `✅ Ticket Resolved: ${params.ticketNumber}`
      : `📋 Ticket update: ${params.ticketNumber}`;
    const notifBody = `Your ticket "${params.title}" ${statusMsg}.`;

    await createInAppNotification({
      organizationId: params.organizationId,
      recipientUserId: params.reporterUserId,
      notificationType: 'ticket_updated',
      title: notifTitle,
      body: notifBody,
      relatedEntityType: 'service_ticket',
      relatedEntityId: params.ticketId,
      actionUrl: `/tickets/${params.ticketId}`,
    });

    // Push for important statuses
    const pushStatuses = [
      'waiting_requester',
      'waiting_parts_vendor',
      'resolved',
      'closed',
      'cancelled',
      'in_progress',
      'in_triage',
      'acknowledged',
      'reopened',
    ];
    if (pushStatuses.includes(params.newStatus)) {
      const reporter = await db.query.users.findFirst({
        where: eq(users.id, params.reporterUserId),
        columns: { notificationPreferences: true },
      });
      const prefs = reporter?.notificationPreferences;
      if (!prefs || (prefs.pushEnabled !== false && prefs.categories?.tickets !== false)) {
        await sendPushToUser(params.reporterUserId, {
          title: notifTitle,
          body: notifBody,
          tag: `ticket-status-${params.ticketNumber}`,
          url: `/tickets/${params.ticketId}`,
          requireInteraction: params.newStatus === 'waiting_requester',
          vibrate: [100, 50, 100],
        });
      }
    }
  } catch (error) {
    console.error('[Dispatcher] Error notifying reporter on status change:', error);
  }
}

// ── Notify on New Comment ────────────────────────────────────────────────────────

/**
 * When a comment is added to a ticket, notify the other party.
 * If the commenter is the reporter → notify the assigned engineer.
 * If the commenter is the engineer → notify the reporter.
 */
export async function notifyOnNewComment(params: {
  ticketId: string;
  ticketNumber: string;
  title: string;
  organizationId: string;
  commentAuthorUserId: string;
  commentAuthorName: string;
  reporterUserId: string;
  assignedEngineerUserId: string | null;
  commentPreview: string;
}): Promise<void> {
  try {
    const isReporterCommenting = params.commentAuthorUserId === params.reporterUserId;
    const recipientUserId = isReporterCommenting
      ? params.assignedEngineerUserId
      : params.reporterUserId;

    if (!recipientUserId) return; // No one to notify

    const notifTitle = `💬 New message on ticket ${params.ticketNumber}`;
    const preview = params.commentPreview.length > 80
      ? params.commentPreview.substring(0, 80) + '…'
      : params.commentPreview;
    const notifBody = `${params.commentAuthorName}: ${preview}`;

    await createInAppNotification({
      organizationId: params.organizationId,
      recipientUserId,
      notificationType: 'ticket_updated',
      title: notifTitle,
      body: notifBody,
      relatedEntityType: 'service_ticket',
      relatedEntityId: params.ticketId,
      actionUrl: `/tickets/${params.ticketId}`,
    });

    // Send push notification for new messages
    const recipient = await db.query.users.findFirst({
      where: eq(users.id, recipientUserId),
      columns: { notificationPreferences: true },
    });
    const prefs = recipient?.notificationPreferences;
    if (!prefs || (prefs.pushEnabled !== false && prefs.categories?.tickets !== false)) {
      await sendPushToUser(recipientUserId, {
        title: notifTitle,
        body: notifBody,
        tag: `ticket-comment-${params.ticketNumber}`,
        url: `/tickets/${params.ticketId}`,
        vibrate: [100, 50, 100],
        data: {
          ticketId: params.ticketId,
          type: 'ticket_comment',
        },
      });
    }

    console.log(`[Dispatcher] Notified ${isReporterCommenting ? 'engineer' : 'reporter'} of new comment on ${params.ticketNumber}`);
  } catch (error) {
    console.error('[Dispatcher] Error notifying on new comment:', error);
  }
}

// ── Notify Assigned Engineer ─────────────────────────────────────────────────────

/**
 * When a ticket is assigned to an engineer, notify them.
 */
export async function notifyEngineerOnAssign(params: {
  ticketId: string;
  ticketNumber: string;
  title: string;
  organizationId: string;
  assignedEngineerUserId: string;
  assignerName: string;
}): Promise<void> {
  try {
    const notifTitle = `🔧 Ticket assigned to you: ${params.ticketNumber}`;
    const notifBody = `${params.assignerName} assigned you to ticket "${params.title}". Please review and accept.`;

    await createInAppNotification({
      organizationId: params.organizationId,
      recipientUserId: params.assignedEngineerUserId,
      notificationType: 'ticket_updated',
      title: notifTitle,
      body: notifBody,
      relatedEntityType: 'service_ticket',
      relatedEntityId: params.ticketId,
      actionUrl: `/tickets/${params.ticketId}`,
    });

    const engineer = await db.query.users.findFirst({
      where: eq(users.id, params.assignedEngineerUserId),
      columns: { notificationPreferences: true },
    });
    const prefs = engineer?.notificationPreferences;
    if (!prefs || (prefs.pushEnabled !== false && prefs.categories?.tickets !== false)) {
      await sendPushToUser(params.assignedEngineerUserId, {
        title: notifTitle,
        body: notifBody,
        tag: `ticket-assigned-${params.ticketNumber}`,
        url: `/tickets/${params.ticketId}`,
        vibrate: [100, 50, 100],
        data: {
          ticketId: params.ticketId,
          type: 'ticket_assigned',
        },
      });
    }

    console.log(`[Dispatcher] Notified engineer of assignment for ticket ${params.ticketNumber}`);
  } catch (error) {
    console.error('[Dispatcher] Error notifying engineer on assign:', error);
  }
}
