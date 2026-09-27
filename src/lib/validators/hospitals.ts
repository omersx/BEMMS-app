import { z } from 'zod';

export const createHospitalSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  code: z.string().min(2, 'Code must be at least 2 characters').max(20),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  timezone: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
});

export const updateHospitalSchema = createHospitalSchema.partial().omit({ organizationId: true });
