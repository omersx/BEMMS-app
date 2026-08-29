import { pgTable, uuid, text, timestamp, integer, boolean, AnyPgColumn, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  maintenanceTypeCodeEnum,
  technicalProblemCategoryCodeEnum,
  maintenanceFinalResultCodeEnum,
  deviceStatusCodeEnum,
  costTypeEnum,
} from './enums';
import { organizations } from './organizations';
import { devices } from './devices';
import { maintenanceTasks } from './maintenance-tasks';
import { serviceTickets } from './tickets';
import { users } from './users';

// ── Maintenance Records ───────────────────────────────────────────────────────

export const maintenanceRecords = pgTable('maintenance_records', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  recordNumber: text('record_number').notNull().unique(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  deviceId: uuid('device_id').notNull().references(() => devices.id),
  maintenanceTaskId: uuid('maintenance_task_id').notNull().references(() => maintenanceTasks.id),
  serviceTicketId: uuid('service_ticket_id').references(() => serviceTickets.id),
  maintenanceType: maintenanceTypeCodeEnum('maintenance_type').notNull(),
  technicalCategory: technicalProblemCategoryCodeEnum('technical_category'),
  diagnosis: text('diagnosis'),
  rootCause: text('root_cause'),
  workPerformed: text('work_performed'),
  findings: text('findings'),
  recommendations: text('recommendations'),
  finalResultCode: maintenanceFinalResultCodeEnum('final_result_code').notNull(),
  finalDeviceStatusCode: deviceStatusCodeEnum('final_device_status_code').notNull(),
  calibrationCertificateNumber: text('calibration_certificate_number'),
  calibrationValidUntil: timestamp('calibration_valid_until', { withTimezone: true }),
  nextMaintenanceDateProposal: timestamp('next_maintenance_date_proposal', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }).notNull(),
  currentVersionNumber: integer('current_version_number').default(1).notNull(),
  isFinalized: boolean('is_finalized').default(false).notNull(),
  isAmended: boolean('is_amended').default(false).notNull(),
  originalRecordId: uuid('original_record_id').references((): AnyPgColumn => maintenanceRecords.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  deviceIdx: index('idx_maintenance_records_device').on(t.deviceId, t.completedAt),
  recordNumIdx: index('idx_maintenance_records_number').on(t.organizationId, t.recordNumber),
  taskIdx: index('idx_maintenance_records_task').on(t.maintenanceTaskId),
  ticketIdx: index('idx_maintenance_records_ticket').on(t.serviceTicketId),
  lookupIdx: index('idx_maintenance_records_lookup').on(t.organizationId, t.finalResultCode),
  calValidIdx: index('idx_maintenance_records_cal_valid').on(t.calibrationValidUntil),
}));

export const maintenanceRecordsRelations = relations(maintenanceRecords, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [maintenanceRecords.organizationId],
    references: [organizations.id],
  }),
  device: one(devices, {
    fields: [maintenanceRecords.deviceId],
    references: [devices.id],
  }),
  maintenanceTask: one(maintenanceTasks, {
    fields: [maintenanceRecords.maintenanceTaskId],
    references: [maintenanceTasks.id],
  }),
  serviceTicket: one(serviceTickets, {
    fields: [maintenanceRecords.serviceTicketId],
    references: [serviceTickets.id],
  }),
  createdByUser: one(users, {
    fields: [maintenanceRecords.createdByUserId],
    references: [users.id],
    relationName: 'maintenanceRecordsCreatedByUser',
  }),
  originalRecord: one(maintenanceRecords, {
    fields: [maintenanceRecords.originalRecordId],
    references: [maintenanceRecords.id],
    relationName: 'maintenanceRecordAmendments',
  }),
  amendments: many(maintenanceRecords, {
    relationName: 'maintenanceRecordAmendments',
  }),
  parts: many(maintenanceParts),
  costs: many(maintenanceCosts),
}));

// ── Maintenance Parts ─────────────────────────────────────────────────────────

export const maintenanceParts = pgTable('maintenance_parts', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  maintenanceTaskId: uuid('maintenance_task_id').notNull().references(() => maintenanceTasks.id),
  maintenanceRecordId: uuid('maintenance_record_id').references(() => maintenanceRecords.id),
  partNumber: text('part_number').notNull(),
  partName: text('part_name').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  unitCost: integer('unit_cost'),
  currency: text('currency').default('USD'),
  supplierName: text('supplier_name'),
  notes: text('notes'),
  recordedByUserId: uuid('recorded_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  taskIdx: index('idx_maintenance_parts_task').on(t.maintenanceTaskId),
  recordIdx: index('idx_maintenance_parts_record').on(t.maintenanceRecordId),
  partNumIdx: index('idx_maintenance_parts_number').on(t.partNumber),
}));

export const maintenancePartsRelations = relations(maintenanceParts, ({ one }) => ({
  maintenanceTask: one(maintenanceTasks, {
    fields: [maintenanceParts.maintenanceTaskId],
    references: [maintenanceTasks.id],
  }),
  maintenanceRecord: one(maintenanceRecords, {
    fields: [maintenanceParts.maintenanceRecordId],
    references: [maintenanceRecords.id],
  }),
  recordedByUser: one(users, {
    fields: [maintenanceParts.recordedByUserId],
    references: [users.id],
    relationName: 'maintenancePartsRecordedByUser',
  }),
}));

// ── Maintenance Costs ─────────────────────────────────────────────────────────

export const maintenanceCosts = pgTable('maintenance_costs', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  maintenanceTaskId: uuid('maintenance_task_id').notNull().references(() => maintenanceTasks.id),
  maintenanceRecordId: uuid('maintenance_record_id').references(() => maintenanceRecords.id),
  costType: costTypeEnum('cost_type').notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').default('USD'),
  vendorName: text('vendor_name'),
  invoiceNumber: text('invoice_number'),
  description: text('description'),
  recordedByUserId: uuid('recorded_by_user_id').references(() => users.id),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  taskIdx: index('idx_maintenance_costs_task').on(t.maintenanceTaskId),
  recordIdx: index('idx_maintenance_costs_record').on(t.maintenanceRecordId),
  costTypeIdx: index('idx_maintenance_costs_type').on(t.costType),
}));

export const maintenanceCostsRelations = relations(maintenanceCosts, ({ one }) => ({
  maintenanceTask: one(maintenanceTasks, {
    fields: [maintenanceCosts.maintenanceTaskId],
    references: [maintenanceTasks.id],
  }),
  maintenanceRecord: one(maintenanceRecords, {
    fields: [maintenanceCosts.maintenanceRecordId],
    references: [maintenanceRecords.id],
  }),
  recordedByUser: one(users, {
    fields: [maintenanceCosts.recordedByUserId],
    references: [users.id],
    relationName: 'maintenanceCostsRecordedByUser',
  }),
}));
