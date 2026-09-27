import { z } from 'zod';

export const createDeviceCategorySchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(2).max(100),
  code: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  riskClassification: z.enum(['class_i', 'class_iia', 'class_iib', 'class_iii']).optional(),
  criticalityLevel: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  defaultPmIntervalDays: z.number().int().positive().optional(),
});

export const updateDeviceCategorySchema = createDeviceCategorySchema.partial().omit({ organizationId: true });

export const createManufacturerSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(2).max(150),
  code: z.string().max(50).optional(),
  country: z.string().max(100).optional(),
  supportEmail: z.string().email().optional().or(z.literal('')),
  supportPhone: z.string().max(30).optional(),
  website: z.string().url().optional().or(z.literal('')),
});

export const updateManufacturerSchema = createManufacturerSchema.partial().omit({ organizationId: true });

export const createDeviceSchema = z.object({
  organizationId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  departmentId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
  exactLocationDescription: z.string().max(200).optional(),
  name: z.string().min(2).max(200),
  assetNumber: z.string().min(1).max(50),
  serialNumber: z.string().max(100).optional(),
  deviceCategoryId: z.string().uuid().optional().or(z.literal('')),
  manufacturerId: z.string().uuid().optional(),
  deviceModelId: z.string().uuid().optional(),
  modelNameFree: z.string().max(200).optional(),
  criticalityLevel: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  riskClassification: z.enum(['class_i', 'class_iia', 'class_iib', 'class_iii']).optional(),
  purchaseDate: z.string().optional(),
  purchaseCost: z.string().optional(),
  currency: z.string().max(5).optional(),
  installationDate: z.string().optional(),
  commissioningDate: z.string().optional(),
  warrantyStartDate: z.string().optional(),
  warrantyEndDate: z.string().optional(),
  technicalSpecifications: z.any().optional(),
  assignedEngineerUserId: z.string().uuid().optional(),
});

export const updateDeviceSchema = createDeviceSchema.partial().omit({ organizationId: true });

export const transferDeviceSchema = z.object({
  destinationHospitalId: z.string().uuid(),
  destinationDepartmentId: z.string().uuid(),
  destinationLocationId: z.string().uuid().optional(),
  transferReason: z.enum(['relocation', 'temporary_loan', 'department_change', 'correction', 'replacement', 'workshop', 'storage', 'other']),
  notes: z.string().max(500).optional(),
});

export const changeDeviceStatusSchema = z.object({
  newStatusCode: z.enum([
    'operational', 'operational_with_limitations', 'under_maintenance', 'under_repair',
    'waiting_for_parts', 'awaiting_release', 'out_of_service', 'standby', 'decommissioned'
  ]),
  reason: z.string().min(5).max(500),
  notes: z.string().max(1000).optional(),
  limitationsNote: z.string().max(500).optional(),
  ticketId: z.string().uuid().optional(),
  maintenanceRecordId: z.string().uuid().optional(),
});

export const decommissionDeviceSchema = z.object({
  reason: z.string().min(10).max(500),
  disposition: z.string().max(200).optional(),
  technicalApprovalNotes: z.string().max(500).optional(),
});

export const deviceFilterSchema = z.object({
  search: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  hospitalId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  manufacturerId: z.string().uuid().optional(),
  status: z.string().optional(),
  criticality: z.string().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});
