import { describe, it, expect } from 'vitest';
import { createTicketSchema, triageTicketSchema } from '../tickets';

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
