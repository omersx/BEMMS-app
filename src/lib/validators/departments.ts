import { z } from 'zod';

export const createDepartmentSchema = z.object({
  organizationId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(20),
  departmentType: z.string().optional(),
  managerUserId: z.string().uuid().optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().omit({ organizationId: true, hospitalId: true });
