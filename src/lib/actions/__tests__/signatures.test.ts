import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks for Vitest ───────────────────────────────────────────────────

const { mockPerformer, mockReviewer, mockTask, mockRecord, mockRecordVersion, mockDevice, mockDb } = vi.hoisted(() => {
  const performer = {
    id: 'a0000000-0000-0000-0000-000000000091',
    email: 'tech@bemms.local',
    fullName: 'Biomedical Technician Dave',
    organizationId: 'a0000000-0000-0000-0000-000000000001',
    roles: ['BIOMED_TECH'],
  };

  const reviewer = {
    id: 'a0000000-0000-0000-0000-000000000092',
    email: 'lead-engineer@bemms.local',
    fullName: 'Senior Engineer Sarah',
    organizationId: 'a0000000-0000-0000-0000-000000000001',
    roles: ['BIOMED_ENG'],
  };

  const task = {
    id: 'a0000000-0000-0000-0000-000000000050',
    organizationId: 'a0000000-0000-0000-0000-000000000001',
    hospitalId: 'a0000000-0000-0000-0000-000000000002',
    deviceId: 'a0000000-0000-0000-0000-000000000010',
    maintenanceType: 'preventive_maintenance',
    technicalProblemCategory: null,
    statusCode: 'work_complete',
    resultRecordId: 'a0000000-0000-0000-0000-000000000060',
  };

  const record = {
    id: 'a0000000-0000-0000-0000-000000000060',
    recordNumber: 'MR-20261021-0001',
    organizationId: 'a0000000-0000-0000-0000-000000000001',
    deviceId: 'a0000000-0000-0000-0000-000000000010',
    finalDeviceStatusCode: 'operational',
  };

  const recordVersion = {
    id: 'a0000000-0000-0000-0000-000000000070',
    entityId: 'a0000000-0000-0000-0000-000000000060',
    entityType: 'maintenance_record',
    versionNumber: 1,
    contentHashSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  };

  const device = {
    id: 'a0000000-0000-0000-0000-000000000010',
    currentStatusCode: 'under_maintenance',
  };

  const db = {
    query: {
      maintenanceTasks: {
        findFirst: vi.fn().mockResolvedValue(task),
      },
      maintenanceRecords: {
        findFirst: vi.fn().mockResolvedValue(record),
      },
      maintenanceParts: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      maintenanceCosts: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      recordVersions: {
        findFirst: vi.fn().mockResolvedValue(recordVersion),
        findMany: vi.fn().mockResolvedValue([recordVersion]),
      },
      electronicSignatures: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      signatureEvents: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      signaturePolicies: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      devices: {
        findFirst: vi.fn().mockResolvedValue(device),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn().mockImplementation(async (callback: any) => {
      const tx = {
        query: {
          maintenanceTasks: {
            findFirst: vi.fn().mockResolvedValue(task),
          },
          maintenanceParts: {
            findMany: vi.fn().mockResolvedValue([]),
          },
          maintenanceCosts: {
            findMany: vi.fn().mockResolvedValue([]),
          },
          recordVersions: {
            findMany: vi.fn().mockResolvedValue([]),
            findFirst: vi.fn().mockResolvedValue(recordVersion),
          },
          signatureEvents: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
          devices: {
            findFirst: vi.fn().mockResolvedValue(device),
          },
        },
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockImplementation(() => [{ ...record }]),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockImplementation(() => [{ ...task, statusCode: 'awaiting_review' }]),
            }),
          }),
        }),
      };
      return callback(tx);
    }),
  };

  return { mockPerformer: performer, mockReviewer: reviewer, mockTask: task, mockRecord: record, mockRecordVersion: recordVersion, mockDevice: device, mockDb: db };
});

let currentSession = mockPerformer;

vi.mock('@/lib/auth/rbac', () => ({
  requireAuth: vi.fn().mockImplementation(async () => currentSession),
  requireScope: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/audit', () => ({
  createAuditLog: vi.fn().mockResolvedValue({ id: 'audit-log-1' }),
}));

vi.mock('../signature-auth', () => ({
  verifySignatureAuth: vi.fn().mockImplementation(async (userId: string, password: string) => {
    if (password === 'ValidPass123!') {
      return { success: true, user: { id: userId, fullName: currentSession.fullName, email: currentSession.email } };
    }
    return { success: false, error: 'Password re-authentication failed' };
  }),
  createSignatureEvent: vi.fn().mockResolvedValue({ id: 'sig-event-1' }),
}));

vi.mock('@/lib/db', () => ({
  db: mockDb,
}));

