import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and, isNull, desc, sql, gt } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = (session.user as any).id;

  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout;
  let lastChecked = new Date();

  const stream = new ReadableStream({
    start(controller) {
      const poll = async () => {
        try {
          // 1. Send unread count
          const countResult = await db.select({
            count: sql<number>`count(*)::int`,
          })
          .from(notifications)
          .where(and(
            eq(notifications.recipientUserId, userId),
            isNull(notifications.readAt),
          ));

          const count = countResult[0]?.count || 0;
          const countData = `data: ${JSON.stringify({ type: 'unread_count', count })}\n\n`;
          controller.enqueue(encoder.encode(countData));

          // 2. Check for new notifications since last poll
          const newNotifications = await db.select({
            id: notifications.id,
            notificationType: notifications.notificationType,
            title: notifications.title,
            body: notifications.body,
            actionUrl: notifications.actionUrl,
            relatedEntityType: notifications.relatedEntityType,
            relatedEntityId: notifications.relatedEntityId,
            createdAt: notifications.createdAt,
          })
          .from(notifications)
          .where(and(
            eq(notifications.recipientUserId, userId),
            gt(notifications.createdAt, lastChecked),
          ))
          .orderBy(desc(notifications.createdAt))
          .limit(5);

          if (newNotifications.length > 0) {
            const eventData = `data: ${JSON.stringify({
              type: 'new_notifications',
              notifications: newNotifications,
            })}\n\n`;
            controller.enqueue(encoder.encode(eventData));
          }

          lastChecked = new Date();
        } catch (error) {
          // Connection closed
          clearInterval(intervalId);
        }
      };

      // Send immediately
      poll();

      // Poll every 5 seconds for faster real-time feel
      intervalId = setInterval(poll, 5000);
    },
    cancel() {
      clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
