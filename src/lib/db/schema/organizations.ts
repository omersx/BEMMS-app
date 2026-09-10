import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizationStatusEnum } from './enums';
import { users } from './users';
import { hospitals } from './hospitals';

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  defaultTimezone: text('default_timezone').default('UTC'),
  status: organizationStatusEnum('status').default('active'),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdByUserId: uuid('created_by_user_id'),
  updatedByUserId: uuid('updated_by_user_id'),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  hospitals: many(hospitals),
  users: many(users),
}));
