import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';

export interface AuditLogEntry {
  actorUserId?: string | null;
  organizationId?: string | null;
  hospitalId?: string | null;
  entityType: string;
  entityId: string;
  actionType: string;
  previousState?: unknown;
  newState?: unknown;
  changeReason?: string;
  ipAddress?: string;
  sessionId?: string;
}

export async function createAuditLog(entry: AuditLogEntry, tx?: any) {
  const dbClient = tx || db;
  return dbClient.insert(auditLogs).values({
    ...entry,
    previousState: entry.previousState ? JSON.stringify(entry.previousState) : null,
    newState: entry.newState ? JSON.stringify(entry.newState) : null,
  });
}

export async function createAuditLogFromRequest(entry: AuditLogEntry, request?: Request) {
  let ipAddress = entry.ipAddress;
  
  if (request && !ipAddress) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      ipAddress = forwardedFor.split(',')[0].trim();
    }
  }
  
  return createAuditLog({
    ...entry,
    ipAddress,
  });
}
