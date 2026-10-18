import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { serviceTicketAttachments, serviceTickets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: ticketId } = await params;

  try {
    const ticket = await db.query.serviceTickets.findFirst({
      where: eq(serviceTickets.id, ticketId),
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const visibility = (formData.get('visibility') as string) || 'public';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File exceeds maximum size of 20MB' },
        { status: 400 }
      );
    }

    // Sanitize filename and create unique storage name
    const originalName = file.name || 'attachment';
    const ext = path.extname(originalName) || '';
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const savedFileName = `${baseName}-${uniqueSuffix}${ext}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'tickets');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, savedFileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const storageKey = `/uploads/tickets/${savedFileName}`;

    const [attachment] = await db
      .insert(serviceTicketAttachments)
      .values({
        serviceTicketId: ticketId,
        fileName: originalName,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        storageKey,
        visibility: visibility as any,
        uploadedByUserId: (session.user as any).id,
      })
      .returning();

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment.id,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        url: attachment.storageKey,
        createdAt: attachment.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Attachment Upload] Error:', error);
    return NextResponse.json(
      { error: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}

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
    const attachments = await db.query.serviceTicketAttachments.findMany({
      where: eq(serviceTicketAttachments.serviceTicketId, ticketId),
      with: {
        uploadedByUser: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    return NextResponse.json({ success: true, attachments });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attachments' },
      { status: 500 }
    );
  }
}
