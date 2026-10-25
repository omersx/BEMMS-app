import { describe, it, expect } from 'vitest';
import {
  startRoundSchema,
  completeDepartmentVisitSchema,
  addVisitNoteSchema,
  completeRoundSchema,
  roundHistoryFilterSchema,
  roundCalendarQuerySchema,
} from '../engineer-rounds';
import { featuresSettingsSchema, systemSettingsSchema } from '../system-settings';

describe('featuresSettingsSchema', () => {
  it('defaults engineerRoundEnabled to false', () => {
    const result = featuresSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.engineerRoundEnabled).toBe(false);
    }
  });

  it('accepts explicitly enabled engineerRoundEnabled', () => {
    const result = featuresSettingsSchema.safeParse({ engineerRoundEnabled: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.engineerRoundEnabled).toBe(true);
    }
  });

  it('integrates cleanly into systemSettingsSchema', () => {
    const result = systemSettingsSchema.safeParse({
      features: { engineerRoundEnabled: true },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.features.engineerRoundEnabled).toBe(true);
    }
  });
});

describe('startRoundSchema', () => {
  it('accepts valid start round payload with password signature', () => {
    const result = startRoundSchema.safeParse({
      hospitalId: '123e4567-e89b-12d3-a456-426614174000',
      shiftType: 'morning',
      password: 'MySecretPassword123!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing password for e-signature', () => {
    const result = startRoundSchema.safeParse({
      hospitalId: '123e4567-e89b-12d3-a456-426614174000',
      shiftType: 'morning',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid hospital UUID', () => {
    const result = startRoundSchema.safeParse({
      hospitalId: 'invalid-uuid',
      shiftType: 'evening',
      password: 'valid-password',
    });
    expect(result.success).toBe(false);
  });

  it('defaults shiftType to morning if omitted', () => {
    const result = startRoundSchema.safeParse({
      hospitalId: '123e4567-e89b-12d3-a456-426614174000',
      password: 'valid-password',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.shiftType).toBe('morning');
    }
  });
});

describe('completeDepartmentVisitSchema', () => {
  it('accepts completion with optional note and @device mentions', () => {
    const result = completeDepartmentVisitSchema.safeParse({
      visitId: '123e4567-e89b-12d3-a456-426614174001',
      noteText: 'Checked ventilator, all operating within specifications.',
      deviceMentions: [
        {
          deviceId: '123e4567-e89b-12d3-a456-426614174002',
          deviceName: 'Ventilator 01',
          internalCode: 'ICU-VENT-01',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts completion without note (quick completion)', () => {
    const result = completeDepartmentVisitSchema.safeParse({
      visitId: '123e4567-e89b-12d3-a456-426614174001',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid visitId UUID', () => {
    const result = completeDepartmentVisitSchema.safeParse({
      visitId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

describe('addVisitNoteSchema', () => {
  it('accepts non-empty note with device mentions', () => {
    const result = addVisitNoteSchema.safeParse({
      visitId: '123e4567-e89b-12d3-a456-426614174001',
      noteText: 'Replaced backup battery on @Monitor-02',
      deviceMentions: [
        {
          deviceId: '123e4567-e89b-12d3-a456-426614174003',
          deviceName: 'Monitor-02',
          internalCode: 'EMERG-MON-02',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty note', () => {
    const result = addVisitNoteSchema.safeParse({
      visitId: '123e4567-e89b-12d3-a456-426614174001',
      noteText: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('roundCalendarQuerySchema', () => {
  it('accepts valid month and year', () => {
    const result = roundCalendarQuerySchema.safeParse({
      engineerId: '123e4567-e89b-12d3-a456-426614174000',
      month: 10,
      year: 2026,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid month numbers', () => {
    const result = roundCalendarQuerySchema.safeParse({
      engineerId: '123e4567-e89b-12d3-a456-426614174000',
      month: 13,
      year: 2026,
    });
    expect(result.success).toBe(false);
  });
});

describe('completeRoundSchema', () => {
  it('accepts valid round UUID', () => {
    const result = completeRoundSchema.safeParse({
      roundId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid round UUID', () => {
    const result = completeRoundSchema.safeParse({
      roundId: 'not-valid',
    });
    expect(result.success).toBe(false);
  });
});
