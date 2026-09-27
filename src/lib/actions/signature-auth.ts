'use server';

import { db } from '@/lib/db';
import {
  electronicSignatures,
  signatureEvents,
  signaturePolicies,
  recordVersions,
  users,
} from '@/lib/db/schema';
import { verifyPassword } from '@/lib/auth/password';
import { requireAuth } from '@/lib/auth/rbac';
import { computeSHA256 } from '@/lib/utils/crypto';
import { eq, and, isNull, desc } from 'drizzle-orm';
import type { SignaturePolicyRequirement } from '@/lib/db/schema/signature-policies';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SignatureRequirement {
  purpose: string;
  allowedRoles: string[];
  required: boolean;
}

export interface CompletedSignature {
  id: string;
  purpose: string;
  signerName: string;
  signerRole: string;
  signedAt: Date;
  status: string;
  contentHash: string;
}

export interface SignatureStatusResult {
  required: SignatureRequirement[];
  completed: CompletedSignature[];
  pending: SignatureRequirement[];
  canSign: { purpose: string; allowed: boolean; reason?: string }[];
  policyId: string | null;
  requireIndependentReview: boolean;
  performerCanRelease: boolean;
}

// ── Password Re-Authentication ──────────────────────────────────────────────

/**
 * Verify the user's password before allowing a signature.
 * Never stores the password — only records that re-authentication succeeded.
 */
export async function verifySignatureAuth(
  userId: string,
  password: string
): Promise<{ success: true } | { success: false; error: string }> {
  if (!password || password.length === 0) {
    return { success: false, error: 'Password is required for signature re-authentication' };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, passwordHash: true, accountStatus: true },
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (user.accountStatus !== 'active') {
    return { success: false, error: 'Account is not active' };
  }

  if (!user.passwordHash) {
    return { success: false, error: 'No password set. Please set a password before signing.' };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { success: false, error: 'Incorrect password. Signature authentication failed.' };
  }

  return { success: true };
}

// ── Signature Event Hash Chain ──────────────────────────────────────────────

/**
 * Create an append-only signature event with hash chaining.
 * Each event's hash includes the previous event's hash, forming a tamper-detectable chain.
 */
export async function createSignatureEvent(
  txOrDb: any,
  params: {
    signatureId: string;
    eventType: 'created' | 'reviewed' | 'approved' | 'rejected' | 'amended' | 'superseded' | 'voided';
    actorUserId: string;
    organizationId: string;
    previousStatus?: string;
    newStatus?: string;
    reason?: string;
  }
): Promise<void> {
  const dbClient = txOrDb || db;

  // Get the last event for this signature to chain hashes
  const lastEvent = await dbClient
    .select({ currentEventHash: signatureEvents.currentEventHash })
    .from(signatureEvents)
    .where(eq(signatureEvents.signatureId, params.signatureId))
    .orderBy(desc(signatureEvents.timestamp))
    .limit(1);

  const previousHash = lastEvent.length > 0 ? lastEvent[0].currentEventHash : null;

  // Build the hash payload: eventType + actorUserId + timestamp + previousHash
  const now = new Date();
  const hashPayload = JSON.stringify({
    signatureId: params.signatureId,
    eventType: params.eventType,
    actorUserId: params.actorUserId,
    timestamp: now.toISOString(),
    previousEventHash: previousHash,
  });
  const currentHash = computeSHA256(hashPayload);

  await dbClient.insert(signatureEvents).values({
    organizationId: params.organizationId,
    signatureId: params.signatureId,
    eventType: params.eventType,
    actorUserId: params.actorUserId,
    timestamp: now,
    previousStatus: params.previousStatus as any,
    newStatus: params.newStatus as any,
    reason: params.reason,
    previousEventHash: previousHash,
    currentEventHash: currentHash,
  });
}

// ── Policy Resolution ───────────────────────────────────────────────────────

