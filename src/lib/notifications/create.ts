import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendPushToUser, type PushPayload } from './push';

interface CreateNotificationParams {
  organizationId: string;
  recipientUserId: string;
  notificationType: 'ticket_assigned' | 'ticket_updated' | 'ticket_comment' |
    'pm_due_soon' | 'pm_overdue' | 'calibration_due' |
    'task_review_required' | 'task_approved' | 'task_rejected' |
    'device_status_changed' | 'sla_warning' | 'system_alert';
  title: string;
  body: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
}

// Map notification types to preference categories
function getCategory(type: string): 'tickets' | 'maintenance' | 'devices' | 'system' {
  if (type.startsWith('ticket_')) return 'tickets';
  if (type.startsWith('pm_') || type.startsWith('task_') || type.startsWith('calibration_')) return 'maintenance';
  if (type.startsWith('device_')) return 'devices';
  return 'system';
}

export async function createNotification(params: CreateNotificationParams) {
  // Insert notification into DB
  const [notification] = await db.insert(notifications).values({
    organizationId: params.organizationId,
    recipientUserId: params.recipientUserId,
    notificationType: params.notificationType,
    title: params.title,
    body: params.body,
    relatedEntityType: params.relatedEntityType,
    relatedEntityId: params.relatedEntityId,
    actionUrl: params.actionUrl,
  }).returning();

  // Check user's notification preferences for push
  const user = await db.query.users.findFirst({
    where: eq(users.id, params.recipientUserId),
    columns: { notificationPreferences: true },
  });

  const prefs = user?.notificationPreferences;
  const category = getCategory(params.notificationType);

  // Send push if enabled
  const pushEnabled = prefs?.pushEnabled !== false; // Default to true
  const categoryEnabled = prefs?.categories?.[category] !== false; // Default to true

  if (pushEnabled && categoryEnabled) {
    const payload: PushPayload = {
      title: params.title,
      body: params.body,
      url: params.actionUrl || '/notifications',
      tag: `${params.notificationType}-${params.relatedEntityId || notification.id}`,
    };

    // Fire and forget — don't block on push delivery
    sendPushToUser(params.recipientUserId, payload).catch((err) => {
      console.error('[Notification] Push delivery failed:', err);
    });
  }

  return notification;
}
