import { pgTable, uuid, text, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  ticketStatusCodeEnum, ticketPriorityCodeEnum, ticketTypeCodeEnum,
  ticketSourceEnum, reportedImpactCodeEnum, reporterProblemCategoryCodeEnum,
  maintenanceTypeCodeEnum, technicalProblemCategoryCodeEnum,
  ticketCommentVisibilityEnum, ticketEventTypeEnum, deviceStatusCodeEnum,
} from './enums';
import { organizations } from './organizations';
import { hospitals } from './hospitals';
import { departments } from './departments';
import { locations } from './locations';
import { users } from './users';
import { devices } from './devices';

// ── Service Tickets ─────────────────────────────────────────────────────────────

export const serviceTickets = pgTable('service_tickets', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  ticketNumber: text('ticket_number').notNull().unique(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),

  // Device & Location Context
  deviceId: uuid('device_id').references(() => devices.id),
  hospitalId: uuid('hospital_id').notNull().references(() => hospitals.id),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  locationId: uuid('location_id').references(() => locations.id),
  exactLocationDescription: text('exact_location_description'),
  deviceSnapshot: jsonb('device_snapshot'),
  locationSnapshot: jsonb('location_snapshot'),

  // Source & Original Report
  source: ticketSourceEnum('source').notNull(),
  ticketType: ticketTypeCodeEnum('ticket_type').default('device_problem').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  reportedProblemCategory: reporterProblemCategoryCodeEnum('reported_problem_category'),
  reportedImpact: reportedImpactCodeEnum('reported_impact').notNull(),
  reportedLocationCorrection: text('reported_location_correction'),
  requesterContactName: text('requester_contact_name'),
  requesterContactPhone: text('requester_contact_phone'),
  reportedByUserId: uuid('reported_by_user_id').notNull().references(() => users.id),
  reportedAt: timestamp('reported_at', { withTimezone: true }).defaultNow().notNull(),

  // Triage & Engineering Classification
  statusCode: ticketStatusCodeEnum('status_code').default('new').notNull(),
  priorityCode: ticketPriorityCodeEnum('priority_code').default('p3_normal').notNull(),
  priorityReason: text('priority_reason'),
  triagedByUserId: uuid('triaged_by_user_id').references(() => users.id),
  triagedAt: timestamp('triaged_at', { withTimezone: true }),
  selectedMaintenanceType: maintenanceTypeCodeEnum('selected_maintenance_type'),
  selectedTechnicalCategory: technicalProblemCategoryCodeEnum('selected_technical_category'),
  internalTriageNote: text('internal_triage_note'),

  // Assignment & SLA
  assignedEngineerUserId: uuid('assigned_engineer_user_id').references(() => users.id),
  assignedTeamId: uuid('assigned_team_id'),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  responseTargetAt: timestamp('response_target_at', { withTimezone: true }),
  resolutionTargetAt: timestamp('resolution_target_at', { withTimezone: true }),

  // Work & Resolution
  waitingReason: text('waiting_reason'),
  waitingDependencyType: text('waiting_dependency_type'),
  resolutionSummary: text('resolution_summary'),
  finalDeviceStatusCode: deviceStatusCodeEnum('final_device_status_code'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedByUserId: uuid('resolved_by_user_id').references(() => users.id),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  closedByUserId: uuid('closed_by_user_id').references(() => users.id),
  closureReason: text('closure_reason'),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelledByUserId: uuid('cancelled_by_user_id').references(() => users.id),
  cancellationReason: text('cancellation_reason'),
  reopenedAt: timestamp('reopened_at', { withTimezone: true }),
  reopenedByUserId: uuid('reopened_by_user_id').references(() => users.id),
  reopenReason: text('reopen_reason'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  lookupIdx: index('idx_tickets_lookup').on(t.organizationId, t.hospitalId, t.departmentId, t.statusCode),
  ticketNumIdx: index('idx_tickets_number').on(t.organizationId, t.ticketNumber),
  deviceIdx: index('idx_tickets_device').on(t.deviceId, t.statusCode),
  assigneeIdx: index('idx_tickets_assignee').on(t.assignedEngineerUserId, t.statusCode),
  reporterIdx: index('idx_tickets_reporter').on(t.reportedByUserId),
}));

