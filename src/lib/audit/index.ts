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

const VALID_AUDIT_ACTIONS = new Set([
  'CREATE', 'UPDATE', 'DEACTIVATE', 'ARCHIVE', 'TRANSFER', 'PURGE', 'SIGN', 'POLICY_CHANGE', 'LOGIN', 'LOGOUT', 'FAILED_LOGIN'
]);

function normalizeAuditAction(action?: string): string {
  if (!action) return 'CREATE';
  const upper = String(action).toUpperCase();
  if (VALID_AUDIT_ACTIONS.has(upper)) return upper;
  if (upper.includes('IMPORT') || upper.includes('INSERT') || upper.includes('INVITE') || upper.includes('ASSIGN')) return 'CREATE';
  if (upper.includes('PURGE') || upper.includes('RESET') || upper.includes('CLEAR')) return 'PURGE';
  if (upper.includes('DEACTIVATE') || upper.includes('DELETE') || upper.includes('REMOVE') || upper.includes('REVOKE')) return 'DEACTIVATE';
  if (upper.includes('ARCHIVE')) return 'ARCHIVE';
  if (upper.includes('TRANSFER')) return 'TRANSFER';
  if (upper.includes('SIGN')) return 'SIGN';
  return 'UPDATE';
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
  const actionType = normalizeAuditAction(entry.actionType || entry.action) as any;
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
