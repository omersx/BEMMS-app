'use server';

import webpush from 'web-push';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// ── Configure VAPID ─────────────────────────────────────────────────────────────

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@bemms.local';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// ── Push Payload Types ──────────────────────────────────────────────────────────

export interface PushNotificationPayload {
  title: string;
  body: string;
  /** Tag for notification grouping/replacement */
  tag?: string;
  /** URL to navigate to when notification is clicked */
  url?: string;
  /** Native notification action buttons */
  actions?: Array<{ action: string; title: string }>;
  /** If true, notification stays until user dismisses it */
  requireInteraction?: boolean;
  /** Vibration pattern in ms [vibrate, pause, vibrate, ...] */
  vibrate?: number[];
  /** Extra data passed through to service worker */
  data?: Record<string, unknown>;
}

// ── Send Push to a Single User ──────────────────────────────────────────────────

/**
 * Send a native push notification to all registered devices for a given user.
 * Automatically removes expired/invalid subscriptions.
 *
 * @returns Number of devices successfully notified
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload,
): Promise<number> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[Push] VAPID keys not configured — skipping push notification');
    return 0;
  }

  // Get all push subscriptions for this user
  const subscriptions = await db.query.pushSubscriptions.findMany({
    where: eq(pushSubscriptions.userId, userId),
  });

  if (subscriptions.length === 0) return 0;

  const jsonPayload = JSON.stringify(payload);
  let successCount = 0;
  const expiredIds: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          jsonPayload,
          {
            TTL: 60 * 60 * 4, // 4 hours
            urgency: payload.requireInteraction ? 'high' : 'normal',
          },
        );
        successCount++;
      } catch (error: unknown) {
        const pushError = error as { statusCode?: number; message?: string };
        // 410 Gone or 404 = subscription expired/invalid
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
          expiredIds.push(sub.id);
        } else {
          console.error(`[Push] Failed to send to ${sub.endpoint.substring(0, 50)}...`, pushError.statusCode || pushError.message);
        }
      }
    }),
  );

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await Promise.allSettled(
      expiredIds.map((id) =>
        db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id)),
      ),
    );
    console.log(`[Push] Cleaned up ${expiredIds.length} expired subscription(s)`);
  }

  return successCount;
}

// ── Send Push to Multiple Users ─────────────────────────────────────────────────

/**
 * Send a native push notification to multiple users.
 * @returns Total number of devices successfully notified
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushNotificationPayload,
): Promise<number> {
  if (userIds.length === 0) return 0;

  const results = await Promise.allSettled(
    userIds.map((userId) => sendPushToUser(userId, payload)),
  );

  return results.reduce((total, result) => {
    if (result.status === 'fulfilled') return total + result.value;
    return total;
  }, 0);
}
