import { z } from 'zod';

export const inviteUserSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  jobTitle: z.string().optional(),
  employeeIdentifier: z.string().optional(),
  phone: z.string().optional(),
  organizationId: z.string().uuid(),
  roleIds: z.array(z.string().uuid()),
});

export const updateUserProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  employeeIdentifier: z.string().optional(),
});

export const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  effectiveFrom: z.date().optional(),
  effectiveTo: z.date().optional(),
});

export const assignScopeSchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  scopeType: z.enum(['organization', 'hospital', 'department', 'location']),
  hospitalId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
});
