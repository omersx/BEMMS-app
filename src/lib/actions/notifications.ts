'use server';

import { db } from '@/lib/db';
import { notifications, pushSubscriptions, users } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/rbac';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';

export async function getUnreadCount() {
  const user = await requireAuth();

  const result = await db.select({
    count: sql<number>`count(*)::int`,
  })
  .from(notifications)
  .where(and(
    eq(notifications.recipientUserId, user.id),
    isNull(notifications.readAt),
  ));

  return result[0]?.count || 0;
}

export async function getNotifications(limit = 20, offset = 0) {
  const user = await requireAuth();

  return db.query.notifications.findMany({
    where: eq(notifications.recipientUserId, user.id),
    orderBy: [desc(notifications.createdAt)],
    limit,
    offset,
  });
}

export async function markAsRead(notificationId: string) {
  const user = await requireAuth();

  await db.update(notifications)
    .set({ readAt: new Date() })
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.recipientUserId, user.id),
    ));
}

export async function markAllAsRead() {
  const user = await requireAuth();

  await db.update(notifications)
    .set({ readAt: new Date() })
    .where(and(
      eq(notifications.recipientUserId, user.id),
      isNull(notifications.readAt),
    ));
}

export async function savePushSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}) {
  const user = await requireAuth();

  // Check if subscription already exists
  const existing = await db.query.pushSubscriptions.findFirst({
    where: eq(pushSubscriptions.endpoint, subscription.endpoint),
  });

  if (existing) {
    // Update existing
    await db.update(pushSubscriptions)
      .set({
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId: user.id,
      })
      .where(eq(pushSubscriptions.id, existing.id));
    return existing;
  }

  // Create new
  const [sub] = await db.insert(pushSubscriptions).values({
    userId: user.id,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    userAgent: subscription.userAgent,
  }).returning();

  return sub;
}

export async function removePushSubscription(endpoint: string) {
  const user = await requireAuth();

  await db.delete(pushSubscriptions)
    .where(and(
      eq(pushSubscriptions.endpoint, endpoint),
      eq(pushSubscriptions.userId, user.id),
    ));
}

export async function updateNotificationPreferences(prefs: {
  pushEnabled: boolean;
  categories: {
    tickets: boolean;
    maintenance: boolean;
    devices: boolean;
    system: boolean;
  };
}) {
  const user = await requireAuth();

  await db.update(users)
    .set({ notificationPreferences: prefs })
    .where(eq(users.id, user.id));
}

export async function getNotificationPreferences() {
  const user = await requireAuth();

  const userData = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { notificationPreferences: true },
  });

  return userData?.notificationPreferences || {
    pushEnabled: true,
    categories: {
      tickets: true,
      maintenance: true,
      devices: true,
      system: true,
    },
  };
}
