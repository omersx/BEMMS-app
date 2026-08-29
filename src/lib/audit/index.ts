import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';

export interface AuditLogEntry {
  actorUserId?: string | null;
  actorId?: string | null;
  organizationId?: string | null;
  hospitalId?: string | null;
  entityType: string;
  entityId: string;
  actionType?: any;
  action?: any;
  previousState?: unknown;
  newState?: unknown;
  details?: unknown;
  changeReason?: string;
  ipAddress?: string;
  sessionId?: string;
}

export async function createAuditLog(arg1: any, arg2?: any) {
  let entry: AuditLogEntry;
  let tx: any;

  if (arg1 && typeof arg1 === 'object' && ('entityType' in arg1 || 'actionType' in arg1 || 'action' in arg1)) {
    entry = arg1;
    tx = arg2;
  } else {
    tx = arg1;
    entry = arg2;
  }

  if (!entry) return;

  const dbClient = tx || db;
  const actionType = (entry.actionType || entry.action || 'CREATE') as any;
  const actorUserId = entry.actorUserId || entry.actorId || null;
  const newState = entry.newState !== undefined ? entry.newState : entry.details;

  return dbClient.insert(auditLogs).values({
    actorUserId,
    organizationId: entry.organizationId || null,
    hospitalId: entry.hospitalId || null,
    entityType: entry.entityType,
    entityId: entry.entityId,
    actionType,
    previousState: entry.previousState ? JSON.stringify(entry.previousState) : null,
    newState: newState ? JSON.stringify(newState) : null,
    changeReason: entry.changeReason || null,
    ipAddress: entry.ipAddress || null,
    sessionId: entry.sessionId || null,
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
