'use server';

import { z } from 'zod';

// ── Maintenance Task Validators ──────────────────────────────────────────────

export const createMaintenanceTaskSchema = z.object({
  organizationId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  departmentId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  deviceId: z.string().uuid(),
  serviceTicketId: z.string().uuid().optional(),
  maintenanceScheduleOccurrenceId: z.string().uuid().optional(),
  maintenanceType: z.enum([
    'preventive_maintenance', 'corrective_maintenance', 'troubleshooting',
    'inspection', 'calibration', 'electrical_safety_testing',
    'performance_testing', 'installation_commissioning',
    'software_configuration', 'decommissioning'
  ]),
  technicalProblemCategory: z.enum([
    'electrical_power', 'display_user_interface', 'alarm_safety',
    'sensor_measurement', 'mechanical', 'software_configuration',
    'performance_output', 'accessory_consumable', 'physical_damage',
    'communication_network', 'no_fault_found', 'other'
  ]).optional(),
  title: z.string().min(5).max(200),
  description: z.string().optional(),
  assignedEngineerUserId: z.string().uuid().optional(),
  priorityCode: z.enum(['p1_critical', 'p2_high', 'p3_normal', 'p4_low']).default('p3_normal'),
  dueDate: z.string().datetime().optional(),
  checklistTemplateVersionId: z.string().uuid().optional(),
});

export const assignMaintenanceTaskSchema = z.object({
  assignedEngineerUserId: z.string().uuid(),
  handoffNote: z.string().optional(),
});

export const updateMaintenanceTaskStageSchema = z.object({
  waitingDependencyType: z.enum(['parts', 'requester', 'vendor', 'department_access']).optional(),
  waitingReason: z.string().min(5).optional(),
  resumeNote: z.string().optional(),
});

export const completeMaintenanceTaskSchema = z.object({
  diagnosis: z.string().optional(),
  rootCause: z.string().optional(),
  workPerformed: z.string().min(10),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  finalResultCode: z.enum([
    'passed', 'passed_with_limitations', 'failed', 'no_fault_found',
    'decommission_recommended', 'requires_external_service'
  ]),
  finalDeviceStatusCode: z.enum([
    'operational', 'operational_with_limitations', 'under_maintenance', 'under_repair',
    'waiting_for_parts', 'awaiting_release', 'out_of_service', 'standby', 'decommissioned'
  ]),
});

export const cancelMaintenanceTaskSchema = z.object({
  cancellationReason: z.string().min(10),
});

// ── PM Plan Validators ──────────────────────────────────────────────────────

export const createMaintenancePlanSchema = z.object({
  organizationId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  departmentId: z.string().uuid().optional(),
  deviceId: z.string().uuid(),
  planTypeCode: z.enum([
    'preventive_maintenance', 'corrective_maintenance', 'troubleshooting',
    'inspection', 'calibration', 'electrical_safety_testing',
    'performance_testing', 'installation_commissioning',
    'software_configuration', 'decommissioning'
  ]).default('preventive_maintenance'),
  title: z.string().optional(),
  calculationMethod: z.enum(['fixed_calendar', 'completion_based']).default('fixed_calendar'),
  frequencyInterval: z.number().int().min(1),
  frequencyUnit: z.enum(['days', 'weeks', 'months', 'years']),
  startBaselineDate: z.string().datetime(),
  leadTimeDays: z.number().int().min(1).default(30),
  assignedEngineerUserId: z.string().uuid().optional(),
  checklistTemplateVersionId: z.string().uuid().optional(),
  instructions: z.string().optional(),
});

export const updateMaintenancePlanSchema = z.object({
  title: z.string().optional(),
  frequencyInterval: z.number().int().min(1).optional(),
  frequencyUnit: z.enum(['days', 'weeks', 'months', 'years']).optional(),
  leadTimeDays: z.number().int().min(1).optional(),
  assignedEngineerUserId: z.string().uuid().optional(),
  checklistTemplateVersionId: z.string().uuid().optional(),
  instructions: z.string().optional(),
  revisionNote: z.string().min(5),
});

export const deferOccurrenceSchema = z.object({
  newDueDate: z.string().datetime(),
  deferralReason: z.string().min(10),
});

// ── Checklist Validators ────────────────────────────────────────────────────

export const checklistItemSchema = z.object({
  id: z.string(),
  label: z.string().min(3),
  description: z.string().optional(),
  isRequired: z.boolean().default(true),
  itemOrder: z.number().int().min(0),
  inputType: z.enum(['pass_fail', 'measurement', 'text', 'options']),
  toleranceMin: z.number().optional(),
  toleranceMax: z.number().optional(),
  unit: z.string().optional(),
  options: z.array(z.string()).optional(),
});

export const createChecklistTemplateSchema = z.object({
  organizationId: z.string().uuid(),
  deviceCategoryId: z.string().uuid().optional(),
  name: z.string().min(3),
  code: z.string().optional(),
  maintenanceType: z.enum([
    'preventive_maintenance', 'corrective_maintenance', 'troubleshooting',
    'inspection', 'calibration', 'electrical_safety_testing',
    'performance_testing', 'installation_commissioning',
    'software_configuration', 'decommissioning'
  ]).optional(),
  items: z.array(checklistItemSchema).min(1),
});

export const createChecklistVersionSchema = z.object({
  items: z.array(checklistItemSchema).min(1),
});

export const saveChecklistResultSchema = z.object({
  templateItemId: z.string(),
  resultCode: z.enum(['passed', 'failed', 'not_applicable', 'requires_follow_up']).optional(),
  measuredValue: z.string().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

export const saveChecklistProgressSchema = z.object({
  items: z.array(saveChecklistResultSchema).min(1),
});

// ── Parts & Costs Validators ────────────────────────────────────────────────

export const maintenancePartSchema = z.object({
  partNumber: z.string().min(1),
  partName: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  unitCost: z.number().int().min(0).optional(),
  currency: z.string().default('USD'),
  supplierName: z.string().optional(),
  notes: z.string().optional(),
});

export const maintenanceCostSchema = z.object({
  costType: z.enum(['part', 'vendor_service', 'labor', 'transport', 'other']),
  amount: z.number().int().min(0),
  currency: z.string().default('USD'),
  vendorName: z.string().optional(),
  invoiceNumber: z.string().optional(),
  description: z.string().optional(),
});

// ── Electronic Signature Validators ─────────────────────────────────────────

export const electronicSignatureSchema = z.object({
  signaturePurpose: z.enum(['perform', 'review', 'release', 'approve', 'reject', 'amend']),
  authMethod: z.enum(['password_reauth']).default('password_reauth'),
  password: z.string().min(1),
  comments: z.string().optional(),
});

export const reviewWorkSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  reviewNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  password: z.string().min(1),
});

export const releaseDeviceSchema = z.object({
  finalDeviceStatusCode: z.enum(['operational', 'operational_with_limitations']),
  releaseNotes: z.string().optional(),
  password: z.string().min(1),
});

export const amendRecordSchema = z.object({
  amendmentReason: z.string().min(10),
  corrections: z.record(z.string(), z.unknown()),
  password: z.string().min(1),
});

// ── Task Filter Schema ──────────────────────────────────────────────────────

export const maintenanceTaskFilterSchema = z.object({
  search: z.string().optional(),
  statusCode: z.string().optional(),
  maintenanceType: z.string().optional(),
  assignedEngineerUserId: z.string().uuid().optional(),
  hospitalId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  deviceId: z.string().uuid().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});
