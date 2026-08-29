import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { riskClassificationEnum, criticalityLevelEnum, refDataStatusEnum } from './enums';
import { organizations } from './organizations';
import { users } from './users';

export const deviceCategories = pgTable('device_categories', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  riskClassification: riskClassificationEnum('risk_classification'),
  criticalityLevel: criticalityLevelEnum('criticality_level'),
  defaultPmIntervalDays: integer('default_pm_interval_days'),
  status: refDataStatusEnum('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  archivedByUserId: uuid('archived_by_user_id').references(() => users.id),
}, (t) => ({
  orgCodeIdx: index('device_cat_org_code_idx').on(t.organizationId, t.code),
}));

export const deviceCategoriesRelations = relations(deviceCategories, ({ one }) => ({
  organization: one(organizations, {
    fields: [deviceCategories.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [deviceCategories.createdByUserId],
    references: [users.id],
    relationName: 'categoriesCreatedByUser',
  }),
}));
