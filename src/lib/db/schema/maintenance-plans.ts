import { pgTable, uuid, text, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  maintenanceTypeCodeEnum,
  pmCalculationMethodEnum,
  maintenancePlanStatusEnum,
  occurrenceDueStateEnum,
} from './enums';
import { organizations } from './organizations';
import { hospitals } from './hospitals';
import { departments } from './departments';
import { devices } from './devices';
import { users } from './users';

// ── Maintenance Plans ──────────────────────────────────────────────────────────

export const maintenancePlans = pgTable('maintenance_plans', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  hospitalId: uuid('hospital_id').notNull().references(() => hospitals.id),
  departmentId: uuid('department_id').references(() => departments.id),
  deviceId: uuid('device_id').notNull().references(() => devices.id),

  planTypeCode: maintenanceTypeCodeEnum('plan_type_code').default('preventive_maintenance'),
  title: text('title'),
  checklistTemplateVersionId: uuid('checklist_template_version_id'),
  calculationMethod: pmCalculationMethodEnum('calculation_method').default('fixed_calendar').notNull(),
  frequencyInterval: integer('frequency_interval').notNull(),
  frequencyUnit: text('frequency_unit').notNull(),

  startBaselineDate: timestamp('start_baseline_date', { withTimezone: true }).notNull(),
  nextDueDate: timestamp('next_due_date', { withTimezone: true }).notNull(),
  leadTimeDays: integer('lead_time_days').default(30),
  lastQualifyingRecordId: uuid('last_qualifying_record_id'),

  assignedEngineerUserId: uuid('assigned_engineer_user_id').references(() => users.id),
  assignedTeamId: uuid('assigned_team_id'),

  status: maintenancePlanStatusEnum('status').default('active').notNull(),
  pauseReason: text('pause_reason'),
  archiveReason: text('archive_reason'),
  deviceSnapshot: jsonb('device_snapshot'),
  instructions: text('instructions'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
}, (t) => ({
  lookupIdx: index('idx_maintenance_plans_lookup').on(t.organizationId, t.hospitalId, t.departmentId, t.status),
  deviceIdx: index('idx_maintenance_plans_device').on(t.deviceId, t.status),
  dueIdx: index('idx_maintenance_plans_due').on(t.organizationId, t.nextDueDate),
  assigneeIdx: index('idx_maintenance_plans_assignee').on(t.assignedEngineerUserId, t.status),
}));

export const maintenancePlansRelations = relations(maintenancePlans, ({ one, many }) => ({
  organization: one(organizations, { fields: [maintenancePlans.organizationId], references: [organizations.id] }),
  hospital: one(hospitals, { fields: [maintenancePlans.hospitalId], references: [hospitals.id] }),
  department: one(departments, { fields: [maintenancePlans.departmentId], references: [departments.id] }),
  device: one(devices, { fields: [maintenancePlans.deviceId], references: [devices.id] }),
  assignedEngineer: one(users, { fields: [maintenancePlans.assignedEngineerUserId], references: [users.id], relationName: 'maintenancePlansAssignedEngineer' }),
  createdByUser: one(users, { fields: [maintenancePlans.createdByUserId], references: [users.id], relationName: 'maintenancePlansCreatedByUser' }),
  updatedByUser: one(users, { fields: [maintenancePlans.updatedByUserId], references: [users.id], relationName: 'maintenancePlansUpdatedByUser' }),
  occurrences: many(maintenanceScheduleOccurrences),
}));

// ── Maintenance Schedule Occurrences ──────────────────────────────────────────

export const maintenanceScheduleOccurrences = pgTable('maintenance_schedule_occurrences', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  maintenancePlanId: uuid('maintenance_plan_id').notNull().references(() => maintenancePlans.id, { onDelete: 'cascade' }),
  deviceId: uuid('device_id').notNull().references(() => devices.id),

  originalDueDate: timestamp('original_due_date', { withTimezone: true }).notNull(),
  currentDueDate: timestamp('current_due_date', { withTimezone: true }).notNull(),
  dueState: occurrenceDueStateEnum('due_state').default('scheduled').notNull(),

  generatedTaskId: uuid('generated_task_id'),
  generatedAt: timestamp('generated_at', { withTimezone: true }),
  qualifyingRecordId: uuid('qualifying_record_id'),

  deferredAt: timestamp('deferred_at', { withTimezone: true }),
  deferralReason: text('deferral_reason'),
  deferredByUserId: uuid('deferred_by_user_id').references(() => users.id),

  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancellationReason: text('cancellation_reason'),
}, (t) => ({
  planIdx: index('idx_maintenance_occurrences_plan').on(t.maintenancePlanId, t.dueState),
  deviceIdx: index('idx_maintenance_occurrences_device').on(t.deviceId, t.dueState),
  dueDateIdx: index('idx_maintenance_occurrences_due').on(t.currentDueDate, t.dueState),
}));

export const maintenanceScheduleOccurrencesRelations = relations(maintenanceScheduleOccurrences, ({ one }) => ({
  maintenancePlan: one(maintenancePlans, { fields: [maintenanceScheduleOccurrences.maintenancePlanId], references: [maintenancePlans.id] }),
  device: one(devices, { fields: [maintenanceScheduleOccurrences.deviceId], references: [devices.id] }),
  deferredByUser: one(users, { fields: [maintenanceScheduleOccurrences.deferredByUserId], references: [users.id], relationName: 'occurrencesDeferredByUser' }),
}));
