"use client"

import * as React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ShieldCheck,
  User,
  Clock,
  Hash,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  Eye,
  Wrench,
  AlertCircle,
  XCircle,
  RotateCcw,
  CheckCircle2,
  FileCheck,
} from "lucide-react"

// ── Types & Constants ────────────────────────────────────────────────────────

export interface ElectronicSignatureItem {
  id: string
  organizationId?: string
  recordVersionId?: string
  entityType?: string
  entityId?: string
  signaturePurpose:
    | "perform"
    | "review"
    | "release"
    | "approve"
    | "reject"
    | "amend"
    | "void"
    | "accept"
    | "resolve"
    | "close"
    | string
  signerUserId?: string
  signerNameSnapshot: string
  signerRoleSnapshot: string
  signerScopeSnapshot?: string | null
  attestationTextVersion: string
  authMethod?: string
  signedAt: Date | string
  displayTimezone?: string | null
  signedContentHashSha256: string
  signatureStatus: "active" | "superseded" | "rejected" | "voided" | string
  comments?: string | null
  signerUser?: {
    id?: string
    fullName?: string
    email?: string
  } | null
}

const PURPOSE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  perform: {
    label: "Performer / Work Executed",
    badgeClass:
      "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    icon: Wrench,
  },
  review: {
    label: "Technical Reviewer",
    badgeClass:
      "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    icon: Eye,
  },
  release: {
    label: "Release Authority",
    badgeClass:
      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    icon: Sparkles,
  },
  approve: {
    label: "Approval",
    badgeClass:
      "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
    icon: CheckCircle2,
  },
  reject: {
    label: "Rejection",
    badgeClass:
      "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
    icon: XCircle,
  },
  amend: {
    label: "Record Amendment",
    badgeClass:
      "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    icon: RotateCcw,
  },
  void: {
    label: "Voided",
    badgeClass:
      "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
    icon: AlertCircle,
  },
  accept: {
    label: "Engineer Acceptance / Work Started",
    badgeClass:
      "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800",
    icon: ShieldCheck,
  },
  resolve: {
    label: "Resolution Sign-Off",
    badgeClass:
      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  close: {
    label: "Ticket Closure Sign-Off",
    badgeClass:
      "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800",
    icon: FileCheck,
  },
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string
    borderClass: string
    badgeClass: string
    dotClass: string
  }
> = {
  active: {
    label: "Active",
    borderClass: "border-l-4 border-l-emerald-500 bg-card",
    badgeClass:
      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-500 text-white ring-emerald-200 dark:ring-emerald-900",
  },
  superseded: {
    label: "Superseded",
    borderClass:
      "border-l-4 border-l-slate-400 bg-slate-50/50 dark:bg-slate-900/30 opacity-90",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dotClass: "bg-slate-400 text-white ring-slate-200 dark:ring-slate-800",
  },
  voided: {
    label: "Voided",
    borderClass:
      "border-l-4 border-l-rose-500 bg-rose-50/30 dark:bg-rose-950/20",
    badgeClass:
      "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
    dotClass: "bg-rose-500 text-white ring-rose-200 dark:ring-rose-900",
  },
  rejected: {
    label: "Rejected",
    borderClass:
      "border-l-4 border-l-rose-500 bg-rose-50/30 dark:bg-rose-950/20",
    badgeClass:
      "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
    dotClass: "bg-rose-500 text-white ring-rose-200 dark:ring-rose-900",
  },
}

function formatSignatureTimestamp(
  dateValue: Date | string,
  timezone?: string | null
): string {
  try {
    const d = new Date(dateValue)
    const formatted = d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZoneName: "short",
    })
    return timezone && timezone !== "UTC" ? `${formatted} (${timezone})` : formatted
  } catch {
    return String(dateValue)
  }
}

// ── 1. SignatureCard Component ────────────────────────────────────────────────

export interface SignatureCardProps {
  signature: ElectronicSignatureItem | any
  className?: string
}

