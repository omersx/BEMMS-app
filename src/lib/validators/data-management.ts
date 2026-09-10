import { z } from 'zod';

export const deviceImportRowSchema = z.object({
  assetNumber: z.string().min(1, 'Asset number is required').trim(),
  name: z.string().min(1, 'Device name is required').trim(),
  model: z.string().optional().default(''),
  serialNumber: z.string().optional().default(''),
  categoryName: z.string().min(1, 'Category is required').trim(),
  manufacturerName: z.string().min(1, 'Manufacturer is required').trim(),
  departmentName: z.string().min(1, 'Department is required').trim(),
  locationDescription: z.string().optional().default(''),
  riskClassification: z.enum(['class_i', 'class_iia', 'class_iib', 'class_iii']).default('class_i'),
  criticalityLevel: z.enum(['low', 'medium', 'high']).default('medium'),
});

export type DeviceImportRow = z.infer<typeof deviceImportRowSchema>;

export interface DeviceImportValidationResult {
  rowNumber: number;
  data: DeviceImportRow;
  status: 'valid' | 'warning' | 'error';
  messages: string[];
  resolvedCategoryId?: string;
  resolvedManufacturerId?: string;
  resolvedDepartmentId?: string;
  willCreateCategory?: boolean;
  willCreateManufacturer?: boolean;
}

export const purgeDataSchema = z.object({
  scope: z.enum(['test_transactions', 'factory_reset']),
  confirmText: z.string().min(1, 'Confirmation phrase is required'),
  password: z.string().min(1, 'Admin password is required'),
  reason: z.string().optional(),
});

export type PurgeDataPayload = z.infer<typeof purgeDataSchema>;

export const exportRequestSchema = z.object({
  entities: z.array(z.enum(['devices', 'departments', 'catalogs', 'tickets', 'audit_logs'])).min(1, 'Select at least one entity'),
  format: z.enum(['csv', 'json']).default('csv'),
});

export type ExportRequest = z.infer<typeof exportRequestSchema>;
