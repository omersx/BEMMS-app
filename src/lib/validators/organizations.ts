import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(20).toUpperCase(),
  defaultTimezone: z.string().default('UTC'),
  status: z.enum(['active', 'archived']).default('active'),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();
