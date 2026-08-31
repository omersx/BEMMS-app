import { z } from 'zod';

export const reportDateRangeSchema = z.object({
  startDate: z.string().datetime().optional(), // ISO date string
  endDate: z.string().datetime().optional(),
  timezone: z.string().default('UTC'),
});

export const reportFiltersSchema = z.object({
  organizationId: z.string().uuid().optional(),
  hospitalId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  deviceCategoryId: z.string().uuid().optional(),
  status: z.string().optional(),
  groupBy: z.enum(['hospital', 'department', 'category', 'status', 'manufacturer', 'priority', 'engineer', 'month', 'maintenance_type']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  timezone: z.string().default('UTC'),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(25),
});

export const inventoryReportFiltersSchema = reportFiltersSchema.extend({});
export const ticketPerformanceFiltersSchema = reportFiltersSchema.extend({});
export const maintenanceComplianceFiltersSchema = reportFiltersSchema.extend({});
export const costReportFiltersSchema = reportFiltersSchema.extend({});
export const workloadReportFiltersSchema = reportFiltersSchema.extend({});
export const deviceHistoryFiltersSchema = reportFiltersSchema.extend({
  deviceId: z.string().uuid().optional(),
});
