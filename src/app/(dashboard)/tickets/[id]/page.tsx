import { getTicketById, getTicketComments, getTicketTimeline, getTicketSignatures } from "@/lib/actions/tickets"
import { getUsers } from "@/lib/actions/users"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TicketStatusBadge, TicketPriorityBadge, TicketImpactBadge } from "@/components/tickets/ticket-badges"
import { DeviceStatusBadge } from "@/components/devices/device-badges"
import { TicketTimeline } from "@/components/tickets/ticket-timeline"
import { TicketCommentSection } from "@/components/tickets/ticket-comment-section"
import { TicketTriagePanel } from "@/components/tickets/ticket-triage-panel"
import { TicketActionButtons, ResumeWorkButton } from "@/components/tickets/ticket-action-buttons"
import { TicketSignaturesPanel } from "@/components/tickets/ticket-signatures-panel"
import { MapPin, Phone, User as UserIcon, Monitor, Clock, AlertTriangle, CheckCircle, ShieldCheck, AlertOctagon, Package, Info } from "lucide-react"
import Link from "next/link"
import { use } from "react"

export const dynamic = 'force-dynamic'

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TicketDetailContent ticketId={id} />
}

async function TicketDetailContent({ ticketId }: { ticketId: string }) {
  const [ticketRes, commentsRes, timelineRes, usersRes, signaturesRes] = await Promise.all([
    getTicketById(ticketId),
    getTicketComments(ticketId),
    getTicketTimeline(ticketId),
    getUsers(),
    getTicketSignatures(ticketId),
  ])

  const ticket = ticketRes?.success ? ticketRes.data : null
  const comments = (commentsRes?.success && Array.isArray(commentsRes.data)) ? commentsRes.data : []
  const timeline = (timelineRes?.success && Array.isArray(timelineRes.data)) ? timelineRes.data : []
  const engineers = (usersRes?.success && Array.isArray(usersRes.data)) ? usersRes.data : []
  const signatures = (signaturesRes?.success && Array.isArray(signaturesRes.data?.signatures)) ? signaturesRes.data.signatures : []

  if (!ticket) return <div className="p-8 text-center text-muted-foreground">Ticket not found</div>

  // In a real app, you'd check session role here. For now, we assume user is biomed and can triage/see internal.
  const isBiomed = true

  const reportedDate = ticket.reportedAt 
    ? new Date(ticket.reportedAt).toISOString().replace('T', ' ').substring(0, 16)
    : ''

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.title}
        description={`Ticket ${ticket.ticketNumber}${reportedDate ? ` — Reported ${reportedDate} UTC` : ''}`}
      >
        <div className="flex gap-2 items-center">
          <TicketPriorityBadge priority={ticket.priorityCode} />
          <TicketStatusBadge status={ticket.statusCode} />
          <TicketActionButtons
            ticketId={ticketId}
            statusCode={ticket.statusCode}
            hasDevice={!!ticket.deviceId}
            ticketNumber={ticket.ticketNumber}
            currentDeviceStatus={ticket.device?.currentStatusCode}
          />
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Problem Description</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-wrap">{ticket.description}</p>
              
              <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase">Reported Impact</span>
                  <div><TicketImpactBadge impact={ticket.reportedImpact} /></div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase">Category</span>
                  <div className="text-sm font-medium">{ticket.reportedProblemCategory || "Not specified"}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Waiting for Spare Parts Card */}
          {['in_progress', 'waiting_parts_vendor', 'in_triage', 'acknowledged'].includes(ticket.statusCode) &&
            (ticket.statusCode === 'waiting_parts_vendor' || ticket.device?.currentStatusCode === 'waiting_for_parts' || ticket.waitingReason) && (
              <Card className="border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm overflow-hidden">
                <CardHeader className="pb-3 border-b border-amber-200/80 dark:border-amber-800/60 bg-amber-100/40 dark:bg-amber-900/20">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-amber-500/10 dark:bg-amber-400/10 rounded-md border border-amber-300/60 dark:border-amber-700/60">
                        <Package className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-amber-950 dark:text-amber-100">
                          Equipment On Hold — Waiting for Spare Parts
                        </CardTitle>
                        <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                          Active maintenance paused pending replacement component delivery
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1 border-0 shadow-sm">
                        <Clock className="w-3 h-3" />
                        Parts On Order
                      </Badge>
                      <ResumeWorkButton ticketId={ticketId} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-white/80 dark:bg-zinc-900/70 rounded-md border border-amber-200/70 dark:border-amber-800/50 space-y-1">
                      <span className="text-xs font-semibold uppercase text-amber-800 dark:text-amber-300 tracking-wider">
                        Required Part / Component
                      </span>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {ticket.waitingReason || "Spare parts ordered"}
                      </p>
                    </div>

                    {ticket.waitingDependencyType ? (
                      <div className="p-3 bg-white/80 dark:bg-zinc-900/70 rounded-md border border-amber-200/70 dark:border-amber-800/50 space-y-1">
                        <span className="text-xs font-semibold uppercase text-amber-800 dark:text-amber-300 tracking-wider">
                          Supplier / PO Reference
                        </span>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {ticket.waitingDependencyType}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-white/80 dark:bg-zinc-900/70 rounded-md border border-amber-200/70 dark:border-amber-800/50 space-y-1">
                        <span className="text-xs font-semibold uppercase text-amber-800 dark:text-amber-300 tracking-wider">
                          Equipment Status
                        </span>
                        <div>
                          <DeviceStatusBadge status={ticket.device?.currentStatusCode || 'waiting_for_parts'} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2.5 rounded-md bg-amber-100/60 dark:bg-amber-900/30 p-3 text-xs text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/50">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      The linked medical device is marked <strong>Waiting for Spare Parts</strong> across hospital department dashboards. Clinical staff have been notified that this unit is unavailable. When parts arrive, click <strong>Parts Received (Resume)</strong> to restart work.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Resolution / Disposition Details Card */}
          {ticket.resolutionSummary && ['resolved', 'closed'].includes(ticket.statusCode) && (
            (() => {
              const status = ticket.finalDeviceStatusCode || ''
              const isOutOfService = ['out_of_service', 'decommissioned'].includes(status)
              const isLimited = status === 'operational_with_limitations'
              const isAwaitingRelease = status === 'awaiting_release'
              const isStandby = status === 'standby'
              const isConflict = ['under_repair', 'waiting_for_parts', 'under_maintenance'].includes(status)

              let cardStyle = "border-emerald-200 dark:border-emerald-950 bg-emerald-50/20 dark:bg-emerald-950/10"
              let headerBorder = "border-emerald-100 dark:border-emerald-900/40"
              let titleColor = "text-emerald-950 dark:text-emerald-200"
              let icon = <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              let title = "Resolution Summary — Fully Operational"

              if (isOutOfService) {
                cardStyle = "border-rose-300 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20"
                headerBorder = "border-rose-200 dark:border-rose-900/50"
                titleColor = "text-rose-950 dark:text-rose-200"
                icon = <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
                title = status === 'decommissioned'
                  ? "Equipment Disposition — Decommissioned (Retired)"
                  : "Equipment Disposition — Out of Service (Unrepairable)"
              } else if (isLimited) {
                cardStyle = "border-amber-300 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/20"
                headerBorder = "border-amber-200 dark:border-amber-900/50"
                titleColor = "text-amber-950 dark:text-amber-200"
                icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                title = "Resolution Summary — Operational with Limitations"
              } else if (isAwaitingRelease) {
                cardStyle = "border-purple-300 dark:border-purple-900 bg-purple-50/30 dark:bg-purple-950/20"
                headerBorder = "border-purple-200 dark:border-purple-900/50"
                titleColor = "text-purple-950 dark:text-purple-200"
                icon = <Clock className="w-5 h-5 text-purple-600 shrink-0" />
                title = "Resolution Summary — Awaiting QA / Regulatory Release"
              } else if (isStandby) {
                cardStyle = "border-blue-300 dark:border-blue-900 bg-blue-50/25 dark:bg-blue-950/20"
                headerBorder = "border-blue-200 dark:border-blue-900/50"
                titleColor = "text-blue-950 dark:text-blue-200"
                icon = <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                title = "Resolution Summary — Restored to Standby Reserve"
              } else if (isConflict) {
                cardStyle = "border-amber-400 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30"
                headerBorder = "border-amber-300 dark:border-amber-800/60"
                titleColor = "text-amber-950 dark:text-amber-200"
                icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                title = "Resolution Status Conflict — Device Still Under Repair"
              }

              return (
                <Card className={cardStyle}>
                  <CardHeader className={`pb-3 border-b ${headerBorder}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {icon}
                        <CardTitle className={`text-base ${titleColor}`}>
                          {title}
                        </CardTitle>
                      </div>
                      {ticket.finalDeviceStatusCode && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-muted-foreground">Final Device Status:</span>
                          <DeviceStatusBadge status={ticket.finalDeviceStatusCode} />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    {isConflict && (
                      <div className="rounded bg-amber-100/80 dark:bg-amber-900/40 p-2.5 text-xs text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                        ⚠️ <strong>Workflow Notice:</strong> This ticket was marked resolved, but the device is currently <em>Under Repair</em>. If repair work is still in progress, use the <strong>Reopen / Resume Work</strong> button above to resume tracking.
                      </div>
                    )}
                    {isOutOfService && (
                      <div className="rounded bg-rose-100/80 dark:bg-rose-950/60 p-2.5 text-xs text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
                        🚫 <strong>Non-Clinical Disposition:</strong> This medical device is flagged out of clinical service and barred from patient use.
                      </div>
                    )}
                    {isAwaitingRelease && (
                      <div className="rounded bg-purple-100/80 dark:bg-purple-950/60 p-2.5 text-xs text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-800">
                        ⏳ <strong>QA Release Verification Required:</strong> Repair work is completed, but this unit must be inspected and released by Biomedical Quality Assurance before bedside deployment.
                      </div>
                    )}
                    {isStandby && (
                      <div className="rounded bg-blue-100/80 dark:bg-blue-950/60 p-2.5 text-xs text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-800">
                        💤 <strong>Equipment Pool / Reserve:</strong> Equipment is verified operational and stored as backup inventory.
                      </div>
                    )}
                    {isLimited && ticket.device?.statusLimitationsNote && (
                      <div className="rounded bg-amber-100/90 dark:bg-amber-950/60 p-2.5 text-xs text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800 space-y-1">
                        <span className="font-semibold block uppercase tracking-wider text-[11px] text-amber-800 dark:text-amber-300">
                          Active Clinical Limitations / Restrictions:
                        </span>
                        <p className="font-medium">{ticket.device.statusLimitationsNote}</p>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{ticket.resolutionSummary}</p>
                    {ticket.resolvedAt && (
                      <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                        Resolved {new Date(ticket.resolvedAt).toISOString().replace('T', ' ').substring(0, 16)} UTC
                        {(ticket as any).resolvedByUser?.fullName ? ` by ${(ticket as any).resolvedByUser.fullName}` : ''}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })()
          )}

          {/* Electronic Signatures Panel */}
          <TicketSignaturesPanel signatures={signatures} />

          {isBiomed && ['new', 'acknowledged', 'in_triage', 'waiting_requester'].includes(ticket.statusCode) && (
            <TicketTriagePanel
              ticketId={ticketId}
              currentPriority={ticket.priorityCode}
              engineers={engineers}
            />
          )}

          <Card>
            <CardHeader><CardTitle>Updates & Notes</CardTitle></CardHeader>
            <CardContent>
              <TicketCommentSection
                ticketId={ticketId}
                comments={comments as any}
                canAddInternal={isBiomed}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Meta & Timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Context</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2"><Monitor className="w-4 h-4" /> Device</h4>
                {ticket.device ? (
                  <div className="pl-6 space-y-1">
                    <Link href={`/devices/${ticket.deviceId}`} className="text-primary hover:underline font-medium block">
                      {ticket.device.name}
                    </Link>
                    <p className="text-muted-foreground">Asset: {ticket.device.assetNumber}</p>
                  </div>
                ) : (
                  <p className="pl-6 text-muted-foreground">No device linked.</p>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t">
                <h4 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4" /> Location</h4>
                <div className="pl-6 space-y-1">
                  <p>{(ticket as any).hospital?.name}</p>
                  <p>{(ticket as any).department?.name}</p>
                  <p className="text-muted-foreground">{ticket.reportedLocationCorrection || (ticket as any).location?.name || "No specific room"}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <h4 className="font-semibold flex items-center gap-2"><UserIcon className="w-4 h-4" /> Reporter</h4>
                <div className="pl-6 space-y-1">
                  <p>{(ticket as any).reportedByUser?.fullName}</p>
                  {(ticket.requesterContactPhone || ticket.requesterContactName) && (
                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" />
                      {ticket.requesterContactName} {ticket.requesterContactPhone}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <h4 className="font-semibold flex items-center gap-2"><Clock className="w-4 h-4" /> Assignment</h4>
                <div className="pl-6 space-y-1">
                  {ticket.assignedEngineerUserId ? (
                    <p>{(ticket as any).assignedEngineer?.fullName}</p>
                  ) : (
                    <p className="text-muted-foreground italic">Unassigned</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent>
              <TicketTimeline entries={timeline as any} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