/**
 * Get the most specific applicable signature policy for a given context.
 * Resolution order (most specific wins):
 *   1. org + action + criticality + category
 *   2. org + action + criticality (no category)
 *   3. org + action (no criticality, no category) — default fallback
 */
export async function getApplicablePolicy(params: {
  organizationId: string;
  actionType: string;
  criticalityLevel?: string | null;
  deviceCategoryId?: string | null;
}): Promise<{
  policy: typeof signaturePolicies.$inferSelect | null;
  requirements: SignaturePolicyRequirement[];
}> {
  // Try most specific first: org + action + criticality + category
  if (params.criticalityLevel && params.deviceCategoryId) {
    const specific = await db.query.signaturePolicies.findFirst({
      where: and(
        eq(signaturePolicies.organizationId, params.organizationId),
        eq(signaturePolicies.actionType, params.actionType as any),
        eq(signaturePolicies.criticalityLevel, params.criticalityLevel as any),
        eq(signaturePolicies.deviceCategoryId, params.deviceCategoryId),
        eq(signaturePolicies.isActive, true),
      ),
    });
    if (specific) {
      return { policy: specific, requirements: specific.requiredSignatures as SignaturePolicyRequirement[] };
    }
  }

  // Try: org + action + criticality (no category)
  if (params.criticalityLevel) {
    const byCriticality = await db.query.signaturePolicies.findFirst({
      where: and(
        eq(signaturePolicies.organizationId, params.organizationId),
        eq(signaturePolicies.actionType, params.actionType as any),
        eq(signaturePolicies.criticalityLevel, params.criticalityLevel as any),
        isNull(signaturePolicies.deviceCategoryId),
        eq(signaturePolicies.isActive, true),
      ),
    });
    if (byCriticality) {
      return { policy: byCriticality, requirements: byCriticality.requiredSignatures as SignaturePolicyRequirement[] };
    }
  }

  // Fallback: org + action (no criticality, no category)
  const defaultPolicy = await db.query.signaturePolicies.findFirst({
    where: and(
      eq(signaturePolicies.organizationId, params.organizationId),
      eq(signaturePolicies.actionType, params.actionType as any),
      isNull(signaturePolicies.criticalityLevel),
      isNull(signaturePolicies.deviceCategoryId),
      eq(signaturePolicies.isActive, true),
    ),
  });

  if (defaultPolicy) {
    return { policy: defaultPolicy, requirements: defaultPolicy.requiredSignatures as SignaturePolicyRequirement[] };
  }

  // No policy found — return a safe default (performer signature required)
  return {
    policy: null,
    requirements: [
      { purpose: 'perform', allowedRoles: ['BME_TECHNICIAN', 'BME_ENGINEER', 'BME_MANAGER'], required: true },
    ],
  };
}

// ── Signature Status for a Record ───────────────────────────────────────────

/**
 * Get required & completed signatures status for an entity (maintenance record, etc.).
 * Returns what's required, what's done, what's pending, and what the current user can sign.
 */
