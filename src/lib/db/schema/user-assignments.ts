import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { assignmentStatusEnum, scopeTypeEnum } from './enums';
import { users } from './users';
import { roles } from './roles';
import { organizations } from './organizations';
import { hospitals } from './hospitals';
import { departments } from './departments';
import { locations } from './locations';

export const userRoleAssignments = pgTable('user_role_assignments', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').references(() => organizations.id),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).defaultNow(),
  effectiveTo: timestamp('effective_to', { withTimezone: true }),
  assignedByUserId: uuid('assigned_by_user_id').references(() => users.id),
  status: assignmentStatusEnum('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userAccessScopes = pgTable('user_access_scopes', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  hospitalId: uuid('hospital_id').references(() => hospitals.id),
  departmentId: uuid('department_id').references(() => departments.id),
  locationId: uuid('location_id').references(() => locations.id),
  scopeType: scopeTypeEnum('scope_type').notNull(),
  status: assignmentStatusEnum('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
});

export const userRoleAssignmentsRelations = relations(userRoleAssignments, ({ one }) => ({
  user: one(users, {
    fields: [userRoleAssignments.userId],
    references: [users.id],
    relationName: 'roleAssignmentsForUser',
  }),
  role: one(roles, {
    fields: [userRoleAssignments.roleId],
    references: [roles.id],
  }),
  organization: one(organizations, {
    fields: [userRoleAssignments.organizationId],
    references: [organizations.id],
  }),
  assignedByUser: one(users, {
    fields: [userRoleAssignments.assignedByUserId],
    references: [users.id],
    relationName: 'rolesAssignedByUser',
  }),
}));

export const userAccessScopesRelations = relations(userAccessScopes, ({ one }) => ({
  user: one(users, {
    fields: [userAccessScopes.userId],
    references: [users.id],
    relationName: 'accessScopesForUser',
  }),
  organization: one(organizations, {
    fields: [userAccessScopes.organizationId],
    references: [organizations.id],
  }),
  hospital: one(hospitals, {
    fields: [userAccessScopes.hospitalId],
    references: [hospitals.id],
  }),
  department: one(departments, {
    fields: [userAccessScopes.departmentId],
    references: [departments.id],
  }),
  location: one(locations, {
    fields: [userAccessScopes.locationId],
    references: [locations.id],
  }),
  createdByUser: one(users, {
    fields: [userAccessScopes.createdByUserId],
    references: [users.id],
    relationName: 'scopesCreatedByUser',
  }),
}));
