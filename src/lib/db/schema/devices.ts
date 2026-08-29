import { pgTable, uuid, text, timestamp, date, numeric, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  deviceStatusCodeEnum, deviceLifecycleStatusEnum,
  criticalityLevelEnum, riskClassificationEnum,
  qrLabelStatusEnum, deviceDocumentCategoryEnum,
  documentVisibilityEnum, transferReasonEnum,
} from './enums';
import { organizations } from './organizations';
import { hospitals } from './hospitals';
import { departments } from './departments';
import { locations } from './locations';
import { users } from './users';
import { deviceCategories } from './device-categories';
import { manufacturers, deviceModels } from './manufacturers';

// ── Core Devices Table ──────────────────────────────────────────────────────────

export const devices = pgTable('devices', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  hospitalId: uuid('hospital_id').notNull().references(() => hospitals.id),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  locationId: uuid('location_id').references(() => locations.id),
  exactLocationDescription: text('exact_location_description'),

  internalCode: text('internal_code').notNull(),
  assetNumber: text('asset_number').notNull(),
  serialNumber: text('serial_number'),
  name: text('name').notNull(),

  deviceCategoryId: uuid('device_category_id').notNull().references(() => deviceCategories.id),
  manufacturerId: uuid('manufacturer_id').references(() => manufacturers.id),
  deviceModelId: uuid('device_model_id').references(() => deviceModels.id),
  modelNameFree: text('model_name_free'),

  criticalityLevel: criticalityLevelEnum('criticality_level').default('medium'),
  riskClassification: riskClassificationEnum('risk_classification'),

  currentStatusCode: deviceStatusCodeEnum('current_status_code').default('operational').notNull(),
  statusChangedAt: timestamp('status_changed_at', { withTimezone: true }),
  statusChangedByUserId: uuid('status_changed_by_user_id').references(() => users.id),
  statusLimitationsNote: text('status_limitations_note'),

  purchaseDate: date('purchase_date'),
  purchaseCost: numeric('purchase_cost', { precision: 12, scale: 2 }),
  currency: text('currency').default('USD'),
  installationDate: date('installation_date'),
  commissioningDate: date('commissioning_date'),
  warrantyStartDate: date('warranty_start_date'),
  warrantyEndDate: date('warranty_end_date'),

  technicalSpecifications: jsonb('technical_specifications'),

  assignedEngineerUserId: uuid('assigned_engineer_user_id').references(() => users.id),

  nextPmDueDate: date('next_pm_due_date'),
  lastMaintenanceCompletedAt: timestamp('last_maintenance_completed_at', { withTimezone: true }),
  calibrationExpiresOn: date('calibration_expires_on'),

  lifecycleStatus: deviceLifecycleStatusEnum('lifecycle_status').default('active').notNull(),
  decommissionedAt: timestamp('decommissioned_at', { withTimezone: true }),
  decommissionedByUserId: uuid('decommissioned_by_user_id').references(() => users.id),
  decommissionReason: text('decommission_reason'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  archivedByUserId: uuid('archived_by_user_id').references(() => users.id),
  archiveReason: text('archive_reason'),
}, (t) => ({
  lookupIdx: index('idx_devices_lookup').on(t.organizationId, t.hospitalId, t.departmentId, t.currentStatusCode),
  pmDueIdx: index('idx_devices_pm_due').on(t.organizationId, t.nextPmDueDate),
  internalCodeIdx: index('idx_devices_internal_code').on(t.organizationId, t.internalCode),
  assetNumberIdx: index('idx_devices_asset_number').on(t.organizationId, t.assetNumber),
}));

export const devicesRelations = relations(devices, ({ one }) => ({
  organization: one(organizations, { fields: [devices.organizationId], references: [organizations.id] }),
  hospital: one(hospitals, { fields: [devices.hospitalId], references: [hospitals.id] }),
  department: one(departments, { fields: [devices.departmentId], references: [departments.id] }),
  location: one(locations, { fields: [devices.locationId], references: [locations.id] }),
  deviceCategory: one(deviceCategories, { fields: [devices.deviceCategoryId], references: [deviceCategories.id] }),
  manufacturer: one(manufacturers, { fields: [devices.manufacturerId], references: [manufacturers.id] }),
  deviceModel: one(deviceModels, { fields: [devices.deviceModelId], references: [deviceModels.id] }),
  assignedEngineer: one(users, { fields: [devices.assignedEngineerUserId], references: [users.id], relationName: 'devicesAssignedToEngineer' }),
  createdByUser: one(users, { fields: [devices.createdByUserId], references: [users.id], relationName: 'devicesCreatedByUser' }),
}));

// ── QR Labels ───────────────────────────────────────────────────────────────────

