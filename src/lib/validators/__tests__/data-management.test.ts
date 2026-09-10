import { describe, it, expect } from 'vitest';
import { parseCSV, getDeviceImportTemplateCSV } from '@/lib/utils/csv-parser';
import { deviceImportRowSchema, purgeDataSchema } from '../data-management';

describe('CSV Parser Utility', () => {
  it('parses simple CSV text into structured records', () => {
    const csv = `asset_number,name,model\nDEV-001,Ventilator,V-500\nDEV-002,ECG Monitor,E-200`;
    const records = parseCSV(csv);
    expect(records).toHaveLength(2);
    expect(records[0]).toEqual({
      asset_number: 'DEV-001',
      name: 'Ventilator',
      model: 'V-500',
    });
    expect(records[1].asset_number).toEqual('DEV-002');
  });

  it('handles quoted fields with commas correctly', () => {
    const csv = `asset_number,name,location\nDEV-001,"Defibrillator, Biphasic","Room 102, Bay A"`;
    const records = parseCSV(csv);
    expect(records).toHaveLength(1);
    expect(records[0].name).toBe('Defibrillator, Biphasic');
    expect(records[0].location).toBe('Room 102, Bay A');
  });

  it('normalizes various header formats', () => {
    const csv = `Asset-Number,Device Name,SERIAL_NUMBER\nDEV-01,Pump,SN-100`;
    const records = parseCSV(csv);
    expect(records[0]).toHaveProperty('asset_number');
    expect(records[0]).toHaveProperty('device_name');
    expect(records[0]).toHaveProperty('serial_number');
  });

  it('returns empty array when text has only headers', () => {
    const csv = `asset_number,name,model`;
    expect(parseCSV(csv)).toHaveLength(0);
  });
});

describe('getDeviceImportTemplateCSV', () => {
  it('generates a valid CSV with BOM and required BEMMS headers', () => {
    const template = getDeviceImportTemplateCSV();
    expect(template.startsWith('\uFEFF')).toBe(true);
    expect(template).toContain('asset_number');
    expect(template).toContain('category');
    expect(template).toContain('department');
    expect(template).toContain('manufacturer');

    const parsed = parseCSV(template);
    expect(parsed.length).toBeGreaterThanOrEqual(2);
  });
});

describe('deviceImportRowSchema', () => {
  it('validates a complete medical device row', () => {
    const result = deviceImportRowSchema.safeParse({
      assetNumber: 'DEV-100',
      name: 'Syringe Pump',
      model: 'SP-1000',
      serialNumber: 'SN-789',
      categoryName: 'Infusion Pump',
      manufacturerName: 'B. Braun',
      departmentName: 'Emergency',
      locationDescription: 'Storage Room B',
      riskClassification: 'class_iib',
      criticalityLevel: 'high',
    });
    expect(result.success).toBe(true);
  });

  it('rejects rows missing required assetNumber or name', () => {
    const result = deviceImportRowSchema.safeParse({
      assetNumber: '',
      name: 'Syringe Pump',
      categoryName: 'Pump',
      manufacturerName: 'Vendor',
      departmentName: 'ICU',
    });
    expect(result.success).toBe(false);
  });

  it('applies standard defaults for optional fields', () => {
    const result = deviceImportRowSchema.safeParse({
      assetNumber: 'DEV-200',
      name: 'Patient Monitor',
      categoryName: 'Monitor',
      manufacturerName: 'GE Healthcare',
      departmentName: 'ICU',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.riskClassification).toBe('class_i');
      expect(result.data.criticalityLevel).toBe('medium');
    }
  });
});

describe('purgeDataSchema', () => {
  it('validates a valid test data purge request', () => {
    const result = purgeDataSchema.safeParse({
      scope: 'test_transactions',
      confirmText: 'PURGE TEST DATA',
      password: 'adminPassword123',
      reason: 'Pre-launch test cleanup',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing password', () => {
    const result = purgeDataSchema.safeParse({
      scope: 'test_transactions',
      confirmText: 'PURGE TEST DATA',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});
