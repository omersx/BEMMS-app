import { describe, it, expect } from 'vitest';
import {
  createTicketSchema,
  triageTicketSchema,
  resolveTicketSchema,
  updateTicketDeviceStatusSchema,
} from '../tickets';

describe('createTicketSchema', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  it('validates a valid ticket creation request', () => {
    const result = createTicketSchema.safeParse({
      organizationId: validUuid,
      hospitalId: validUuid,
      departmentId: validUuid,
      source: 'qr_scan',
      ticketType: 'device_problem',
      title: 'Display screen flickering constantly',
      description: 'The unit screen flickers on startup and powers off unexpectedly after 5 minutes.',
      reportedImpact: 'device_not_usable',
      reportedProblemCategory: 'display_interface',
    });
    expect(result.success).toBe(true);
  });

  it('rejects title shorter than 5 characters', () => {
    const result = createTicketSchema.safeParse({
      organizationId: validUuid,
      hospitalId: validUuid,
      departmentId: validUuid,
      source: 'manual_entry',
      title: 'Bad',
      description: 'The device is completely broken and unusable.',
      reportedImpact: 'device_not_usable',
    });
    expect(result.success).toBe(false);
  });

  it('rejects description shorter than 10 characters', () => {
    const result = createTicketSchema.safeParse({
      organizationId: validUuid,
      hospitalId: validUuid,
      departmentId: validUuid,
      source: 'manual_entry',
      title: 'Broken button on front panel',
      description: 'Broken',
      reportedImpact: 'device_usable',
    });
    expect(result.success).toBe(false);
  });
});

describe('triageTicketSchema', () => {
  it('validates a triage assignment', () => {
    const result = triageTicketSchema.safeParse({
      priorityCode: 'p1_critical',
      priorityReason: 'Life support equipment non-functional in ICU',
      selectedMaintenanceType: 'corrective_maintenance',
      selectedTechnicalCategory: 'electrical_power',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid priority code', () => {
    const result = triageTicketSchema.safeParse({
      priorityCode: 'urgent',
    });
    expect(result.success).toBe(false);
  });
});

describe('resolveTicketSchema', () => {
  it('accepts valid resolution with operational device status', () => {
    const result = resolveTicketSchema.safeParse({
      resolutionSummary: 'Power supply board replaced and tested according to manufacturer calibration spec.',
      finalDeviceStatusCode: 'operational',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid resolution with operational_with_limitations', () => {
    const result = resolveTicketSchema.safeParse({
      resolutionSummary: 'Primary channel calibrated; secondary probe port disabled pending replacement part.',
      finalDeviceStatusCode: 'operational_with_limitations',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid resolution with operational_with_limitations and limitationsNote', () => {
    const result = resolveTicketSchema.safeParse({
      resolutionSummary: 'Primary channel calibrated; secondary probe port disabled pending replacement part.',
      finalDeviceStatusCode: 'operational_with_limitations',
      limitationsNote: 'Secondary probe port disabled. Use Channel 1 only.',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid resolution with awaiting_release, standby, and decommissioned', () => {
    for (const status of ['awaiting_release', 'standby', 'decommissioned'] as const) {
      const result = resolveTicketSchema.safeParse({
        resolutionSummary: 'Maintenance procedure completed in full compliance with protocol.',
        finalDeviceStatusCode: status,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts valid resolution with out_of_service (unrepairable / condemned)', () => {
    const result = resolveTicketSchema.safeParse({
      resolutionSummary: 'Main motherboard cracked beyond repair. Equipment condemned and recommended for decommissioning.',
      finalDeviceStatusCode: 'out_of_service',
    });
    expect(result.success).toBe(true);
  });

  it('rejects resolving a ticket with under_repair device status', () => {
    const result = resolveTicketSchema.safeParse({
      resolutionSummary: 'Device is still being worked on by external biomedical service engineer.',
      finalDeviceStatusCode: 'under_repair',
    });
    expect(result.success).toBe(false);
  });

  it('rejects resolving a ticket with waiting_for_parts device status', () => {
    const result = resolveTicketSchema.safeParse({
      resolutionSummary: 'Part ordered from Philips Medical, expected next Tuesday.',
      finalDeviceStatusCode: 'waiting_for_parts',
    });
    expect(result.success).toBe(false);
  });

  it('rejects resolution summary shorter than 10 characters', () => {
    const result = resolveTicketSchema.safeParse({
      resolutionSummary: 'Fixed it',
      finalDeviceStatusCode: 'operational',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateTicketDeviceStatusSchema', () => {
  it('accepts interim under_repair status with progress note', () => {
    const result = updateTicketDeviceStatusSchema.safeParse({
      deviceStatusCode: 'under_repair',
      notes: 'Disassembled unit on bench; isolating display inverter circuit.',
    });
    expect(result.success).toBe(true);
  });

  it('accepts waiting_for_parts status with note', () => {
    const result = updateTicketDeviceStatusSchema.safeParse({
      deviceStatusCode: 'waiting_for_parts',
      notes: 'Waiting for replacement oxygen cell sensor from vendor.',
    });
    expect(result.success).toBe(true);
  });

  it('accepts operational_with_limitations with limitationsNote', () => {
    const result = updateTicketDeviceStatusSchema.safeParse({
      deviceStatusCode: 'operational_with_limitations',
      notes: 'Calibrated main unit; SpO2 module pending replacement.',
      limitationsNote: 'SpO2 sensor offline; NIBP and ECG operational.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects notes shorter than 3 characters', () => {
    const result = updateTicketDeviceStatusSchema.safeParse({
      deviceStatusCode: 'under_repair',
      notes: 'ok',
    });
    expect(result.success).toBe(false);
  });
});
