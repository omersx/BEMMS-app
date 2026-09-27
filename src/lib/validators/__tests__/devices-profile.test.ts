import { describe, it, expect, vi } from 'vitest';
import {
  transferDeviceSchema,
  changeDeviceStatusSchema,
  decommissionDeviceSchema,
} from '../devices';

describe('Device Transfer & Status Change Validators', () => {
  const validUuid1 = '123e4567-e89b-12d3-a456-426614174000';
  const validUuid2 = '223e4567-e89b-12d3-a456-426614174000';

  describe('transferDeviceSchema', () => {
    it('validates a complete transfer payload', () => {
      const valid = {
        destinationHospitalId: validUuid1,
        destinationDepartmentId: validUuid2,
        destinationLocationId: validUuid1,
        transferReason: 'relocation',
        notes: 'Moved to new ICU wing room 4',
      };
      const result = transferDeviceSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('accepts all valid transfer reasons', () => {
      const reasons = [
        'relocation',
        'temporary_loan',
        'department_change',
        'correction',
        'replacement',
        'workshop',
        'storage',
        'other',
      ];
      for (const reason of reasons) {
        const result = transferDeviceSchema.safeParse({
          destinationHospitalId: validUuid1,
          destinationDepartmentId: validUuid2,
          transferReason: reason,
        });
        expect(result.success).toBe(true);
      }
    });

    it('rejects an invalid transfer reason', () => {
      const result = transferDeviceSchema.safeParse({
        destinationHospitalId: validUuid1,
        destinationDepartmentId: validUuid2,
        transferReason: 'invalid_reason',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing destination hospital or department', () => {
      const result = transferDeviceSchema.safeParse({
        transferReason: 'relocation',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('changeDeviceStatusSchema', () => {
    it('validates a valid status change', () => {
      const valid = {
        newStatusCode: 'under_maintenance',
        reason: 'Scheduled quarterly preventive inspection',
        notes: 'Engineer assigned and work order created',
      };
      const result = changeDeviceStatusSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('accepts all 9 medical device operational statuses', () => {
      const statuses = [
        'operational',
        'operational_with_limitations',
        'under_maintenance',
        'under_repair',
        'waiting_for_parts',
        'awaiting_release',
        'out_of_service',
        'standby',
        'decommissioned',
      ];
      for (const status of statuses) {
        const result = changeDeviceStatusSchema.safeParse({
          newStatusCode: status,
          reason: `Transitioning to ${status}`,
        });
        expect(result.success).toBe(true);
      }
    });

    it('rejects an invalid status code', () => {
      const result = changeDeviceStatusSchema.safeParse({
        newStatusCode: 'broken_beyond_repair',
        reason: 'Hardware failure',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty or missing reason', () => {
      const result = changeDeviceStatusSchema.safeParse({
        newStatusCode: 'out_of_service',
        reason: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('decommissionDeviceSchema', () => {
    it('validates a valid decommission reason', () => {
      const valid = {
        reason: 'Equipment reached end-of-life per manufacturer policy and safety notice.',
      };
      const result = decommissionDeviceSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects too short decommission reason', () => {
      const result = decommissionDeviceSchema.safeParse({
        reason: 'old',
      });
      expect(result.success).toBe(false);
    });
  });
});
