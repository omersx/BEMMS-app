import { describe, it, expect } from 'vitest';
import {
  createDeviceSchema,
  createDeviceCategorySchema,
  createManufacturerSchema,
} from '../devices';

describe('createDeviceCategorySchema', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  it('validates a correct device category', () => {
    const result = createDeviceCategorySchema.safeParse({
      organizationId: validUuid,
      name: 'Infusion Pump',
      code: 'INF-PUMP',
      description: 'Standard volumetric infusion pump',
      riskClassification: 'class_iib',
      criticalityLevel: 'high',
      defaultPmIntervalDays: 180,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID for organizationId', () => {
    const result = createDeviceCategorySchema.safeParse({
      organizationId: 'not-a-uuid',
      name: 'Infusion Pump',
      code: 'INF',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid risk classification enum value', () => {
    const result = createDeviceCategorySchema.safeParse({
      organizationId: validUuid,
      name: 'Infusion Pump',
      code: 'INF',
      riskClassification: 'invalid_class',
    });
    expect(result.success).toBe(false);
  });
});

describe('createManufacturerSchema', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  it('validates a valid manufacturer', () => {
    const result = createManufacturerSchema.safeParse({
      organizationId: validUuid,
      name: 'GE Healthcare',
      code: 'GE',
      country: 'USA',
      supportEmail: 'support@ge.com',
      website: 'https://gehealthcare.com',
    });
    expect(result.success).toBe(true);
  });

  it('allows empty string for optional email and website', () => {
    const result = createManufacturerSchema.safeParse({
      organizationId: validUuid,
      name: 'Local Medtech',
      supportEmail: '',
      website: '',
    });
    expect(result.success).toBe(true);
  });
});

describe('createDeviceSchema', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  it('validates a complete valid device', () => {
    const result = createDeviceSchema.safeParse({
      organizationId: validUuid,
      hospitalId: validUuid,
      departmentId: validUuid,
      name: 'Defibrillator X',
      assetNumber: 'BME-DEF-001',
      serialNumber: 'SN-987654321',
      deviceCategoryId: validUuid,
      criticalityLevel: 'critical',
      riskClassification: 'class_iii',
    });
    expect(result.success).toBe(true);
  });

  it('rejects device without assetNumber or name', () => {
    const result = createDeviceSchema.safeParse({
      organizationId: validUuid,
      hospitalId: validUuid,
      departmentId: validUuid,
      deviceCategoryId: validUuid,
    });
    expect(result.success).toBe(false);
  });
});
