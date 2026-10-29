import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = (session.user as any).id;
  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout | null = null;

  // Track seen notification IDs to reliably detect brand-new notifications
  // immune to clock drift, timezone mismatches, or sub-second timestamp precision errors
  const seenNotificationIds = new Set<string>();
  let isInitialPoll = true;

  const stream = new ReadableStream({
    start(controller) {
      const cleanup = () => {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      };

      req.signal.addEventListener('abort', cleanup);

      const poll = async () => {
        try {
          if (req.signal.aborted) {
            cleanup();
            return;
          }

          // 1. Send live unread count
          const countResult = await db
            .select({
              count: sql<number>`count(*)::int`,
            })
            .from(notifications)
            .where(
              and(
                eq(notifications.recipientUserId, userId),
                isNull(notifications.readAt)
              )
            );

          const count = countResult[0]?.count || 0;
          const countData = `data: ${JSON.stringify({ type: 'unread_count', count })}\n\n`;
          controller.enqueue(encoder.encode(countData));

          // 2. Query recent unread notifications
          const recentUnread = await db
            .select({
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
            .where(
              and(
                eq(notifications.recipientUserId, userId),
                isNull(notifications.readAt)
              )
            )
            .orderBy(desc(notifications.createdAt))
            .limit(10);

          if (isInitialPoll) {
            // First run on connect: record existing unread notifications so we only trigger alerts on NEW incoming events
            for (const n of recentUnread) {
              seenNotificationIds.add(n.id);
            }
            isInitialPoll = false;
          } else {
            // Subsequent polls: any unread notification not previously seen is BRAND NEW
            const brandNew = recentUnread.filter((n) => !seenNotificationIds.has(n.id));

            if (brandNew.length > 0) {
              for (const n of brandNew) {
                seenNotificationIds.add(n.id);
              }

              const eventData = `data: ${JSON.stringify({
                type: 'new_notifications',
                notifications: brandNew,
              })}\n\n`;
              controller.enqueue(encoder.encode(eventData));
            }
          }

          // Bound set memory to prevent unbounded growth over long sessions
          if (seenNotificationIds.size > 200) {
            const idsArray = Array.from(seenNotificationIds);
            const toKeep = idsArray.slice(idsArray.length - 100);
            seenNotificationIds.clear();
            toKeep.forEach((id) => seenNotificationIds.add(id));
          }
        } catch {
          // Stream error or client disconnect
          cleanup();
        }
      };

      // Send initial state immediately
      poll();

      // Poll every 3 seconds for snappy real-time alerts
      intervalId = setInterval(poll, 3000);
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable proxy buffering (nginx / Cloudflare / Vercel)
    },
  });
}
