import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { serviceTickets, serviceTicketComments } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: ticketId } = await params;

  try {
    const [ticket, commentResult] = await Promise.all([
      db.query.serviceTickets.findFirst({
        where: eq(serviceTickets.id, ticketId),
        columns: {
          id: true,
          statusCode: true,
          assignedEngineerUserId: true,
          updatedAt: true,
        },
      }),
      db.select({
        count: sql<number>`count(*)::int`,
      })
      .from(serviceTicketComments)
      .where(eq(serviceTicketComments.serviceTicketId, ticketId)),
    ]);

    if (!ticket) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: ticket.id,
      statusCode: ticket.statusCode,
      assignedEngineerUserId: ticket.assignedEngineerUserId,
      updatedAt: ticket.updatedAt ? new Date(ticket.updatedAt).toISOString() : null,
      commentCount: commentResult[0]?.count || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
