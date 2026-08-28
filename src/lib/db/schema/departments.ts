import { pgTable, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { departmentStatusEnum } from './enums';
import { organizations } from './organizations';
import { hospitals } from './hospitals';
import { users } from './users';

export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  hospitalId: uuid('hospital_id').notNull().references(() => hospitals.id),
  name: text('name').notNull(),
  code: text('code').notNull(),
  departmentType: text('department_type'),
  managerUserId: uuid('manager_user_id'), // fk relations handled below
  status: departmentStatusEnum('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdByUserId: uuid('created_by_user_id'),
  updatedByUserId: uuid('updated_by_user_id'),
}, (t) => ({
  hospitalCodeIdx: uniqueIndex('department_hospital_code_idx').on(t.hospitalId, t.code),
}));

export const departmentsRelations = relations(departments, ({ one }) => ({
  organization: one(organizations, {
    fields: [departments.organizationId],
    references: [organizations.id],
  }),
  hospital: one(hospitals, {
    fields: [departments.hospitalId],
    references: [hospitals.id],
  }),
  manager: one(users, {
    fields: [departments.managerUserId],
    references: [users.id],
  }),
}));
