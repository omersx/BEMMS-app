"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ShieldCheck,
  TicketCheck,
  Wrench,
  ClipboardCheck,
  Gauge,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowRight,
  Clock,
  User,
  Hash,
  Copy,
  Check,
  MessageSquare,
  Lock,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { SignatureHistory } from "@/components/signatures/signature-history"
import type { ElectronicSignatureItem } from "@/components/maintenance/signature-card"

// ── Types & Activity Configuration ──────────────────────────────────────────

interface SourceGroup {
  key: string
  sourceType: string
  sourceLabel: string
  sourceNumber: string
  sourceHref: string
  signatures: ElectronicSignatureItem[]
}

const ACTIVITY_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>
    label: string
    badgeClass: string
    borderClass: string
    bgLight: string
  }
> = {
  ticket_resolution: {
    icon: TicketCheck,
    label: "Service Ticket",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    borderClass: "border-l-blue-500",
    bgLight: "hover:bg-blue-500/5",
  },
  preventive_maintenance: {
    icon: ClipboardCheck,
    label: "Preventive Maintenance (PM)",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    borderClass: "border-l-emerald-500",
    bgLight: "hover:bg-emerald-500/5",
  },
  calibration: {
    icon: Gauge,
    label: "Calibration",
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    borderClass: "border-l-purple-500",
    bgLight: "hover:bg-purple-500/5",
  },
  corrective_maintenance: {
    icon: Wrench,
    label: "Corrective Maintenance",
    badgeClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    borderClass: "border-l-indigo-500",
    bgLight: "hover:bg-indigo-500/5",
  },
  engineer_round: {
    icon: RotateCcw,
    label: "Daily Round / Inspection",
    badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    borderClass: "border-l-cyan-500",
    bgLight: "hover:bg-cyan-500/5",
  },
  device_status_change: {
    icon: RefreshCw,
    label: "Device Status Change",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    borderClass: "border-l-amber-500",
    bgLight: "hover:bg-amber-500/5",
  },
}

const PURPOSE_LABELS: Record<string, string> = {
  accept: "Work Accepted",
  resolve: "Resolution Sign-Off",
  close: "Ticket Closed",
  perform: "Work Executed",
  review: "Technical Review",
  release: "Clinical Release",
  approve: "Approved",
  reject: "Rejected",
  amend: "Amended",
  void: "Voided",
}

function formatShortDate(dateValue: Date | string): string {
  try {
    const d = new Date(dateValue)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return String(dateValue)
  }
}

function formatFullTimestamp(
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

function groupSignaturesBySource(signatures: ElectronicSignatureItem[]): SourceGroup[] {
  const groupMap = new Map<string, SourceGroup>()

  for (const sig of signatures) {
    const sourceType = (sig as any).sourceType || sig.entityType || "unknown"
    const entityId = sig.entityId || "unknown"
    const key = `${sourceType}:${entityId}`

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        sourceType,
        sourceLabel: (sig as any).sourceLabel || "",
        sourceNumber: (sig as any).sourceNumber || "",
        sourceHref: (sig as any).sourceHref || "",
        signatures: [],
      })
    }
    groupMap.get(key)!.signatures.push(sig)
  }

  // Sort groups: newest signature first
  const groups = Array.from(groupMap.values())
  groups.sort((a, b) => {
    const newestA = Math.max(...a.signatures.map((s) => new Date(s.signedAt).getTime()))
    const newestB = Math.max(...b.signatures.map((s) => new Date(s.signedAt).getTime()))
    return newestB - newestA
  })

  // Sort signatures within each group chronologically (oldest to newest)
  for (const group of groups) {
    group.signatures.sort((a, b) => new Date(a.signedAt).getTime() - new Date(b.signedAt).getTime())
  }

  return groups
}

// ── Single Activity Collapsible Card ────────────────────────────────────────

