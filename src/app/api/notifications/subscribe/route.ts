import { NextRequest, NextResponse } from 'next/server';
import { savePushSubscription } from '@/lib/actions/notifications';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid push subscription' },
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
  } catch (error: any) {
    console.error('[Subscribe] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