export const serviceTicketsRelations = relations(serviceTickets, ({ one }) => ({
  organization: one(organizations, { fields: [serviceTickets.organizationId], references: [organizations.id] }),
  device: one(devices, { fields: [serviceTickets.deviceId], references: [devices.id] }),
  hospital: one(hospitals, { fields: [serviceTickets.hospitalId], references: [hospitals.id] }),
  department: one(departments, { fields: [serviceTickets.departmentId], references: [departments.id] }),
  location: one(locations, { fields: [serviceTickets.locationId], references: [locations.id] }),
  reportedByUser: one(users, { fields: [serviceTickets.reportedByUserId], references: [users.id], relationName: 'ticketsReportedByUser' }),
  triagedByUser: one(users, { fields: [serviceTickets.triagedByUserId], references: [users.id], relationName: 'ticketsTriagedByUser' }),
  assignedEngineer: one(users, { fields: [serviceTickets.assignedEngineerUserId], references: [users.id], relationName: 'ticketsAssignedToEngineer' }),
  resolvedByUser: one(users, { fields: [serviceTickets.resolvedByUserId], references: [users.id], relationName: 'ticketsResolvedByUser' }),
  closedByUser: one(users, { fields: [serviceTickets.closedByUserId], references: [users.id], relationName: 'ticketsClosedByUser' }),
}));

// ── Ticket Comments ─────────────────────────────────────────────────────────────

export const serviceTicketComments = pgTable('service_ticket_comments', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  serviceTicketId: uuid('service_ticket_id').notNull().references(() => serviceTickets.id, { onDelete: 'cascade' }),
  authorUserId: uuid('author_user_id').notNull().references(() => users.id),
  visibility: ticketCommentVisibilityEnum('visibility').default('public').notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  editedAt: timestamp('edited_at', { withTimezone: true }),
  editedByUserId: uuid('edited_by_user_id').references(() => users.id),
}, (t) => ({
  ticketTimeIdx: index('idx_ticket_comments_ticket').on(t.serviceTicketId, t.createdAt),
}));

export const serviceTicketCommentsRelations = relations(serviceTicketComments, ({ one }) => ({
  serviceTicket: one(serviceTickets, { fields: [serviceTicketComments.serviceTicketId], references: [serviceTickets.id] }),
  author: one(users, { fields: [serviceTicketComments.authorUserId], references: [users.id], relationName: 'ticketCommentsAuthor' }),
}));

// ── Ticket Events (append-only timeline) ────────────────────────────────────────

export const serviceTicketEvents = pgTable('service_ticket_events', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  serviceTicketId: uuid('service_ticket_id').notNull().references(() => serviceTickets.id, { onDelete: 'cascade' }),
  eventType: ticketEventTypeEnum('event_type').notNull(),
  previousValueJsonb: jsonb('previous_value_jsonb'),
  newValueJsonb: jsonb('new_value_jsonb'),
  visibility: ticketCommentVisibilityEnum('visibility').default('public').notNull(),
  reason: text('reason'),
  actorUserId: uuid('actor_user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  relatedMaintenanceTaskId: uuid('related_maintenance_task_id'),
}, (t) => ({
  ticketTimeIdx: index('idx_ticket_events_ticket').on(t.serviceTicketId, t.createdAt),
}));

export const serviceTicketEventsRelations = relations(serviceTicketEvents, ({ one }) => ({
  serviceTicket: one(serviceTickets, { fields: [serviceTicketEvents.serviceTicketId], references: [serviceTickets.id] }),
  actor: one(users, { fields: [serviceTicketEvents.actorUserId], references: [users.id], relationName: 'ticketEventsActor' }),
}));

// ── Ticket Attachments ──────────────────────────────────────────────────────────

export const serviceTicketAttachments = pgTable('service_ticket_attachments', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  serviceTicketId: uuid('service_ticket_id').notNull().references(() => serviceTickets.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  storageKey: text('storage_key').notNull(),
  visibility: ticketCommentVisibilityEnum('visibility').default('public').notNull(),
  uploadedByUserId: uuid('uploaded_by_user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ticketIdx: index('idx_ticket_attachments_ticket').on(t.serviceTicketId),
}));

export const serviceTicketAttachmentsRelations = relations(serviceTicketAttachments, ({ one }) => ({
  serviceTicket: one(serviceTickets, { fields: [serviceTicketAttachments.serviceTicketId], references: [serviceTickets.id] }),
  uploadedByUser: one(users, { fields: [serviceTicketAttachments.uploadedByUserId], references: [users.id], relationName: 'ticketAttachmentsUploader' }),
}));