export const deviceQrLabels = pgTable('device_qr_labels', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  deviceId: uuid('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
  opaqueReference: text('opaque_reference').notNull().unique(),
  labelStatus: qrLabelStatusEnum('label_status').default('active').notNull(),
  printedAt: timestamp('printed_at', { withTimezone: true }),
  printedByUserId: uuid('printed_by_user_id').references(() => users.id),
  printCount: integer('print_count').default(0),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  revokedByUserId: uuid('revoked_by_user_id').references(() => users.id),
  revocationReason: text('revocation_reason'),
  replacedByQrId: uuid('replaced_by_qr_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
}, (t) => ({
  deviceActiveIdx: index('idx_device_qr_active').on(t.deviceId, t.labelStatus),
}));

export const deviceQrLabelsRelations = relations(deviceQrLabels, ({ one }) => ({
  device: one(devices, { fields: [deviceQrLabels.deviceId], references: [devices.id] }),
  organization: one(organizations, { fields: [deviceQrLabels.organizationId], references: [organizations.id] }),
  printedByUser: one(users, { fields: [deviceQrLabels.printedByUserId], references: [users.id], relationName: 'qrPrintedByUser' }),
}));

// ── Status History (append-only) ────────────────────────────────────────────────

export const deviceStatusHistory = pgTable('device_status_history', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  deviceId: uuid('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
  previousStatusCode: text('previous_status_code'),
  newStatusCode: text('new_status_code').notNull(),
  reason: text('reason'),
  notes: text('notes'),
  effectiveAt: timestamp('effective_at', { withTimezone: true }).defaultNow().notNull(),
  changedByUserId: uuid('changed_by_user_id').notNull().references(() => users.id),
  relatedTicketId: uuid('related_ticket_id'),
  relatedMaintenanceRecordId: uuid('related_maintenance_record_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  deviceTimeIdx: index('idx_device_status_history_device').on(t.deviceId, t.effectiveAt),
}));

export const deviceStatusHistoryRelations = relations(deviceStatusHistory, ({ one }) => ({
  device: one(devices, { fields: [deviceStatusHistory.deviceId], references: [devices.id] }),
  changedByUser: one(users, { fields: [deviceStatusHistory.changedByUserId], references: [users.id], relationName: 'statusChangedByUser' }),
}));

// ── Location History (append-only) ──────────────────────────────────────────────

export const deviceLocationHistory = pgTable('device_location_history', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  deviceId: uuid('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
  previousHospitalId: uuid('previous_hospital_id'),
  previousDepartmentId: uuid('previous_department_id'),
  previousLocationId: uuid('previous_location_id'),
  newHospitalId: uuid('new_hospital_id').notNull(),
  newDepartmentId: uuid('new_department_id').notNull(),
  newLocationId: uuid('new_location_id'),
  transferReason: transferReasonEnum('transfer_reason').notNull(),
  notes: text('notes'),
  effectiveAt: timestamp('effective_at', { withTimezone: true }).defaultNow().notNull(),
  changedByUserId: uuid('changed_by_user_id').notNull().references(() => users.id),
  relatedTicketId: uuid('related_ticket_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  deviceTimeIdx: index('idx_device_location_history_device').on(t.deviceId, t.effectiveAt),
}));

export const deviceLocationHistoryRelations = relations(deviceLocationHistory, ({ one }) => ({
  device: one(devices, { fields: [deviceLocationHistory.deviceId], references: [devices.id] }),
  changedByUser: one(users, { fields: [deviceLocationHistory.changedByUserId], references: [users.id], relationName: 'locationChangedByUser' }),
  newHospital: one(hospitals, { fields: [deviceLocationHistory.newHospitalId], references: [hospitals.id] }),
  newDepartment: one(departments, { fields: [deviceLocationHistory.newDepartmentId], references: [departments.id] }),
}));

// ── Device Attachments ──────────────────────────────────────────────────────────

export const deviceAttachments = pgTable('device_attachments', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  deviceId: uuid('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
  documentCategory: deviceDocumentCategoryEnum('document_category').notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  storageKey: text('storage_key').notNull(),
  visibility: documentVisibilityEnum('visibility').default('biomedical_only'),
  uploadedByUserId: uuid('uploaded_by_user_id').references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
}, (t) => ({
  deviceIdx: index('idx_device_attachments_device').on(t.deviceId),
}));

export const deviceAttachmentsRelations = relations(deviceAttachments, ({ one }) => ({
  device: one(devices, { fields: [deviceAttachments.deviceId], references: [devices.id] }),
  uploadedByUser: one(users, { fields: [deviceAttachments.uploadedByUserId], references: [users.id], relationName: 'attachmentsUploadedByUser' }),
}));
