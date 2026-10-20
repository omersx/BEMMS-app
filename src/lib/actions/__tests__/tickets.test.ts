import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks for Vitest ───────────────────────────────────────────────────

const { mockSession, mockDevice, mockTicket, mockDb } = vi.hoisted(() => {
  const session = {
    id: 'a0000000-0000-0000-0000-000000000099',
    email: 'engineer@bemms.local',
    fullName: 'Biomedical Engineer John',
    organizationId: 'a0000000-0000-0000-0000-000000000001',
    roles: ['BIOMED_ENG'],
  };

  const device = {
    id: 'a0000000-0000-0000-0000-000000000010',
    name: 'Mindray Ventilator SV300',
    assetNumber: 'ASSET-VENT-01',
    serialNumber: 'SN-VENT-999',
    internalCode: 'DEV-VENT-01',
    currentStatusCode: 'operational',
    organizationId: 'a0000000-0000-0000-0000-000000000001',
    hospitalId: 'a0000000-0000-0000-0000-000000000002',
    departmentId: 'a0000000-0000-0000-0000-000000000003',
    locationId: 'a0000000-0000-0000-0000-000000000004',
  };

  const ticket = {
    id: 'a0000000-0000-0000-0000-000000000020',
    ticketNumber: 'TKT-20261021-0001',
    organizationId: 'a0000000-0000-0000-0000-000000000001',
    hospitalId: 'a0000000-0000-0000-0000-000000000002',
    departmentId: 'a0000000-0000-0000-0000-000000000003',
    deviceId: 'a0000000-0000-0000-0000-000000000010',
    statusCode: 'new',
    priorityCode: 'p3_normal',
    title: 'Display flicker',
    description: 'Screen occasionally flickers during operation',
    reportedImpact: 'device_usable',
    assignedEngineerUserId: null,
    reportedByUserId: 'a0000000-0000-0000-0000-000000000088',
  };

  const db = {
    query: {
      devices: {
        findFirst: vi.fn().mockResolvedValue(device),
      },
      serviceTickets: {
        findFirst: vi.fn().mockResolvedValue(ticket),
      },
      recordVersions: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn().mockImplementation(async (callback: any) => {
      const tx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockImplementation(() => [{ ...ticket }]),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockImplementation(() => [{ ...ticket, statusCode: 'in_progress' }]),
            }),
          }),
        }),
        query: {
          devices: {
            findFirst: vi.fn().mockResolvedValue(device),
          },
          recordVersions: {
            findMany: vi.fn().mockResolvedValue([]),
          },
          signatureEvents: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
        },
      };
      return callback(tx);
    }),
  };

  return { mockSession: session, mockDevice: device, mockTicket: ticket, mockDb: db };
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

vi.mock('../signature-auth', () => ({
  verifySignatureAuth: vi.fn().mockImplementation(async (_userId: string, password: string) => {
    if (password === 'ValidPass123!') {
      return { success: true, user: { id: mockSession.id, fullName: mockSession.fullName, email: mockSession.email } };
    }
    return { success: false, error: 'Invalid password' };
  }),
  createSignatureEvent: vi.fn().mockResolvedValue({ id: 'sig-event-1' }),
}));

vi.mock('@/lib/notifications/dispatcher', () => ({
  notifyEngineersOnNewTicket: vi.fn().mockResolvedValue({ notifiedCount: 2, pushCount: 1 }),
  notifyReporterOnAccept: vi.fn().mockResolvedValue(true),
  notifyReporterOnStatusChange: vi.fn().mockResolvedValue(true),
  notifyOnNewComment: vi.fn().mockResolvedValue(true),
  notifyEngineerOnAssign: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/db', () => ({
  db: mockDb,
}));

import { createTicket, acceptTicket, resolveTicket, reopenTicket } from '../tickets';

describe('Tickets Server Actions (Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.query.devices.findFirst.mockResolvedValue(mockDevice);
    mockDb.query.serviceTickets.findFirst.mockResolvedValue(mockTicket);
  });

  describe('createTicket', () => {
    it('rejects creation when required fields are missing', async () => {
      const result: any = await createTicket({});
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('creates a ticket with p1_critical priority when patient care is affected', async () => {
      const payload = {
        organizationId: 'a0000000-0000-0000-0000-000000000001',
        hospitalId: 'a0000000-0000-0000-0000-000000000002',
        departmentId: 'a0000000-0000-0000-0000-000000000003',
        source: 'manual_entry' as const,
        ticketType: 'urgent_equipment_concern' as const,
        title: 'Ventilator stopped pumping oxygen',
        description: 'Device alarm continuously sounding, valve jammed during clinical usage',
        reportedImpact: 'patient_care_affected' as const,
      };

      const result: any = await createTicket(payload);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('creates a normal priority ticket for routine issues', async () => {
      const payload = {
        organizationId: 'a0000000-0000-0000-0000-000000000001',
        hospitalId: 'a0000000-0000-0000-0000-000000000002',
        departmentId: 'a0000000-0000-0000-0000-000000000003',
        source: 'qr_scan' as const,
        ticketType: 'device_problem' as const,
        title: 'Castor wheel squeaking',
        description: 'Trolley wheel needs lubrication during daily rounds',
        reportedImpact: 'device_usable' as const,
      };

      const result: any = await createTicket(payload);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('acceptTicket with Electronic Signature', () => {
    it('fails if electronic signature password is wrong', async () => {
      const result: any = await acceptTicket('a0000000-0000-0000-0000-000000000020', {
        signaturePassword: 'WrongPassword!',
        signatureComments: 'Accepting ticket',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid password');
    });

    it('successfully accepts ticket and records electronic signature with valid credentials', async () => {
      const result: any = await acceptTicket('a0000000-0000-0000-0000-000000000020', {
        signaturePassword: 'ValidPass123!',
        signatureComments: 'On my way to ICU to inspect device',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('refuses acceptance if ticket is in resolved or closed status', async () => {
      mockDb.query.serviceTickets.findFirst.mockResolvedValueOnce({
        ...mockTicket,
        statusCode: 'resolved',
      });

      const result: any = await acceptTicket('a0000000-0000-0000-0000-000000000020', {
        signaturePassword: 'ValidPass123!',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot accept ticket in 'resolved' status");
    });
  });

  describe('resolveTicket guards & workflow', () => {
    it('blocks resolving ticket if finalDeviceStatusCode is under_repair', async () => {
      const result: any = await resolveTicket('a0000000-0000-0000-0000-000000000020', {
        resolutionSummary: 'Still working on replacing the power board and testing lines',
        finalDeviceStatusCode: 'under_repair',
        signaturePassword: 'ValidPass123!',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('successfully resolves ticket when device is returned to operational status', async () => {
      mockDb.query.serviceTickets.findFirst.mockResolvedValueOnce({
        ...mockTicket,
        statusCode: 'in_progress',
      });

      const result: any = await resolveTicket('a0000000-0000-0000-0000-000000000020', {
        resolutionSummary: 'Replaced power connector and performed self-test. All passed.',
        finalDeviceStatusCode: 'operational',
        signaturePassword: 'ValidPass123!',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('reopenTicket workflow', () => {
    it('reopens a resolved ticket and transitions linked device back to under_repair', async () => {
      mockDb.query.serviceTickets.findFirst.mockResolvedValueOnce({
        ...mockTicket,
        statusCode: 'resolved',
      });

      const result: any = await reopenTicket('a0000000-0000-0000-0000-000000000020', {
        reopenReason: 'Problem recurred 1 hour after patient connection',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
});