import { signMaintenanceRecord, reviewMaintenanceRecord, releaseDeviceMaintenance } from '../signatures';

describe('Signatures Server Actions (Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSession = mockPerformer;
    mockDb.query.maintenanceTasks.findFirst.mockResolvedValue(mockTask);
  });

  describe('signMaintenanceRecord (Performer Signature)', () => {
    it('rejects if password re-authentication fails', async () => {
      const result = await signMaintenanceRecord(
        'a0000000-0000-0000-0000-000000000050',
        {
          workPerformed: 'Replaced O2 sensor and calibrated pressure lines.',
          finalResultCode: 'passed',
          finalDeviceStatusCode: 'operational',
        },
        {
          password: 'WrongPassword!',
          signaturePurpose: 'perform',
          authMethod: 'password_reauth',
        }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Password re-authentication failed');
      }
    });

    it('rejects if task is not in work_complete state', async () => {
      mockDb.query.maintenanceTasks.findFirst.mockResolvedValueOnce({
        ...mockTask,
        statusCode: 'in_progress',
      });

      const result = await signMaintenanceRecord(
        'a0000000-0000-0000-0000-000000000050',
        {
          workPerformed: 'Partially done work on the ventilator.',
          finalResultCode: 'passed',
          finalDeviceStatusCode: 'operational',
        },
        {
          password: 'ValidPass123!',
          signaturePurpose: 'perform',
          authMethod: 'password_reauth',
        }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Task must be in work_complete state');
      }
    });

    it('creates immutable record with SHA-256 hash snapshot on valid signature', async () => {
      const result = await signMaintenanceRecord(
        'a0000000-0000-0000-0000-000000000050',
        {
          workPerformed: 'Replaced O2 sensor and verified flow sensor calibration.',
          findings: 'No leakage detected.',
          finalResultCode: 'passed',
          finalDeviceStatusCode: 'operational',
        },
        {
          password: 'ValidPass123!',
          signaturePurpose: 'perform',
          authMethod: 'password_reauth',
          comments: 'Maintenance completed as per manufacturer service checklist.',
        }
      );

      expect(result.success).toBe(true);
      expect(mockDb.transaction).toHaveBeenCalled();
    });
  });

  describe('reviewMaintenanceRecord (Performer ≠ Reviewer Guard)', () => {
    it('blocks performer from reviewing their own work (FDA 21 CFR Part 11)', async () => {
      mockDb.query.maintenanceTasks.findFirst.mockResolvedValueOnce({
        ...mockTask,
        statusCode: 'awaiting_review',
        resultRecordId: 'a0000000-0000-0000-0000-000000000060',
      });

      mockDb.query.electronicSignatures.findFirst.mockResolvedValueOnce({
        id: 'sig-01',
        signerUserId: mockPerformer.id,
      });

      const result = await reviewMaintenanceRecord('a0000000-0000-0000-0000-000000000050', {
        password: 'ValidPass123!',
        decision: 'approve',
        reviewNotes: 'Looks good to me.',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Reviewer cannot be the same person as the performer');
      }
    });

    it('allows independent reviewer to approve work', async () => {
      currentSession = mockReviewer;

      mockDb.query.maintenanceTasks.findFirst.mockResolvedValueOnce({
        ...mockTask,
        statusCode: 'awaiting_review',
        resultRecordId: 'a0000000-0000-0000-0000-000000000060',
      });

      mockDb.query.electronicSignatures.findFirst.mockResolvedValueOnce({
        id: 'sig-01',
        signerUserId: mockPerformer.id,
      });

      const result = await reviewMaintenanceRecord('a0000000-0000-0000-0000-000000000050', {
        password: 'ValidPass123!',
        decision: 'approve',
        reviewNotes: 'Reviewed calibration logs, passed all criteria.',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('releaseDeviceMaintenance (Release Sign-off)', () => {
    it('releases device and restores operational status after all sign-offs are complete', async () => {
      currentSession = mockReviewer;

      mockDb.query.maintenanceTasks.findFirst.mockResolvedValueOnce({
        ...mockTask,
        statusCode: 'awaiting_release',
        resultRecordId: 'a0000000-0000-0000-0000-000000000060',
      });

      const result = await releaseDeviceMaintenance('a0000000-0000-0000-0000-000000000050', {
        finalDeviceStatusCode: 'operational',
        password: 'ValidPass123!',
        releaseNotes: 'Cleared for patient clinical use.',
      });

      expect(result.success).toBe(true);
    });
  });
});
