import { z } from 'zod';

export const createHospitalSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(20),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  timezone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
});

export const updateHospitalSchema = createHospitalSchema.partial().omit({ organizationId: true });
