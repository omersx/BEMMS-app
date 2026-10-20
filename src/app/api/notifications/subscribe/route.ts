import { NextRequest, NextResponse } from 'next/server';
import { savePushSubscription } from '@/lib/actions/notifications';
import { getLogger } from '@/lib/logger';

const log = getLogger('push-subscribe');

const MAX_ENDPOINT_LENGTH = 2048;
const MAX_KEY_LENGTH = 512;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid push subscription' },
        { status: 400 }
      );
    }

    // Validate input lengths to prevent abuse
    if (
      typeof body.endpoint !== 'string' ||
      body.endpoint.length > MAX_ENDPOINT_LENGTH ||
      typeof body.keys.p256dh !== 'string' ||
      body.keys.p256dh.length > MAX_KEY_LENGTH ||
      typeof body.keys.auth !== 'string' ||
      body.keys.auth.length > MAX_KEY_LENGTH
    ) {
      return NextResponse.json(
        { error: 'Invalid push subscription data' },
        { status: 400 }
      );
    }

    const subscription = await savePushSubscription({
      endpoint: body.endpoint,
      keys: {
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      },
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true, id: subscription.id });
  } catch (error: unknown) {
    // Log the real error server-side; return a generic message to the client
    log.error('Push subscription error', error instanceof Error ? error : { message: String(error) });
    return NextResponse.json(
      { error: 'Failed to save push subscription' },
      { status: 500 }
    );
  }
}
