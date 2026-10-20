import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getLogger } from '@/lib/logger';

const log = getLogger('health');

/**
 * Production health check endpoint.
 * Used by Docker HEALTHCHECK, load balancers, and monitoring tools.
 * Returns 200 if the app and database are healthy, 503 otherwise.
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Check database connectivity
    await db.execute(sql`SELECT 1`);

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
        responseTimeMs: responseTime,
      },
      { status: 200 }
    );
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    log.error('Health check failed', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        responseTimeMs: responseTime,
      },
      { status: 503 }
    );
  }
}