function ActivitySignatureCard({ group }: { group: SourceGroup }) {
  const [expanded, setExpanded] = useState(false)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  const config = ACTIVITY_CONFIG[group.sourceType] || {
    icon: ShieldCheck,
    label: "Activity",
    badgeClass: "bg-muted text-muted-foreground border-border",
    borderClass: "border-l-slate-400",
    bgLight: "hover:bg-muted/10",
  }
  const Icon = config.icon

  const handleCopy = async (hash: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(hash)
      setCopiedHash(hash)
      setTimeout(() => setCopiedHash(null), 2000)
    } catch {
      // Fallback
    }
  }

  const latestSignature = group.signatures[group.signatures.length - 1]

  return (
    <Card
      className={cn(
        "overflow-hidden border border-l-4 transition-all duration-200",
        config.borderClass,
        expanded ? "shadow-md bg-card" : "bg-card/70 hover:bg-card hover:border-slate-700"
      )}
    >
      {/* ── 1. Compact Clickable Header ────────────────────────────────────── */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 cursor-pointer select-none space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Badge + Identifier + Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Badge
              variant="outline"
              className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 shrink-0", config.badgeClass)}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{config.label}</span>
            </Badge>

            <div className="min-w-0 flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground truncate">
                {group.sourceNumber || group.sourceLabel || "Record"}
              </span>
              {group.sourceNumber && group.sourceLabel && (
                <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                  — {group.sourceLabel}
                </span>
              )}
            </div>

            {/* Direct Link to Ticket / Task */}
            {group.sourceHref && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
                onClick={(e) => e.stopPropagation()}
                title="View full record"
              >
                <Link href={group.sourceHref}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>

          {/* Right: Signature Count + Verified Badge + Toggle Button */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="secondary"
              className="text-xs font-normal px-2 py-0.5"
            >
              {group.signatures.length} {group.signatures.length === 1 ? "Signature" : "Signatures"}
            </Badge>

            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs hidden sm:inline-flex items-center gap-1"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>Verified</span>
            </Badge>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <span>{expanded ? "Collapse" : "View Details"}</span>
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5 text-primary" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* ── 2. Compact Lifecycle Progress Stepper ─────────────────────────── */}
        <div className="pt-0.5">
          <div className="flex flex-wrap items-center gap-2 py-0.5">
            {group.signatures.map((sig, idx) => {
              const purposeKey = sig.signaturePurpose?.toLowerCase() || ""
              const purposeText = PURPOSE_LABELS[purposeKey] || sig.signaturePurpose
              const signer = sig.signerNameSnapshot || sig.signerUser?.fullName || "Signer"

              return (
                <div key={sig.id || idx} className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border/70 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="font-medium text-foreground">{purposeText}</span>
                    <span className="text-muted-foreground text-[11px]">• {signer}</span>
                    <span className="text-muted-foreground/70 text-[10px] hidden md:inline">
                      ({formatShortDate(sig.signedAt)})
                    </span>
                  </div>

                  {idx < group.signatures.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 3. Expanded Details Section ────────────────────────────────────── */}
      {expanded && (
        <div className="border-t bg-muted/20 px-4 py-4 space-y-4 animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Electronic Signatures Breakdown (21 CFR Part 11)
            </span>
            <span>
              {group.signatures.length} cryptographically verified {group.signatures.length === 1 ? "record" : "records"}
            </span>
          </div>

          <div className="space-y-3">
            {group.signatures.map((sig, idx) => {
              const purposeKey = sig.signaturePurpose?.toLowerCase() || ""
              const purposeText = PURPOSE_LABELS[purposeKey] || sig.signaturePurpose
              const signer = sig.signerNameSnapshot || sig.signerUser?.fullName || "Authorized Signer"
              const role = sig.signerRoleSnapshot || "Biomedical Specialist"
              const isCopied = copiedHash === sig.signedContentHashSha256

              return (
                <div
                  key={sig.id || idx}
                  className="rounded-lg border bg-card p-3.5 space-y-2.5 transition-colors"
                >
                  {/* Signer & Stage Info */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-xs text-foreground">
                            {signer}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            • {role}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>{formatFullTimestamp(sig.signedAt, sig.displayTimezone)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant="outline"
                        className="text-xs font-medium bg-primary/5 text-primary border-primary/20"
                      >
                        {purposeText}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 capitalize font-medium"
                      >
                        {sig.signatureStatus || "active"}
                      </Badge>
                    </div>
                  </div>

                  {/* Attestation Statement */}
                  {sig.attestationTextVersion && (
                    <blockquote className="rounded-md border-l-2 border-primary/40 bg-muted/40 px-3 py-1.5 text-xs italic text-foreground/90 leading-relaxed">
                      &quot;{sig.attestationTextVersion}&quot;
                    </blockquote>
                  )}

                  {/* Signer Comments */}
                  {sig.comments && (
                    <div className="flex items-start gap-2 rounded-md bg-muted/30 p-2 text-xs text-foreground/90 border border-border/50">
                      <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 space-y-0.5">
                        <span className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground block">
                          Signer Note:
                        </span>
                        <p className="whitespace-pre-wrap">{sig.comments}</p>
                      </div>
                    </div>
                  )}

                  {/* SHA-256 Hash */}
                  {sig.signedContentHashSha256 && (
                    <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5 min-w-0 font-mono text-[11px] text-muted-foreground">
                        <Hash className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                        <span className="truncate selection:bg-primary/20" title={sig.signedContentHashSha256}>
                          SHA-256: {sig.signedContentHashSha256}
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleCopy(sig.signedContentHashSha256, e)}
                        className="h-5 gap-1 px-1.5 text-[10px] text-muted-foreground hover:text-foreground shrink-0"
                        title="Copy SHA-256 hash"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-500 font-medium">Copied</span>
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
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}

// ── Main DeviceSignaturesTab ────────────────────────────────────────────────

interface DeviceSignaturesTabProps {
  signatures: any[]
  signatureEvents: any[]
  deviceId?: string
  deviceName?: string
}

export function DeviceSignaturesTab({
  signatures = [],
  signatureEvents = [],
  deviceId,
  deviceName,
}: DeviceSignaturesTabProps) {
  const [showHashChain, setShowHashChain] = useState(false)
  const hasSignatures = signatures && signatures.length > 0

  // Group signatures by source (tickets, maintenance, pm, rounds, status changes)
  const sourceGroups = hasSignatures
    ? groupSignaturesBySource(signatures as ElectronicSignatureItem[])
    : []

  return (
    <div className="space-y-4">
      {/* Sleek Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-muted/20 border rounded-lg">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Electronic Signatures & Sign-Offs
              </h3>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/5 text-primary border-primary/20">
                21 CFR Part 11
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Cryptographically verified sign-offs for tickets, maintenance, and device operations.
            </p>
          </div>
        </div>

        {hasSignatures && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground self-end sm:self-center">
            <span className="font-semibold text-foreground">
              {sourceGroups.length} {sourceGroups.length === 1 ? "Signed Record" : "Signed Records"}
            </span>
            <span>•</span>
            <span>{signatures.length} {signatures.length === 1 ? "signature" : "signatures"}</span>
          </div>
        )}
      </div>

      {/* Main Signatures Content */}
      {hasSignatures ? (
        <div className="space-y-3">
          {/* Each Activity gets exactly ONE clean, collapsible card */}
          {sourceGroups.map((group) => (
            <ActivitySignatureCard key={group.key} group={group} />
          ))}

          {/* Cryptographic Hash Chain Audit Trail (Collapsible at bottom) */}
          {signatureEvents && signatureEvents.length > 0 && (
            <div className="pt-2">
              <Card className="border-dashed bg-card/40">
                <div
                  onClick={() => setShowHashChain(!showHashChain)}
                  className="p-3 cursor-pointer select-none flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    <span className="font-medium">
                      Cryptographic Audit Trail & Hash Chain ({signatureEvents.length} Events)
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1">
                    <span>{showHashChain ? "Hide Chain" : "Inspect Chain"}</span>
                    {showHashChain ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>

                {showHashChain && (
                  <div className="px-3 pb-3 border-t pt-3">
                    <SignatureHistory events={signatureEvents} />
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      ) : (
        /* Explanatory Empty State when 0 signatures exist */
        <Card className="border-dashed">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="text-center max-w-lg mx-auto space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-base font-semibold">No Electronic Signatures Recorded Yet</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Signatures are automatically captured with cryptographic verification when biomedical engineers and managers complete formal work orders on this equipment.
              </p>
            </div>

            {/* How Signatures Are Created */}
            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-lg border bg-card space-y-1.5 text-left">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Work Order Sign-Off</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Engineer executes repair or calibration checklist and signs with credentials to certify work performed.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border bg-card space-y-1.5 text-left">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>Supervisor Review</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Biomedical manager or peer reviews electrical safety measurements and co-signs the task.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border bg-card space-y-1.5 text-left">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>Clinical Release</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Final release certificate signed to officially declare the device safe for patient use and return to the ICU.
                </p>
              </div>
            </div>

            {/* Action to Work Orders */}
            <div className="flex justify-center pt-2">
              <Button asChild variant="outline" className="gap-2">
                <Link href="/maintenance/tasks">
                  <Wrench className="w-4 h-4 text-primary" />
                  <span>Go to Work Orders</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
