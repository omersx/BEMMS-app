import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  maintenanceTypeCodeEnum,
  technicalProblemCategoryCodeEnum,
  ticketPriorityCodeEnum,
  maintenanceTaskStatusCodeEnum,
  checklistResultCodeEnum,
} from './enums';
import { organizations } from './organizations';
import { hospitals } from './hospitals';
import { departments } from './departments';
import { locations } from './locations';
import { deviceCategories } from './device-categories';
import { devices } from './devices';
import { serviceTickets } from './tickets';
import { users } from './users';

// ── Checklist Templates ────────────────────────────────────────────────────────

export const checklistTemplates = pgTable('checklist_templates', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  deviceCategoryId: uuid('device_category_id').references(() => deviceCategories.id),
  name: text('name').notNull(),
  code: text('code').unique(),
  maintenanceType: maintenanceTypeCodeEnum('maintenance_type'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgIdx: index('idx_checklist_templates_org').on(t.organizationId),
  deviceCatIdx: index('idx_checklist_templates_category').on(t.deviceCategoryId),
}));

export const checklistTemplatesRelations = relations(checklistTemplates, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [checklistTemplates.organizationId],
    references: [organizations.id],
  }),
  deviceCategory: one(deviceCategories, {
    fields: [checklistTemplates.deviceCategoryId],
    references: [deviceCategories.id],
  }),
  versions: many(checklistTemplateVersions),
}));

// ── Checklist Template Versions ────────────────────────────────────────────────

export const checklistTemplateVersions = pgTable('checklist_template_versions', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  checklistTemplateId: uuid('checklist_template_id').notNull().references(() => checklistTemplates.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  itemsJsonb: jsonb('items_jsonb').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
}, (t) => ({
  templateVersionIdx: index('idx_checklist_template_versions_template').on(t.checklistTemplateId, t.versionNumber),
}));

export const checklistTemplateVersionsRelations = relations(checklistTemplateVersions, ({ one, many }) => ({
  checklistTemplate: one(checklistTemplates, {
    fields: [checklistTemplateVersions.checklistTemplateId],
    references: [checklistTemplates.id],
  }),
  createdByUser: one(users, {
    fields: [checklistTemplateVersions.createdByUserId],
    references: [users.id],
    relationName: 'checklistVersionsCreatedByUser',
  }),
  tasks: many(maintenanceTasks),
}));

// ── Maintenance Tasks ──────────────────────────────────────────────────────────

export const maintenanceTasks = pgTable('maintenance_tasks', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  taskNumber: text('task_number').notNull().unique(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  hospitalId: uuid('hospital_id').notNull().references(() => hospitals.id),
  departmentId: uuid('department_id').references(() => departments.id),
  locationId: uuid('location_id').references(() => locations.id),
  deviceId: uuid('device_id').notNull().references(() => devices.id),
  serviceTicketId: uuid('service_ticket_id').references(() => serviceTickets.id),
  maintenanceScheduleOccurrenceId: uuid('maintenance_schedule_occurrence_id'),
  maintenanceType: maintenanceTypeCodeEnum('maintenance_type').notNull(),
  technicalProblemCategory: technicalProblemCategoryCodeEnum('technical_problem_category'),
  statusCode: maintenanceTaskStatusCodeEnum('status_code').default('assigned').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  assignedEngineerUserId: uuid('assigned_engineer_user_id').references(() => users.id),
  assignedTeamId: uuid('assigned_team_id'),
  priorityCode: ticketPriorityCodeEnum('priority_code').default('p3_normal'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  waitingReason: text('waiting_reason'),
  waitingDependencyType: text('waiting_dependency_type'),
  checklistTemplateVersionId: uuid('checklist_template_version_id').references(() => checklistTemplateVersions.id),
  deviceSnapshot: jsonb('device_snapshot'),
  locationSnapshot: jsonb('location_snapshot'),
  resultRecordId: uuid('result_record_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
}, (t) => ({
  lookupIdx: index('idx_maintenance_tasks_lookup').on(t.organizationId, t.hospitalId, t.departmentId, t.statusCode),
  taskNumIdx: index('idx_maintenance_tasks_number').on(t.organizationId, t.taskNumber),
  deviceIdx: index('idx_maintenance_tasks_device').on(t.deviceId, t.statusCode),
  assigneeIdx: index('idx_maintenance_tasks_assignee').on(t.assignedEngineerUserId, t.statusCode),
  ticketIdx: index('idx_maintenance_tasks_ticket').on(t.serviceTicketId),
  dueIdx: index('idx_maintenance_tasks_due').on(t.organizationId, t.dueDate),
}));

export const maintenanceTasksRelations = relations(maintenanceTasks, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [maintenanceTasks.organizationId],
    references: [organizations.id],
  }),
  hospital: one(hospitals, {
    fields: [maintenanceTasks.hospitalId],
    references: [hospitals.id],
  }),
  department: one(departments, {
    fields: [maintenanceTasks.departmentId],
    references: [departments.id],
  }),
  location: one(locations, {
    fields: [maintenanceTasks.locationId],
    references: [locations.id],
  }),
  device: one(devices, {
    fields: [maintenanceTasks.deviceId],
    references: [devices.id],
  }),
  serviceTicket: one(serviceTickets, {
    fields: [maintenanceTasks.serviceTicketId],
    references: [serviceTickets.id],
  }),
  checklistTemplateVersion: one(checklistTemplateVersions, {
    fields: [maintenanceTasks.checklistTemplateVersionId],
    references: [checklistTemplateVersions.id],
  }),
  assignedEngineer: one(users, {
    fields: [maintenanceTasks.assignedEngineerUserId],
    references: [users.id],
    relationName: 'tasksAssignedToEngineer',
  }),
  createdByUser: one(users, {
    fields: [maintenanceTasks.createdByUserId],
    references: [users.id],
    relationName: 'tasksCreatedByUser',
  }),
  updatedByUser: one(users, {
    fields: [maintenanceTasks.updatedByUserId],
    references: [users.id],
    relationName: 'tasksUpdatedByUser',
  }),
  checklistResults: many(maintenanceChecklistResults),
}));

// ── Maintenance Checklist Results ─────────────────────────────────────────────

export const maintenanceChecklistResults = pgTable('maintenance_checklist_results', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  maintenanceTaskId: uuid('maintenance_task_id').notNull().references(() => maintenanceTasks.id, { onDelete: 'cascade' }),
  maintenanceRecordId: uuid('maintenance_record_id'),
  templateItemId: text('template_item_id').notNull(),
  itemLabelSnapshot: text('item_label_snapshot').notNull(),
  itemOrder: integer('item_order').notNull(),
  resultCode: checklistResultCodeEnum('result_code'),
  measuredValue: text('measured_value'),
  unit: text('unit'),
  notes: text('notes'),
  performedByUserId: uuid('performed_by_user_id').references(() => users.id),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (t) => ({
  taskItemIdx: index('idx_checklist_results_task').on(t.maintenanceTaskId, t.itemOrder),
  recordIdx: index('idx_checklist_results_record').on(t.maintenanceRecordId),
}));

export const maintenanceChecklistResultsRelations = relations(maintenanceChecklistResults, ({ one }) => ({
  maintenanceTask: one(maintenanceTasks, {
    fields: [maintenanceChecklistResults.maintenanceTaskId],
    references: [maintenanceTasks.id],
  }),
  performedByUser: one(users, {
    fields: [maintenanceChecklistResults.performedByUserId],
    references: [users.id],
    relationName: 'checklistResultsPerformedByUser',
  }),
}));
