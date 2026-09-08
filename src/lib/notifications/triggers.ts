import { db } from '@/lib/db';
import { serviceTickets, maintenanceTasks, devices, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createNotification } from './create';

/**
 * Trigger notification when a ticket is assigned to an engineer.
 */
export async function notifyTicketAssigned(ticketId: string, engineerUserId: string) {
  const ticket = await db.query.serviceTickets.findFirst({
    where: eq(serviceTickets.id, ticketId),
    with: { device: { columns: { name: true } } },
  });
  if (!ticket) return;

  await createNotification({
    organizationId: ticket.organizationId,
    recipientUserId: engineerUserId,
    notificationType: 'ticket_assigned',
    title: `Ticket ${ticket.ticketNumber} assigned to you`,
    body: `${ticket.title}${ticket.device ? ` — ${ticket.device.name}` : ''}`,
    relatedEntityType: 'ticket',
    relatedEntityId: ticketId,
    actionUrl: `/tickets/${ticketId}`,
  });
}

/**
 * Trigger notification when a ticket status changes (notify reporter).
 */
export async function notifyTicketStatusChanged(ticketId: string, newStatus: string) {
  const ticket = await db.query.serviceTickets.findFirst({
    where: eq(serviceTickets.id, ticketId),
  });
  if (!ticket || !ticket.reportedByUserId) return;

  const statusLabel = newStatus.replace(/_/g, ' ');

  await createNotification({
    organizationId: ticket.organizationId,
    recipientUserId: ticket.reportedByUserId,
    notificationType: 'ticket_updated',
    title: `Ticket ${ticket.ticketNumber} is now ${statusLabel}`,
    body: ticket.title,
    relatedEntityType: 'ticket',
    relatedEntityId: ticketId,
    actionUrl: `/tickets/${ticketId}`,
  });
}

/**
 * Trigger notification when a comment is added to a ticket.
 */
export async function notifyTicketComment(ticketId: string, commenterId: string) {
  const ticket = await db.query.serviceTickets.findFirst({
    where: eq(serviceTickets.id, ticketId),
  });
  if (!ticket) return;

  const commenter = await db.query.users.findFirst({
    where: eq(users.id, commenterId),
    columns: { fullName: true },
  });

  // Notify reporter if commenter is not the reporter
  if (ticket.reportedByUserId && ticket.reportedByUserId !== commenterId) {
    await createNotification({
      organizationId: ticket.organizationId,
      recipientUserId: ticket.reportedByUserId,
      notificationType: 'ticket_comment',
      title: `New comment on ${ticket.ticketNumber}`,
      body: `${commenter?.fullName || 'Someone'} commented on your ticket`,
      relatedEntityType: 'ticket',
      relatedEntityId: ticketId,
      actionUrl: `/tickets/${ticketId}`,
    });
  }

  // Notify assigned engineer if commenter is not the engineer
  if (ticket.assignedEngineerUserId && ticket.assignedEngineerUserId !== commenterId) {
    await createNotification({
      organizationId: ticket.organizationId,
      recipientUserId: ticket.assignedEngineerUserId,
      notificationType: 'ticket_comment',
      title: `New comment on ${ticket.ticketNumber}`,
      body: `${commenter?.fullName || 'Someone'} commented on the ticket`,
      relatedEntityType: 'ticket',
      relatedEntityId: ticketId,
      actionUrl: `/tickets/${ticketId}`,
    });
  }
}

/**
 * Trigger notification when a maintenance task needs review.
 */
export async function notifyTaskReviewRequired(taskId: string, reviewerUserId: string) {
  const task = await db.query.maintenanceTasks.findFirst({
    where: eq(maintenanceTasks.id, taskId),
    with: { device: { columns: { name: true } } },
  });
  if (!task) return;

  await createNotification({
    organizationId: task.organizationId,
    recipientUserId: reviewerUserId,
    notificationType: 'task_review_required',
    title: `Task ${task.taskNumber} needs review`,
    body: `${task.title}${task.device ? ` — ${task.device.name}` : ''}`,
    relatedEntityType: 'task',
    relatedEntityId: taskId,
    actionUrl: `/maintenance/tasks/${taskId}`,
  });
}

/**
 * Trigger notification when a PM task is due soon.
 */
export async function notifyPMDueSoon(taskId: string, engineerUserId: string) {
  const task = await db.query.maintenanceTasks.findFirst({
    where: eq(maintenanceTasks.id, taskId),
    with: { device: { columns: { name: true } } },
  });
  if (!task) return;

  await createNotification({
    organizationId: task.organizationId,
    recipientUserId: engineerUserId,
    notificationType: 'pm_due_soon',
    title: `PM task ${task.taskNumber} due soon`,
    body: `${task.title}${task.device ? ` — ${task.device.name}` : ''}`,
    relatedEntityType: 'task',
    relatedEntityId: taskId,
    actionUrl: `/maintenance/tasks/${taskId}`,
  });
}

/**
 * Trigger notification when a device status changes.
 */
export async function notifyDeviceStatusChanged(
  deviceId: string,
  newStatus: string,
  recipientUserIds: string[]
) {
  const device = await db.query.devices.findFirst({
    where: eq(devices.id, deviceId),
  });
  if (!device) return;

  const statusLabel = newStatus.replace(/_/g, ' ');

  for (const userId of recipientUserIds) {
    await createNotification({
      organizationId: device.organizationId,
      recipientUserId: userId,
      notificationType: 'device_status_changed',
      title: `${device.name} is now ${statusLabel}`,
      body: `Asset ${device.assetNumber || device.name} status changed`,
      relatedEntityType: 'device',
      relatedEntityId: deviceId,
      actionUrl: `/devices/${deviceId}`,
    });
  }
}
