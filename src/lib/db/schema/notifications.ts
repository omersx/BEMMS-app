import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { notificationTypeEnum } from './enums';
import { organizations } from './organizations';
import { users } from './users';

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  recipientUserId: uuid('recipient_user_id').references(() => users.id).notNull(),
  notificationType: notificationTypeEnum('notification_type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  relatedEntityType: text('related_entity_type'),
  relatedEntityId: uuid('related_entity_id'),
  actionUrl: text('action_url'),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  organization: one(organizations, {
    fields: [notifications.organizationId],
    references: [organizations.id],
  }),
  recipient: one(users, {
    fields: [notifications.recipientUserId],
    references: [users.id],
  }),
}));

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid('user_id').references(() => users.id).notNull(),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));