export async function getSignatureStatus(
  entityType: string,
  entityId: string,
  actionType?: string,
): Promise<{ success: true; data: SignatureStatusResult } | { success: false; error: string }> {
  const user = await requireAuth();

  try {
    // Get all active signatures for this entity
    const sigs = await db.query.electronicSignatures.findMany({
      where: and(
        eq(electronicSignatures.entityId, entityId),
        eq(electronicSignatures.entityType, entityType as any),
      ),
    });

    const activeSigs = sigs.filter(s => s.signatureStatus === 'active');
    const completed: CompletedSignature[] = activeSigs.map(s => ({
      id: s.id,
      purpose: s.signaturePurpose,
      signerName: s.signerNameSnapshot,
      signerRole: s.signerRoleSnapshot,
      signedAt: s.signedAt,
      status: s.signatureStatus,
      contentHash: s.signedContentHashSha256,
    }));

    // Determine required signatures from policy
    let requirements: SignaturePolicyRequirement[] = [
      { purpose: 'perform', allowedRoles: ['BME_TECHNICIAN', 'BME_ENGINEER'], required: true },
    ];
    let policyId: string | null = null;
    let requireIndependentReview = false;
    let performerCanRelease = true;

    if (actionType) {
      // Look up the entity to find device criticality for policy resolution
      const { policy, requirements: policyReqs } = await getApplicablePolicy({
        organizationId: user.organizationId!,
        actionType,
      });
      if (policy) {
        requirements = policyReqs;
        policyId = policy.id;
        requireIndependentReview = policy.requireIndependentReview;
        performerCanRelease = policy.performerCanRelease;
      }
    }

    // Calculate pending: required but not yet completed
    const completedPurposes = new Set(completed.map(c => c.purpose));
    const pending = requirements.filter(r => r.required && !completedPurposes.has(r.purpose));

    // Calculate what the current user can sign
    const userRoles = user.roles || [];
    const performerSig = activeSigs.find(s => s.signaturePurpose === 'perform');

    const canSign = requirements.map(req => {
      // Already signed?
      if (completedPurposes.has(req.purpose)) {
        return { purpose: req.purpose, allowed: false, reason: 'Already signed' };
      }

      // Check role
      const hasRole = req.allowedRoles.some(r => userRoles.includes(r));
      if (!hasRole) {
        return { purpose: req.purpose, allowed: false, reason: 'Insufficient role' };
      }

      // Independent review check
      if (requireIndependentReview && req.purpose === 'review' && performerSig) {
        if (performerSig.signerUserId === user.id) {
          return { purpose: req.purpose, allowed: false, reason: 'Reviewer cannot be the same person as the performer' };
        }
      }

      // Release check
      if (!performerCanRelease && req.purpose === 'release' && performerSig) {
        if (performerSig.signerUserId === user.id) {
          return { purpose: req.purpose, allowed: false, reason: 'Performer cannot release this device' };
        }
      }

      // Check prior signatures are complete (e.g., can't review if not yet performed)
      const purposeOrder = ['perform', 'review', 'approve', 'release'];
      const thisIdx = purposeOrder.indexOf(req.purpose);
      if (thisIdx > 0) {
        const priorPurposes = purposeOrder.slice(0, thisIdx);
        for (const prior of priorPurposes) {
          const priorReq = requirements.find(r => r.purpose === prior && r.required);
          if (priorReq && !completedPurposes.has(prior)) {
            return { purpose: req.purpose, allowed: false, reason: `Waiting for ${prior} signature` };
          }
        }
      }

      return { purpose: req.purpose, allowed: true };
    });

    return {
      success: true,
      data: {
        required: requirements,
        completed,
        pending,
        canSign,
        policyId,
        requireIndependentReview,
        performerCanRelease,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── Get Signature Events for a Record ───────────────────────────────────────

/**
 * Get all signature events (hash-chained audit trail) for signatures on an entity.
 */
export async function getSignatureEvents(
  entityType: string,
  entityId: string,
): Promise<{ success: true; data: (typeof signatureEvents.$inferSelect)[] } | { success: false; error: string }> {
  await requireAuth();

  try {
    // First get all signature IDs for this entity
    const sigs = await db.query.electronicSignatures.findMany({
      where: and(
        eq(electronicSignatures.entityId, entityId),
        eq(electronicSignatures.entityType, entityType as any),
      ),
      columns: { id: true },
    });

    if (sigs.length === 0) {
      return { success: true, data: [] };
    }

    // Get all events for these signatures
    const allEvents: (typeof signatureEvents.$inferSelect)[] = [];
    for (const sig of sigs) {
      const events = await db.query.signatureEvents.findMany({
        where: eq(signatureEvents.signatureId, sig.id),
      });
      allEvents.push(...events);
    }

    // Sort chronologically
    allEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return { success: true, data: allEvents };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
