import { pgTable, uuid, text, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';

export const generatedReports = pgTable('generated_reports', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  reportType: text('report_type').notNull(), // 'inventory', 'tickets', 'maintenance', 'costs', 'workload'
  title: text('title').notNull(),
  filtersJsonb: jsonb('filters_jsonb'),
  dateRangeStart: timestamp('date_range_start', { withTimezone: true }),
  dateRangeEnd: timestamp('date_range_end', { withTimezone: true }),
  timezone: text('timezone').default('UTC'),
  rowCount: integer('row_count'),
  fileFormat: text('file_format').default('csv'), // 'csv', 'xlsx', 'pdf'
  fileName: text('file_name').notNull(),
  generatedByUserId: uuid('generated_by_user_id').notNull().references(() => users.id),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgIdx: index('idx_generated_reports_org').on(t.organizationId, t.generatedAt),
}));

export const generatedReportsRelations = relations(generatedReports, ({ one }) => ({
  organization: one(organizations, { fields: [generatedReports.organizationId], references: [organizations.id] }),
  generatedByUser: one(users, { fields: [generatedReports.generatedByUserId], references: [users.id] }),
}));
