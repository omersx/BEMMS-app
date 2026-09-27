import { z } from 'zod';

export const signatureRequirementSchema = z.object({
  purpose: z.enum(['accept', 'perform', 'review', 'approve', 'release', 'resolve', 'close']),
  allowedRoles: z.array(z.string()).min(1, 'At least one role must be allowed'),
  required: z.boolean(),
});

export const signaturePolicyActionSchema = z.enum([
  'complete_corrective',
  'complete_pm',
  'complete_calibration',
  'complete_testing',
  'release_device',
  'change_device_status',
  'resolve_ticket',
  'close_ticket',
  'approve_exception',
]);

export const signaturePolicySchema = z.object({
  id: z.string().uuid().optional(),
  organizationId: z.string().uuid(),
  hospitalId: z.string().uuid().nullable().optional(),
  actionType: signaturePolicyActionSchema,
  criticalityLevel: z.enum(['critical', 'high', 'medium', 'low']).nullable().optional(),
  deviceCategoryId: z.string().uuid().nullable().optional(),
  requiredSignatures: z.array(signatureRequirementSchema).min(1, 'At least one signature requirement is required'),
  requireIndependentReview: z.boolean().default(false),
  performerCanRelease: z.boolean().default(true),
  requireReauth: z.boolean().default(true),
  effectiveDate: z.date().or(z.string()).optional(),
  isActive: z.boolean().default(true),
  policyVersion: z.string().default('1.0'),
});

export const createSignaturePolicySchema = signaturePolicySchema.omit({
  id: true,
  organizationId: true,
});

export const updateSignaturePolicySchema = createSignaturePolicySchema.partial();

export const signActionSchema = z.object({
  signaturePurpose: z.enum(['accept', 'perform', 'review', 'approve', 'release', 'resolve', 'close', 'reject', 'amend', 'void']),
  password: z.string().min(1, 'Password is required for signature authentication'),
  comments: z.string().max(2000).optional(),
});
