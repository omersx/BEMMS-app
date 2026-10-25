import { pgTable, uuid, text, timestamp, integer, jsonb, index, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { roundStatusEnum, roundVisitStatusEnum } from './enums';
import { organizations } from './organizations';
import { hospitals } from './hospitals';
import { departments } from './departments';
import { users } from './users';
import { electronicSignatures } from './signatures';

// ── Engineer Rounds ─────────────────────────────────────────────────────────────

export const engineerRounds = pgTable('engineer_rounds', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  hospitalId: uuid('hospital_id').notNull().references(() => hospitals.id),
  engineerId: uuid('engineer_id').notNull().references(() => users.id),
  roundDate: date('round_date').notNull(),
  shiftType: text('shift_type').notNull().default('morning'), // 'morning', 'evening', 'night'
  status: roundStatusEnum('status').default('scheduled').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  startSignatureId: uuid('start_signature_id').references(() => electronicSignatures.id),
  totalDepartments: integer('total_departments').default(0).notNull(),
  completedDepartments: integer('completed_departments').default(0).notNull(),
  totalIssuesReported: integer('total_issues_reported').default(0).notNull(),
  totalNotes: integer('total_notes').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  lookupIdx: index('idx_engineer_rounds_lookup').on(t.organizationId, t.hospitalId, t.engineerId, t.roundDate),
  dateIdx: index('idx_engineer_rounds_date').on(t.organizationId, t.roundDate, t.status),
  engineerIdx: index('idx_engineer_rounds_engineer').on(t.engineerId, t.roundDate),
}));

// ── Round Department Visits ─────────────────────────────────────────────────────

export const roundDepartmentVisits = pgTable('round_department_visits', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  roundId: uuid('round_id').notNull().references(() => engineerRounds.id, { onDelete: 'cascade' }),
  departmentId: uuid('department_id').notNull().references(() => departments.id),
  departmentName: text('department_name').notNull(), // Snapshot for historical reference
  sequence: integer('sequence').notNull().default(0),
  status: roundVisitStatusEnum('status').default('pending').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  roundIdx: index('idx_round_visits_round').on(t.roundId, t.sequence),
  deptIdx: index('idx_round_visits_dept').on(t.departmentId, t.roundId),
}));

// ── Round Visit Notes ───────────────────────────────────────────────────────────

export const roundVisitNotes = pgTable('round_visit_notes', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  visitId: uuid('visit_id').notNull().references(() => roundDepartmentVisits.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => users.id),
  noteText: text('note_text').notNull(),
  // Stores parsed @device mentions: [{ deviceId, deviceName, internalCode }]
  deviceMentions: jsonb('device_mentions').$type<Array<{
    deviceId: string;
    deviceName: string;
    internalCode: string;
  }>>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  visitIdx: index('idx_round_notes_visit').on(t.visitId),
}));

// ── Relations ───────────────────────────────────────────────────────────────────

export const engineerRoundsRelations = relations(engineerRounds, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [engineerRounds.organizationId],
    references: [organizations.id],
  }),
  hospital: one(hospitals, {
    fields: [engineerRounds.hospitalId],
    references: [hospitals.id],
  }),
  engineer: one(users, {
    fields: [engineerRounds.engineerId],
    references: [users.id],
    relationName: 'roundsPerformedByEngineer',
  }),
  startSignature: one(electronicSignatures, {
    fields: [engineerRounds.startSignatureId],
    references: [electronicSignatures.id],
  }),
  departmentVisits: many(roundDepartmentVisits),
}));

export const roundDepartmentVisitsRelations = relations(roundDepartmentVisits, ({ one, many }) => ({
  round: one(engineerRounds, {
    fields: [roundDepartmentVisits.roundId],
    references: [engineerRounds.id],
  }),
  department: one(departments, {
    fields: [roundDepartmentVisits.departmentId],
    references: [departments.id],
  }),
  notes: many(roundVisitNotes),
}));

export const roundVisitNotesRelations = relations(roundVisitNotes, ({ one }) => ({
  visit: one(roundDepartmentVisits, {
    fields: [roundVisitNotes.visitId],
    references: [roundDepartmentVisits.id],
  }),
  author: one(users, {
    fields: [roundVisitNotes.authorId],
    references: [users.id],
    relationName: 'roundNotesAuthored',
  }),
}));
