import { pgTable, uuid, text, timestamp, AnyPgColumn } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { locationTypeEnum, locationStatusEnum } from './enums';
import { organizations } from './organizations';
import { hospitals } from './hospitals';
import { departments } from './departments';

export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  hospitalId: uuid('hospital_id').notNull().references(() => hospitals.id),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  parentLocationId: uuid('parent_location_id').references((): AnyPgColumn => locations.id),
  locationType: locationTypeEnum('location_type').notNull(),
  name: text('name').notNull(),
  code: text('code'),
  status: locationStatusEnum('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdByUserId: uuid('created_by_user_id'),
  updatedByUserId: uuid('updated_by_user_id'),
});

export const locationsRelations = relations(locations, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [locations.organizationId],
    references: [organizations.id],
  }),
  hospital: one(hospitals, {
    fields: [locations.hospitalId],
    references: [hospitals.id],
  }),
  department: one(departments, {
    fields: [locations.departmentId],
    references: [departments.id],
  }),
  parentLocation: one(locations, {
    fields: [locations.parentLocationId],
    references: [locations.id],
    relationName: 'parentChildLocations',
  }),
  childLocations: many(locations, {
    relationName: 'parentChildLocations',
  }),
}));
