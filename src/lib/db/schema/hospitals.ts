import { pgTable, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { hospitalStatusEnum } from './enums';
import { organizations } from './organizations';
import { departments } from './departments';

export const hospitals = pgTable('hospitals', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  name: text('name').notNull(),
  code: text('code').notNull(),
  address: text('address'),
  city: text('city'),
  country: text('country'),
  phone: text('phone'),
  email: text('email'),
  timezone: text('timezone'),
  status: hospitalStatusEnum('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdByUserId: uuid('created_by_user_id'),
  updatedByUserId: uuid('updated_by_user_id'),
}, (t) => ({
  orgCodeIdx: uniqueIndex('hospital_org_code_idx').on(t.organizationId, t.code),
}));

export const hospitalsRelations = relations(hospitals, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [hospitals.organizationId],
    references: [organizations.id],
  }),
  departments: many(departments),
}));
