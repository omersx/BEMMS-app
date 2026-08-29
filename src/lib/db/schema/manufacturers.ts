import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { refDataStatusEnum } from './enums';
import { organizations } from './organizations';
import { users } from './users';

export const manufacturers = pgTable('manufacturers', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  name: text('name').notNull(),
  code: text('code'),
  country: text('country'),
  supportEmail: text('support_email'),
  supportPhone: text('support_phone'),
  website: text('website'),
  status: refDataStatusEnum('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
}, (t) => ({
  orgNameIdx: index('mfr_org_name_idx').on(t.organizationId, t.name),
}));

export const manufacturersRelations = relations(manufacturers, ({ one }) => ({
  organization: one(organizations, {
    fields: [manufacturers.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [manufacturers.createdByUserId],
    references: [users.id],
    relationName: 'manufacturersCreatedByUser',
  }),
}));

export const deviceModels = pgTable('device_models', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  manufacturerId: uuid('manufacturer_id').notNull().references(() => manufacturers.id),
  modelName: text('model_name').notNull(),
  modelNumber: text('model_number'),
  specifications: text('specifications'),
  status: refDataStatusEnum('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  mfrModelIdx: index('model_mfr_idx').on(t.manufacturerId, t.modelName),
}));

export const deviceModelsRelations = relations(deviceModels, ({ one }) => ({
  organization: one(organizations, {
    fields: [deviceModels.organizationId],
    references: [organizations.id],
  }),
  manufacturer: one(manufacturers, {
    fields: [deviceModels.manufacturerId],
    references: [manufacturers.id],
  }),
}));
