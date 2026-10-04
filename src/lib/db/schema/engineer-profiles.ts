import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { organizations } from './organizations';
import { hospitals } from './hospitals';

export const engineerDutyStatusValues = ['on_duty', 'on_call', 'in_maintenance', 'off_duty'] as const;
export type EngineerDutyStatus = (typeof engineerDutyStatusValues)[number];

export const engineerProfiles = pgTable('engineer_profiles', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  hospitalId: uuid('hospital_id').references(() => hospitals.id),
  jobTitle: text('job_title').notNull().default('Biomedical Engineer'),
  specialization: text('specialization').default('General Biomedical Engineering'),
  extension: text('extension'),
  mobileNumber: text('mobile_number'),
  dutyStatus: text('duty_status').$type<EngineerDutyStatus>().default('on_duty').notNull(),
  shiftHours: text('shift_hours').default('08:00 AM - 04:00 PM'),
  workingDays: jsonb('working_days').$type<string[]>().default(['Sun', 'Mon', 'Tue', 'Wed', 'Thu']),
  onCallDays: jsonb('on_call_days').$type<string[]>().default([]),
  coveredDepartmentIds: jsonb('covered_department_ids').$type<string[]>().default([]),
  emergencyPriority: text('emergency_priority').default('first_responder'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const engineerDutyShifts = pgTable('engineer_duty_shifts', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  engineerProfileId: uuid('engineer_profile_id').notNull().references(() => engineerProfiles.id, { onDelete: 'cascade' }),
  shiftDate: text('shift_date').notNull(), // 'YYYY-MM-DD'
  shiftType: text('shift_type').notNull().default('morning'), // 'morning', 'evening', 'night', 'on_call', 'off'
  startTime: text('start_time'),
  endTime: text('end_time'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const engineerProfilesRelations = relations(engineerProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [engineerProfiles.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [engineerProfiles.organizationId],
    references: [organizations.id],
  }),
  hospital: one(hospitals, {
    fields: [engineerProfiles.hospitalId],
    references: [hospitals.id],
  }),
  dutyShifts: many(engineerDutyShifts),
}));

export const engineerDutyShiftsRelations = relations(engineerDutyShifts, ({ one }) => ({
  engineerProfile: one(engineerProfiles, {
    fields: [engineerDutyShifts.engineerProfileId],
    references: [engineerProfiles.id],
  }),
}));
