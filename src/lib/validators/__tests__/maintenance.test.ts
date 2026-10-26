import { describe, it, expect } from 'vitest';
import {
  createMaintenanceTaskSchema,
  assignMaintenanceTaskSchema,
  updateMaintenanceTaskStageSchema,
  completeMaintenanceTaskSchema,
  cancelMaintenanceTaskSchema,
  createMaintenancePlanSchema,
} from '../maintenance';

describe('Maintenance Validators', () => {
  const validUUID1 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const validUUID2 = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const validUUID3 = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

  describe('createMaintenanceTaskSchema', () => {
    it('validates a valid corrective maintenance task', () => {
      const data = {
        organizationId: validUUID1,
        hospitalId: validUUID2,
        deviceId: validUUID3,
        maintenanceType: 'corrective_maintenance',
        technicalProblemCategory: 'electrical_power',
        title: 'Repair ventilator power supply',
        description: 'Blown capacitor on secondary DC rail',
        priorityCode: 'p1_critical',
      };

      const result = createMaintenanceTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Repair ventilator power supply');
        expect(result.data.priorityCode).toBe('p1_critical');
      }
    });

    it('validates a preventive maintenance task with default priority', () => {
      const data = {
        organizationId: validUUID1,
        hospitalId: validUUID2,
        deviceId: validUUID3,
        maintenanceType: 'preventive_maintenance',
        title: '6-Month Anesthesia PM Routine',
      };

      const result = createMaintenanceTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priorityCode).toBe('p3_normal');
      }
    });

    it('rejects title shorter than 5 characters', () => {
      const data = {
        organizationId: validUUID1,
        hospitalId: validUUID2,
        deviceId: validUUID3,
        maintenanceType: 'corrective_maintenance',
        title: 'Fix',
      };

      const result = createMaintenanceTaskSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects invalid maintenance type', () => {
      const data = {
        organizationId: validUUID1,
        hospitalId: validUUID2,
        deviceId: validUUID3,
        maintenanceType: 'magical_repair',
        title: 'Fix defibrillator',
      };

      const result = createMaintenanceTaskSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('assignMaintenanceTaskSchema', () => {
    it('validates engineer assignment with optional handoff note', () => {
      const result = assignMaintenanceTaskSchema.safeParse({
        assignedEngineerUserId: validUUID1,
        handoffNote: 'Device is located in ICU Room 4',
      });
      expect(result.success).toBe(true);
    });

    it('fails if assignedEngineerUserId is missing or not a UUID', () => {
      const result = assignMaintenanceTaskSchema.safeParse({
        assignedEngineerUserId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateMaintenanceTaskStageSchema', () => {
    it('validates waiting dependency details', () => {
      const result = updateMaintenanceTaskStageSchema.safeParse({
        waitingDependencyType: 'parts',
        waitingReason: 'Awaiting OEM pressure sensor delivery',
      });
      expect(result.success).toBe(true);
    });

    it('rejects waitingReason shorter than 5 chars if provided', () => {
      const result = updateMaintenanceTaskStageSchema.safeParse({
        waitingDependencyType: 'vendor',
        waitingReason: 'Wait',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('completeMaintenanceTaskSchema', () => {
    it('validates completion payload with final result and device release status', () => {
      const payload = {
        diagnosis: 'Defective power supply board',
        rootCause: 'Electrical mains surge',
        workPerformed: 'Replaced main PCB, verified voltage rails, passed electrical safety testing',
        finalResultCode: 'passed',
        finalDeviceStatusCode: 'operational',
      };

      const result = completeMaintenanceTaskSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects workPerformed if shorter than 10 characters', () => {
      const payload = {
        workPerformed: 'Done fix',
        finalResultCode: 'passed',
        finalDeviceStatusCode: 'operational',
      };

      const result = completeMaintenanceTaskSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('cancelMaintenanceTaskSchema', () => {
    it('requires a cancellation reason with at least 10 chars', () => {
      const valid = cancelMaintenanceTaskSchema.safeParse({
        cancellationReason: 'Device decommissioned before scheduled repair',
      });
      expect(valid.success).toBe(true);

      const invalid = cancelMaintenanceTaskSchema.safeParse({
        cancellationReason: 'Too short',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('createMaintenancePlanSchema', () => {
    it('validates PM plan creation parameters', () => {
      const plan = {
        organizationId: validUUID1,
        hospitalId: validUUID2,
        deviceId: validUUID3,
        title: 'Quarterly Defibrillator Safety & Calibration',
        planTypeCode: 'preventive_maintenance' as const,
        calculationMethod: 'fixed_calendar' as const,
        frequencyInterval: 3,
        frequencyUnit: 'months' as const,
        startBaselineDate: '2026-11-01T00:00:00.000Z',
        leadTimeDays: 7,
      };

      const result = createMaintenancePlanSchema.safeParse(plan);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.frequencyInterval).toBe(3);
        expect(result.data.frequencyUnit).toBe('months');
      }
    });
  });
});
