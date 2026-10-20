import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks for Vitest ───────────────────────────────────────────────────

const { mockSession, mockDeviceRecord, mockDb } = vi.hoisted(() => {
  const session = {
    id: 'a0000000-0000-0000-0000-000000000099',
    email: 'engineer@bemms.local',
    fullName: 'Biomedical Manager John',
    organizationId: 'a0000000-0000-0000-0000-000000000001',
    roles: ['SYS_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG'],
  };

  const device = {
    id: 'a0000000-0000-0000-0000-000000000010',
    name: 'Infusion Pump Alaris GP',
    assetNumber: 'PUMP-ICU-04',
    serialNumber: 'SN-PUMP-8832',
    modelNameFree: 'Alaris GP Plus',
    internalCode: 'DEV-PUMP-04',
    opaqueReference: 'qr_pump_04',
    organizationId: 'a0000000-0000-0000-0000-000000000001',
    hospitalId: 'a0000000-0000-0000-0000-000000000002',
    departmentId: 'a0000000-0000-0000-0000-000000000003',
    locationId: 'a0000000-0000-0000-0000-000000000004',
    currentStatusCode: 'operational',
    operationalStatus: 'available',
    criticalityLevel: 'high',
    riskClassification: 'class_iib',
  };

  const db = {
    query: {
      devices: {
        findFirst: vi.fn().mockResolvedValue(device),
        findMany: vi.fn().mockResolvedValue([device]),
      },
      deviceCategories: {
        findMany: vi.fn().mockResolvedValue([{ id: 'a0000000-0000-0000-0000-000000000030', name: 'Infusion Pumps', code: 'PUMP' }]),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn().mockImplementation(async (callback: any) => {
      const tx = {
        query: {
          devices: {
            findFirst: vi.fn().mockResolvedValue(device),
          },
          deviceCategories: {
            findMany: vi.fn().mockResolvedValue([{ id: 'a0000000-0000-0000-0000-000000000030', name: 'Infusion Pumps', code: 'PUMP' }]),
          },
        },
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockImplementation(() => [{ ...device }]),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockImplementation(() => [{ ...device, currentStatusCode: 'under_maintenance' }]),
            }),
          }),
        }),
      };
      return callback(tx);
    }),
  };

  return { mockSession: session, mockDeviceRecord: device, mockDb: db };
});

vi.mock('@/lib/auth/rbac', () => ({
  requireAuth: vi.fn().mockImplementation(async () => mockSession),
  requireRole: vi.fn().mockImplementation(async (...roles: string[]) => {
    const hasRole = roles.some((r) => mockSession.roles.includes(r));
    if (!hasRole) throw new Error('Forbidden: insufficient permissions');
    return mockSession;
  }),
  requireScope: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/audit', () => ({
  createAuditLog: vi.fn().mockResolvedValue({ id: 'audit-log-1' }),
}));

vi.mock('../qr', () => ({
  generateInternalCode: vi.fn().mockReturnValue('DEV-VENT-2026-0001'),
  generateOpaqueReference: vi.fn().mockReturnValue('qr_opaque_ref_12345'),
}));

vi.mock('@/lib/db', () => ({
  db: mockDb,
}));

import { createDevice, changeDeviceStatus, transferDeviceLocation, decommissionDevice } from '../devices';

describe('Devices Server Actions (Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.query.devices.findFirst.mockResolvedValue(mockDeviceRecord);
  });

  describe('createDevice', () => {
    it('validates required fields and creates device with opaque QR code reference', async () => {
      const payload = {
        organizationId: 'a0000000-0000-0000-0000-000000000001',
        hospitalId: 'a0000000-0000-0000-0000-000000000002',
        departmentId: 'a0000000-0000-0000-0000-000000000003',
        name: 'Syringe Pump BD Alaris',
        modelNameFree: 'CC Plus',
        serialNumber: 'BD-SN-11002',
        assetNumber: 'PUMP-SYR-01',
        criticalityLevel: 'medium' as const,
        riskClassification: 'class_iia' as const,
      };

      const result: any = await createDevice(payload);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('rejects device registration when assetNumber or name is missing', async () => {
      const result: any = await createDevice({
        organizationId: 'a0000000-0000-0000-0000-000000000001',
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('changeDeviceStatus', () => {
    it('updates device status and requires a reason for audit history', async () => {
      const result: any = await changeDeviceStatus('a0000000-0000-0000-0000-000000000010', {
        newStatusCode: 'under_maintenance',
        reason: 'Scheduled preventive maintenance due',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('rejects update if reason is missing or empty', async () => {
      const result: any = await changeDeviceStatus('a0000000-0000-0000-0000-000000000010', {
        newStatusCode: 'out_of_service',
        reason: '',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('transferDeviceLocation', () => {
    it('successfully transfers device location to new department and room', async () => {
      const result: any = await transferDeviceLocation('a0000000-0000-0000-0000-000000000010', {
        destinationHospitalId: 'a0000000-0000-0000-0000-000000000002',
        destinationDepartmentId: 'a0000000-0000-0000-0000-000000000005',
        transferReason: 'relocation',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('decommissionDevice', () => {
    it('decommissions device with recorded justification and disposal method', async () => {
      const result: any = await decommissionDevice('a0000000-0000-0000-0000-000000000010', {
        reason: 'Beyond economic repair, parts obsolete by manufacturer',
        disposition: 'electronic_waste_recycling',
      });

      expect(result.success).toBe(true);
    });
  });
});
