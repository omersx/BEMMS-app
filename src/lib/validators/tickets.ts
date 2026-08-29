import { z } from 'zod';

export const createTicketSchema = z.object({
  organizationId: z.string().uuid(),
  deviceId: z.string().uuid().optional(),
  hospitalId: z.string().uuid(),
  departmentId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
  source: z.enum(['qr_scan', 'department_device_selection', 'device_profile', 'manual_entry', 'import']),
  ticketType: z.enum([
    'device_problem', 'urgent_equipment_concern', 'maintenance_request',
    'inspection_request', 'calibration_request', 'pm_followup'
  ]).default('device_problem'),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  reportedImpact: z.enum(['device_usable', 'device_not_usable', 'patient_care_affected']),
  reportedProblemCategory: z.enum([
    'power_issue', 'device_not_starting', 'display_interface', 'alarm_problem',
    'sensor_accessory', 'electrical_concern', 'mechanical_damage',
    'software_configuration', 'performance_concern', 'maintenance_request', 'other'
  ]).optional(),
  reportedLocationCorrection: z.string().max(200).optional(),
  requesterContactName: z.string().max(100).optional(),
  requesterContactPhone: z.string().max(30).optional(),
});

export const triageTicketSchema = z.object({
  priorityCode: z.enum(['p1_critical', 'p2_high', 'p3_normal', 'p4_low']),
  priorityReason: z.string().max(500).optional(),
  selectedMaintenanceType: z.enum([
    'preventive_maintenance', 'corrective_maintenance', 'troubleshooting',
    'inspection', 'calibration', 'electrical_safety_testing',
    'performance_testing', 'installation_commissioning',
    'software_configuration', 'decommissioning'
  ]).optional(),
  selectedTechnicalCategory: z.enum([
    'electrical_power', 'display_user_interface', 'alarm_safety',
    'sensor_measurement', 'mechanical', 'software_configuration',
    'performance_output', 'accessory_consumable', 'physical_damage',
    'communication_network', 'no_fault_found', 'other'
  ]).optional(),
  assignedEngineerUserId: z.string().uuid().optional(),
  internalTriageNote: z.string().max(1000).optional(),
});

export const assignTicketSchema = z.object({
  assignedEngineerUserId: z.string().uuid(),
  assignedTeamId: z.string().uuid().optional(),
  handoffNote: z.string().max(500).optional(),
});

export const resolveTicketSchema = z.object({
  resolutionSummary: z.string().min(10).max(2000),
  finalDeviceStatusCode: z.enum([
    'operational', 'operational_with_limitations', 'under_maintenance', 'under_repair',
    'waiting_for_parts', 'awaiting_release', 'out_of_service', 'standby', 'decommissioned'
  ]),
});

export const closeTicketSchema = z.object({
  closureReason: z.string().max(500).optional(),
});

export const cancelTicketSchema = z.object({
  cancellationReason: z.string().min(5).max(500),
});

export const reopenTicketSchema = z.object({
  reopenReason: z.string().min(5).max(500),
});

export const createTicketCommentSchema = z.object({
  body: z.string().min(1).max(5000),
  visibility: z.enum(['public', 'internal']).default('public'),
});

export const ticketStatusTransitionSchema = z.object({
  targetStatus: z.enum([
    'new', 'acknowledged', 'in_triage', 'in_progress',
    'waiting_requester', 'waiting_parts_vendor',
    'resolved', 'closed', 'cancelled'
  ]),
  reason: z.string().max(500).optional(),
  waitingDependencyType: z.string().max(100).optional(),
});

export const ticketFilterSchema = z.object({
  search: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  hospitalId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  statusCode: z.string().optional(),
  priorityCode: z.string().optional(),
  assignedEngineerUserId: z.string().uuid().optional(),
  reportedByUserId: z.string().uuid().optional(),
  deviceId: z.string().uuid().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});
