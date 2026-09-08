import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { userAccountStatusEnum } from './enums';
import { organizations } from './organizations';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  jobTitle: text('job_title'),
  employeeIdentifier: text('employee_identifier'),
  organizationId: uuid('organization_id').references(() => organizations.id),
  accountStatus: userAccountStatusEnum('account_status').default('invited'),
  avatarUrl: text('avatar_url'),
  notificationPreferences: jsonb('notification_preferences').$type<{
    pushEnabled: boolean;
    categories: {
      tickets: boolean;
      maintenance: boolean;
      devices: boolean;
      system: boolean;
    };
  }>(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdByUserId: uuid('created_by_user_id'),
  updatedByUserId: uuid('updated_by_user_id'),
});

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
}));
