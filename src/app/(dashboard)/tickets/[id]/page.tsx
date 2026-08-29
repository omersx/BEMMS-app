import { getTicketById, getTicketComments, getTicketTimeline } from "@/lib/actions/tickets"
import { getUsers } from "@/lib/actions/users"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TicketStatusBadge, TicketPriorityBadge, TicketImpactBadge } from "@/components/tickets/ticket-badges"
import { TicketTimeline } from "@/components/tickets/ticket-timeline"
import { TicketCommentSection } from "@/components/tickets/ticket-comment-section"
import { TicketTriagePanel } from "@/components/tickets/ticket-triage-panel"
import { MapPin, Phone, User as UserIcon, Monitor, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { use } from "react"

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <TicketDetailContent ticketId={id} />
}

async function TicketDetailContent({ ticketId }: { ticketId: string }) {
  const [ticketRes, commentsRes, timelineRes, usersRes] = await Promise.all([
    getTicketById(ticketId),
    getTicketComments(ticketId),
    getTicketTimeline(ticketId),
    getUsers(), // Just a simplified call to get engineers for assignment
  ])

  const ticket = ticketRes?.success ? ticketRes.data : null
  const comments = (commentsRes?.success && Array.isArray(commentsRes.data)) ? commentsRes.data : []
  const timeline = (timelineRes?.success && Array.isArray(timelineRes.data)) ? timelineRes.data : []
  const engineers = (usersRes?.success && Array.isArray(usersRes.data)) ? usersRes.data : []

  if (!ticket) return <div className="p-8 text-center text-muted-foreground">Ticket not found</div>

  // In a real app, you'd check session role here. For now, we assume user is biomed and can triage/see internal.
  const isBiomed = true

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.title}
        description={`Ticket ${ticket.ticketNumber} — Reported ${new Date(ticket.reportedAt).toLocaleString()}`}
      >
        <div className="flex gap-2 items-center">
          <TicketPriorityBadge priority={ticket.priorityCode} />
          <TicketStatusBadge status={ticket.statusCode} />
          {/* Action buttons based on state */}
          {ticket.statusCode === 'in_progress' && (
            <Button variant="outline" size="sm">Resolve</Button>
          )}
          {ticket.statusCode === 'resolved' && (
            <Button variant="outline" size="sm">Close</Button>
          )}
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