export function SignatureCard({ signature, className }: SignatureCardProps) {
  const [copied, setCopied] = useState(false)

  const purpose = signature?.signaturePurpose?.toLowerCase() || "perform"
  const purposeMeta = PURPOSE_CONFIG[purpose] || {
    label: purpose.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
    badgeClass: "bg-muted text-muted-foreground border-border",
    icon: ShieldCheck,
  }
  const PurposeIcon = purposeMeta.icon

  const status = signature?.signatureStatus?.toLowerCase() || "active"
  const statusMeta = STATUS_CONFIG[status] || STATUS_CONFIG.active

  const signerName =
    signature?.signerNameSnapshot ||
    signature?.signerUser?.fullName ||
    "Authorized Signer"
  const signerRole = signature?.signerRoleSnapshot || "Biomedical Specialist"

  const handleCopyHash = async () => {
    if (!signature?.signedContentHashSha256) return
    try {
      await navigator.clipboard.writeText(signature.signedContentHashSha256)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all shadow-sm border",
        statusMeta.borderClass,
        className
      )}
    >
      <CardHeader className="p-4 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          {/* Signer Info */}
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground truncate">
                  {signerName}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  • {signerRole}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Clock className="h-3 w-3 shrink-0" />
                <span>{formatSignatureTimestamp(signature.signedAt, signature.displayTimezone)}</span>
              </div>
            </div>
          </div>

          {/* Badges: Purpose & Status */}
          <div className="flex flex-wrap items-center gap-1.5 ml-auto">
            <Badge
              variant="outline"
              className={cn("inline-flex items-center gap-1 text-xs font-medium", purposeMeta.badgeClass)}
            >
              <PurposeIcon className="h-3 w-3" />
              <span>{purposeMeta.label}</span>
            </Badge>

            <Badge
              variant="outline"
              className={cn("capitalize text-xs font-semibold", statusMeta.badgeClass)}
            >
              {statusMeta.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-3">
        {/* Attestation Text in Quote Block */}
        {signature?.attestationTextVersion && (
          <blockquote className="relative rounded-r-md border-l-2 border-primary/50 bg-muted/40 px-3 py-2 text-xs italic text-foreground/90 leading-relaxed">
            &quot;{signature.attestationTextVersion}&quot;
          </blockquote>
        )}

        {/* Comments if any */}
        {signature?.comments && (
          <div className="flex items-start gap-2 rounded-md bg-muted/30 p-2.5 text-xs text-foreground/90 border border-border/60">
            <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 space-y-0.5">
              <span className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground block">
                Signer Comments:
              </span>
              <p className="whitespace-pre-wrap leading-normal">{signature.comments}</p>
            </div>
          </div>
        )}

        {/* SHA-256 Hash Display with Copy Button */}
        {signature?.signedContentHashSha256 && (
          <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/50 px-2.5 py-1.5">
            <div className="flex items-center gap-1.5 min-w-0 font-mono text-[11px] text-muted-foreground">
              <Hash className="h-3.5 w-3.5 shrink-0 text-primary/70" />
              <span className="truncate selection:bg-primary/20" title={signature.signedContentHashSha256}>
                SHA-256: {signature.signedContentHashSha256}
              </span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopyHash}
              className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground hover:bg-background shrink-0"
              title="Copy cryptographic signature hash"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── 2. SignatureTimeline Component ────────────────────────────────────────────

export interface SignatureTimelineProps {
  signatures?: ElectronicSignatureItem[] | any[]
  className?: string
  emptyMessage?: string
}

export function SignatureTimeline({
  signatures = [],
  className,
  emptyMessage = "No electronic signatures recorded for this record yet.",
}: SignatureTimelineProps) {
  // Sort chronologically (oldest first)
  const sortedSignatures = [...signatures].sort((a, b) => {
    const timeA = a.signedAt ? new Date(a.signedAt).getTime() : 0
    const timeB = b.signedAt ? new Date(b.signedAt).getTime() : 0
    return timeA - timeB
  })

  if (sortedSignatures.length === 0) {
    return (
      <div className={cn("rounded-lg border border-dashed p-8 text-center", className)}>
        <FileCheck className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm font-medium text-muted-foreground">{emptyMessage}</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Signatures will appear here after review and release execution.
        </p>
      </div>
    )
  }

  return (
    <div className={cn("relative space-y-6 pl-6 sm:pl-8", className)}>
      {/* Vertical Connecting Dotted Line */}
      <div
        className="absolute left-2.5 sm:left-3.5 top-3 bottom-3 w-0.5 border-l-2 border-dotted border-slate-300 dark:border-slate-700"
        aria-hidden="true"
      />

      {sortedSignatures.map((signature, index) => {
        const status = signature?.signatureStatus?.toLowerCase() || "active"
        const statusMeta = STATUS_CONFIG[status] || STATUS_CONFIG.active

        return (
          <div key={signature.id || `sig-${index}`} className="relative">
            {/* Timeline Node Bullet */}
            <div
              className={cn(
                "absolute -left-6 sm:-left-8 top-4 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full ring-4 shadow-xs",
                statusMeta.dotClass
              )}
            >
              <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>

            {/* Signature Card */}
            <SignatureCard signature={signature} />
          </div>
        )
      })}
    </div>
  )
}

export default SignatureTimeline
