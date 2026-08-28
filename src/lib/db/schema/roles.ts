import { pgTable, uuid, text, timestamp, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { roleStatusEnum, permissionModuleEnum, permissionActionEnum } from './enums';
import { organizations } from './organizations';

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').references(() => organizations.id),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  isSystemRole: boolean('is_system_role').default(false),
  status: roleStatusEnum('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdByUserId: uuid('created_by_user_id'),
  updatedByUserId: uuid('updated_by_user_id'),
});

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  module: permissionModuleEnum('module').notNull(),
  action: permissionActionEnum('action').notNull(),
  description: text('description'),
}, (t) => ({
  moduleActionIdx: uniqueIndex('permission_module_action_idx').on(t.module, t.action),
}));

export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (t) => ({
  rolePermissionIdx: uniqueIndex('role_permission_idx').on(t.roleId, t.permissionId),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [roles.organizationId],
    references: [organizations.id],
  }),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));
