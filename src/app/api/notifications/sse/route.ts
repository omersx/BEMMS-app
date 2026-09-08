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

  const stream = new ReadableStream({
    start(controller) {
      // Send initial unread count
      const sendCount = async () => {
        try {
          const result = await db.select({
            count: sql<number>`count(*)::int`,
          })
          .from(notifications)
          .where(and(
            eq(notifications.recipientUserId, userId),
            isNull(notifications.readAt),
          ));

          const count = result[0]?.count || 0;
          const data = `data: ${JSON.stringify({ type: 'unread_count', count })}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (error) {
          // Connection closed
          clearInterval(intervalId);
        }
      };

      // Send immediately
      sendCount();

      // Poll every 10 seconds
      intervalId = setInterval(sendCount, 10000);
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
