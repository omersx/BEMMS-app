import { pgTable, uuid, text, timestamp, integer, jsonb, index, uniqueIndex, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  recordVersionEntityTypeEnum,
  signaturePurposeEnum,
  signatureAuthMethodEnum,
  signatureStatusEnum,
} from './enums';
import { organizations } from './organizations';
import { users } from './users';

export const recordVersions = pgTable('record_versions', {
  id: uuid('id').defaultRandom().primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  entityType: recordVersionEntityTypeEnum('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  versionNumber: integer('version_number').notNull(),
  canonicalSnapshotJsonb: jsonb('canonical_snapshot_jsonb').notNull(),
  contentHashSha256: text('content_hash_sha256').notNull(),
  amendmentReason: text('amendment_reason'),
  supersedesVersionId: uuid('supersedes_version_id').references((): AnyPgColumn => recordVersions.id),
  createdByUserId: uuid('created_by_user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (t) => ({
  entityVersionIdx: uniqueIndex('idx_record_versions_entity_version').on(t.entityType, t.entityId, t.versionNumber),
  orgEntityIdx: index('idx_record_versions_org_entity').on(t.organizationId, t.entityType, t.entityId),
}));

export const electronicSignatures = pgTable('electronic_signatures', {
  id: uuid('id').defaultRandom().primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  recordVersionId: uuid('record_version_id').notNull().references(() => recordVersions.id),
  entityType: recordVersionEntityTypeEnum('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  signaturePurpose: signaturePurposeEnum('signature_purpose').notNull(),
  signerUserId: uuid('signer_user_id').notNull().references(() => users.id),
  signerNameSnapshot: text('signer_name_snapshot').notNull(),
  signerRoleSnapshot: text('signer_role_snapshot').notNull(),
  signerScopeSnapshot: text('signer_scope_snapshot'),
  attestationTextVersion: text('attestation_text_version').notNull(),
  authMethod: signatureAuthMethodEnum('auth_method').notNull(),
  signedAt: timestamp('signed_at', { withTimezone: true, mode: 'date' }).notNull(),
  displayTimezone: text('display_timezone').default('UTC'),
  signedContentHashSha256: text('signed_content_hash_sha256').notNull(),
  signatureStatus: signatureStatusEnum('signature_status').default('active').notNull(),
  comments: text('comments'),
}, (t) => ({
  entityIdx: index('idx_signatures_entity').on(t.entityType, t.entityId),
  recordVersionIdx: index('idx_signatures_record_version').on(t.recordVersionId),
  signerIdx: index('idx_signatures_signer').on(t.signerUserId, t.signedAt),
  orgTimeIdx: index('idx_signatures_org_time').on(t.organizationId, t.signedAt),
}));

export const recordVersionsRelations = relations(recordVersions, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [recordVersions.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [recordVersions.createdByUserId],
    references: [users.id],
    relationName: 'recordVersionsCreatedByUser',
  }),
  supersedesVersion: one(recordVersions, {
    fields: [recordVersions.supersedesVersionId],
    references: [recordVersions.id],
    relationName: 'supersededVersions',
  }),
  signatures: many(electronicSignatures),
}));

export const electronicSignaturesRelations = relations(electronicSignatures, ({ one }) => ({
  organization: one(organizations, {
    fields: [electronicSignatures.organizationId],
    references: [organizations.id],
  }),
  recordVersion: one(recordVersions, {
    fields: [electronicSignatures.recordVersionId],
    references: [recordVersions.id],
  }),
  signerUser: one(users, {
    fields: [electronicSignatures.signerUserId],
    references: [users.id],
    relationName: 'signaturesBySigner',
  }),
}));
