import { z } from 'zod';

// ── Round Status Values ─────────────────────────────────────────────────────────

export const roundStatusValues = ['scheduled', 'in_progress', 'completed', 'missed', 'cancelled'] as const;
export type RoundStatus = (typeof roundStatusValues)[number];

export const roundVisitStatusValues = ['pending', 'completed', 'skipped'] as const;
export type RoundVisitStatus = (typeof roundVisitStatusValues)[number];

export const shiftTypeValues = ['morning', 'evening', 'night'] as const;
export type ShiftType = (typeof shiftTypeValues)[number];

// ── Start Round ─────────────────────────────────────────────────────────────────

export const startRoundSchema = z.object({
  hospitalId: z.string().uuid('Invalid hospital ID'),
  shiftType: z.enum(shiftTypeValues).default('morning'),
  password: z.string().min(1, 'Password is required for electronic signature'),
});

// ── Complete Department Visit ────────────────────────────────────────────────────

export const completeDepartmentVisitSchema = z.object({
  visitId: z.string().uuid('Invalid visit ID'),
  noteText: z.string().max(2000, 'Note must be under 2000 characters').optional(),
  deviceMentions: z.array(z.object({
    deviceId: z.string().uuid(),
    deviceName: z.string(),
    internalCode: z.string(),
  })).optional().default([]),
});

// ── Add Visit Note ──────────────────────────────────────────────────────────────

export const addVisitNoteSchema = z.object({
  visitId: z.string().uuid('Invalid visit ID'),
  noteText: z.string().min(1, 'Note cannot be empty').max(2000, 'Note must be under 2000 characters'),
  deviceMentions: z.array(z.object({
    deviceId: z.string().uuid(),
    deviceName: z.string(),
    internalCode: z.string(),
  })).optional().default([]),
});

// ── Complete Round ──────────────────────────────────────────────────────────────

export const completeRoundSchema = z.object({
  roundId: z.string().uuid('Invalid round ID'),
});

// ── Round History Filters ───────────────────────────────────────────────────────

export const roundHistoryFilterSchema = z.object({
  hospitalId: z.string().uuid().optional(),
  engineerId: z.string().uuid().optional(),
  status: z.enum(roundStatusValues).optional(),
  dateFrom: z.string().optional(), // YYYY-MM-DD
  dateTo: z.string().optional(),   // YYYY-MM-DD
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Calendar Data ───────────────────────────────────────────────────────────────

export const roundCalendarQuerySchema = z.object({
  engineerId: z.string().uuid(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
});
