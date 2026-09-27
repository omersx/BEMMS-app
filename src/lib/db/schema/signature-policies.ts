import { pgTable, uuid, text, timestamp, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  signaturePolicyActionEnum,
  criticalityLevelEnum,
} from './enums';
import { organizations } from './organizations';
import { hospitals } from './hospitals';
import { deviceCategories } from './device-categories';

// ── Signature Policies ────────────────────────────────────────────────────────
// Per spec §10.3 & §6: Configurable rules defining which roles and signatures
// are required for a particular action, scoped by organization, criticality,
// and device category.

export interface SignaturePolicyRequirement {
  purpose: 'accept' | 'perform' | 'review' | 'approve' | 'release' | 'resolve' | 'close';
  allowedRoles: string[];
  required: boolean;
}

export const signaturePolicies = pgTable('signature_policies', {
  id: uuid('id').defaultRandom().primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  hospitalId: uuid('hospital_id').references(() => hospitals.id),
  actionType: signaturePolicyActionEnum('action_type').notNull(),
  criticalityLevel: criticalityLevelEnum('criticality_level'),
  deviceCategoryId: uuid('device_category_id').references(() => deviceCategories.id),
  requiredSignatures: jsonb('required_signatures').$type<SignaturePolicyRequirement[]>().notNull(),
  requireIndependentReview: boolean('require_independent_review').default(false).notNull(),
  performerCanRelease: boolean('performer_can_release').default(true).notNull(),
  requireReauth: boolean('require_reauth').default(true).notNull(),
  effectiveDate: timestamp('effective_date', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  policyVersion: text('policy_version').default('1.0').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  createdByUserId: uuid('created_by_user_id'),
}, (t) => ({
  orgActionIdx: uniqueIndex('idx_sig_policies_org_action').on(
    t.organizationId, t.actionType, t.criticalityLevel, t.deviceCategoryId
  ),
  activeIdx: index('idx_sig_policies_active').on(t.organizationId, t.isActive),
}));

export const signaturePoliciesRelations = relations(signaturePolicies, ({ one }) => ({
  organization: one(organizations, {
    fields: [signaturePolicies.organizationId],
    references: [organizations.id],
  }),
  hospital: one(hospitals, {
    fields: [signaturePolicies.hospitalId],
    references: [hospitals.id],
  }),
  deviceCategory: one(deviceCategories, {
    fields: [signaturePolicies.deviceCategoryId],
    references: [deviceCategories.id],
  }),
}));
