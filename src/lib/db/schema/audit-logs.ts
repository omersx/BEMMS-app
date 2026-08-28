import { pgTable, bigserial, text, timestamp, jsonb, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { auditActionTypeEnum } from './enums';
import { users } from './users';
import { organizations } from './organizations';
import { hospitals } from './hospitals';

export const auditLogs = pgTable('audit_logs', {
  id: bigserial('id', { mode: 'bigint' }).primaryKey(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  actorUserId: uuid('actor_user_id'),
  organizationId: uuid('organization_id'),
  hospitalId: uuid('hospital_id'),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  actionType: auditActionTypeEnum('action_type').notNull(),
  previousState: jsonb('previous_state'),
  newState: jsonb('new_state'),
  changeReason: text('change_reason'),
  ipAddress: text('ip_address'),
  sessionId: text('session_id'),
}, (t) => ({
  orgTimeIdx: index('audit_org_time_idx').on(t.organizationId, t.timestamp),
  entityIdx: index('audit_entity_idx').on(t.entityType, t.entityId),
  actorTimeIdx: index('audit_actor_time_idx').on(t.actorUserId, t.timestamp),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actorUser: one(users, {
    fields: [auditLogs.actorUserId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
  hospital: one(hospitals, {
    fields: [auditLogs.hospitalId],
    references: [hospitals.id],
  }),
}));
