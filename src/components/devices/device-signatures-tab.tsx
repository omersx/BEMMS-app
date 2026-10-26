"use client"

import { SignatureTimeline, type ElectronicSignatureItem } from "@/components/maintenance/signature-card"
import { SignatureHistory } from "@/components/signatures/signature-history"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ShieldCheck,
  Wrench,
  ArrowRight,
  TicketCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"

// ── Source grouping helpers ──────────────────────────────────────────────────

interface SourceGroup {
  key: string
  sourceType: string
  sourceLabel: string
  sourceNumber: string
  sourceHref: string
  signatures: ElectronicSignatureItem[]
}

const SOURCE_TYPE_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>
    label: string
    badgeClass: string
    borderClass: string
  }
> = {
  ticket_resolution: {
    icon: TicketCheck,
    label: "Service Ticket",
    badgeClass:
      "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    borderClass: "border-l-blue-500",
  },
  maintenance_record: {
    icon: Wrench,
    label: "Maintenance Task",
    badgeClass:
      "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800",
    borderClass: "border-l-indigo-500",
  },
  device_status_change: {
    icon: RefreshCw,
    label: "Device Status Change",
    badgeClass:
      "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    borderClass: "border-l-amber-500",
  },
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

  // Sort groups: tickets first, then maintenance, then device status, by newest sig in each group
  const groups = Array.from(groupMap.values())
  const typeOrder: Record<string, number> = {
    ticket_resolution: 0,
    maintenance_record: 1,
    device_status_change: 2,
  }

  groups.sort((a, b) => {
    // First sort by type
    const orderA = typeOrder[a.sourceType] ?? 3
    const orderB = typeOrder[b.sourceType] ?? 3
    if (orderA !== orderB) return orderA - orderB

    // Then by newest signature date (descending)
    const newestA = Math.max(
      ...a.signatures.map((s) => new Date(s.signedAt).getTime())
    )
    const newestB = Math.max(
      ...b.signatures.map((s) => new Date(s.signedAt).getTime())
    )
    return newestB - newestA
  })

  return groups
}

// ── Source Group Header ─────────────────────────────────────────────────────

function SourceGroupHeader({ group }: { group: SourceGroup }) {
  const config = SOURCE_TYPE_CONFIG[group.sourceType] || {
    icon: ShieldCheck,
    label: "Signature",
    badgeClass: "bg-muted text-muted-foreground border-border",
    borderClass: "border-l-slate-400",
  }
  const Icon = config.icon

  const title = group.sourceNumber
    ? `${group.sourceNumber} — ${group.sourceLabel}`
    : group.sourceLabel || config.label

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <Badge
          variant="outline"
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 ${config.badgeClass}`}
        >
          <Icon className="h-3.5 w-3.5" />
          <span>{config.label}</span>
        </Badge>
        <span className="text-sm font-medium text-foreground truncate">
          {title}
        </span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
          {group.signatures.length} {group.signatures.length === 1 ? "signature" : "signatures"}
        </Badge>
      </div>

      {group.sourceHref && (
        <Link
          href={group.sourceHref}
          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 hover:underline underline-offset-2 shrink-0 transition-colors"
        >
          <span>View</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
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
  const hasSignatures = signatures && signatures.length > 0

  // Group signatures by source (ticket, maintenance task, device status change)
  const sourceGroups = hasSignatures
    ? groupSignaturesBySource(signatures as ElectronicSignatureItem[])
    : []

  return (
    <div className="space-y-6">
      {/* Compliance Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/30 border rounded-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="text-base font-semibold">21 CFR Part 11 Electronic Signatures</h3>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              Cryptographic Audit Trail
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Tamper-evident, SHA-256 hashed electronic signatures verifying maintenance execution, technical peer review, and clinical release to service for patient safety compliance.
          </p>
        </div>
      </div>

      {/* Main Signatures Content */}
      {hasSignatures ? (
        <div className="space-y-6">
          {/* Grouped signatures by source */}
          {sourceGroups.map((group) => {
            const config = SOURCE_TYPE_CONFIG[group.sourceType] || {
              borderClass: "border-l-slate-400",
            }

            return (
              <div
                key={group.key}
                className={`rounded-lg border bg-card/50 overflow-hidden border-l-4 ${config.borderClass}`}
              >
                {/* Group Header */}
                <div className="px-4 pt-3 pb-1">
                  <SourceGroupHeader group={group} />
                </div>

                {/* Signatures within this group */}
                <div className="px-4 pb-4">
                  <SignatureTimeline signatures={group.signatures} />
                </div>
              </div>
            )
          })}

          {/* Signature Event Audit Trail */}
          {signatureEvents && signatureEvents.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Signature Event Audit Trail (Hash Chain)</h4>
                <SignatureHistory events={signatureEvents} />
              </div>
            </>
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
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>Work Order Sign-Off</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Engineer executes repair or calibration checklist and signs with credentials to certify work performed.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border bg-card space-y-1.5 text-left">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>Supervisor Review</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Biomedical manager or peer reviews electrical safety measurements and co-signs the task.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border bg-card space-y-1.5 text-left">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">3</span>
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
