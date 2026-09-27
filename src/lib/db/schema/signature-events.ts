import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  signatureEventTypeEnum,
  signatureStatusEnum,
} from './enums';
import { organizations } from './organizations';
import { electronicSignatures } from './signatures';
import { users } from './users';

// ── Signature Events (append-only hash chain) ─────────────────────────────────
// Per spec §10.4: Append-only trace events for signature creation, review,
// rejection, amendment, supersession, and voiding.

export const signatureEvents = pgTable('signature_events', {
  id: uuid('id').defaultRandom().primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  signatureId: uuid('signature_id').notNull().references(() => electronicSignatures.id),
  eventType: signatureEventTypeEnum('event_type').notNull(),
  actorUserId: uuid('actor_user_id').notNull().references(() => users.id),
  timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  previousStatus: signatureStatusEnum('previous_status'),
  newStatus: signatureStatusEnum('new_status'),
  reason: text('reason'),
  previousEventHash: text('previous_event_hash'),
  currentEventHash: text('current_event_hash').notNull(),
}, (t) => ({
  signatureIdx: index('idx_sig_events_signature').on(t.signatureId),
  orgTimeIdx: index('idx_sig_events_org_time').on(t.organizationId, t.timestamp),
  actorIdx: index('idx_sig_events_actor').on(t.actorUserId, t.timestamp),
}));

export const signatureEventsRelations = relations(signatureEvents, ({ one }) => ({
  organization: one(organizations, {
    fields: [signatureEvents.organizationId],
    references: [organizations.id],
  }),
  signature: one(electronicSignatures, {
    fields: [signatureEvents.signatureId],
    references: [electronicSignatures.id],
  }),
  actor: one(users, {
    fields: [signatureEvents.actorUserId],
    references: [users.id],
    relationName: 'signatureEventsActor',
  }),
}));
