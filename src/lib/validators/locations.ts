import { z } from 'zod';

export const createLocationSchema = z.object({
  organizationId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  departmentId: z.string().uuid(),
  parentLocationId: z.string().uuid().optional(),
  locationType: z.enum(['building', 'floor', 'room', 'area', 'workshop', 'store', 'other']),
  name: z.string().min(1).max(100),
  code: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
});

export const updateLocationSchema = createLocationSchema.partial().omit({ organizationId: true, hospitalId: true, departmentId: true });
