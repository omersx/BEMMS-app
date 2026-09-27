"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  acceptTicket,
  resolveTicket,
  closeTicket,
  holdTicketForParts,
  resumeTicketWork,
  reopenTicket,
  updateTicketDeviceStatus,
} from "@/lib/actions/tickets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  PlayCircle,
  Lock,
  Package,
  Wrench,
  RotateCcw,
  AlertTriangle,
} from "lucide-react"

interface TicketActionButtonsProps {
  ticketId: string
  statusCode: string
  hasDevice: boolean
  ticketNumber?: string
  currentDeviceStatus?: string
}

export function TicketActionButtons({
  ticketId,
  statusCode,
  hasDevice,
  ticketNumber,
  currentDeviceStatus,
}: TicketActionButtonsProps) {
  const canAccept = ["new", "acknowledged", "in_triage", "waiting_requester"].includes(statusCode)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {canAccept && (
        <AcceptDialog ticketId={ticketId} ticketNumber={ticketNumber} />
      )}
      {statusCode === "in_progress" && (
        <>
          {hasDevice && (
            <UpdateDeviceStatusDialog
              ticketId={ticketId}
              ticketNumber={ticketNumber}
              currentDeviceStatus={currentDeviceStatus}
            />
          )}
          <ResolveDialog ticketId={ticketId} hasDevice={hasDevice} ticketNumber={ticketNumber} />
        </>
      )}
      {statusCode === "waiting_parts_vendor" && (
        <>
          <ResumeWorkButton ticketId={ticketId} />
          {hasDevice && (
            <UpdateDeviceStatusDialog
              ticketId={ticketId}
              ticketNumber={ticketNumber}
              currentDeviceStatus={currentDeviceStatus}
            />
          )}
          <ResolveDialog ticketId={ticketId} hasDevice={hasDevice} ticketNumber={ticketNumber} />
        </>
      )}
      {statusCode === "resolved" && (
        <>
          <CloseDialog ticketId={ticketId} ticketNumber={ticketNumber} />
          <ReopenDialog ticketId={ticketId} ticketNumber={ticketNumber} />
        </>
      )}
      {["closed", "cancelled"].includes(statusCode) && (
        <ReopenDialog ticketId={ticketId} ticketNumber={ticketNumber} />
      )}
    </div>
  )
}

// ── Accept Dialog (with Electronic Signature) ───────────────────────────────────

function AcceptDialog({ ticketId, ticketNumber }: { ticketId: string; ticketNumber?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [comments, setComments] = useState("")

  const handleAccept = async () => {
    if (!password) {
      toast.error("Password is required for electronic signature authentication")
      return
    }

    setLoading(true)
    const result = await acceptTicket(ticketId, {
      signaturePassword: password,
      signatureComments: comments.trim() || undefined,
    })

    if (result?.success) {
      toast.success("Ticket accepted and electronically signed (21 CFR Part 11)")
      setOpen(false)
      setPassword("")
      setComments("")
      router.refresh()
    } else {
      toast.error((result as any)?.error || "Failed to accept ticket")
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
          <ShieldCheck className="w-4 h-4" />
          Accept &amp; Sign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <DialogTitle>Accept Ticket Responsibility</DialogTitle>
          </div>
          <DialogDescription>
            {ticketNumber ? `Ticket ${ticketNumber}` : "Service Ticket"} — Electronically sign to accept and begin work.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Legal Attestation Statement */}
          <div className="rounded-md bg-indigo-50/50 dark:bg-indigo-950/30 p-3 border border-indigo-200/60 text-xs text-indigo-950 dark:text-indigo-200">
            <span className="font-semibold block mb-1">Attestation Statement (21 CFR Part 11):</span>
            <p className="italic text-muted-foreground">
              &quot;I accept responsibility for the assigned work and confirm I will perform it in accordance with applicable biomedical engineering procedures.&quot;
            </p>
          </div>

          <div>
            <Label htmlFor="acceptPassword" className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              Electronic Signature Password *
            </Label>
            <Input
              id="acceptPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your account password to sign..."
              className="mt-1.5"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Re-authentication creates a permanent cryptographic record in the audit chain.
            </p>
          </div>

          <div>
            <Label htmlFor="acceptComments">Comments / Initial Notes (optional)</Label>
            <Input
              id="acceptComments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. Arrived on-site, starting physical inspection..."
              className="mt-1.5 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={loading || !password}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            {loading ? "Signing..." : "Sign & Accept Work"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Resolve Dialog (with Electronic Signature) ──────────────────────────────────

function ResolveDialog({ ticketId, hasDevice, ticketNumber }: { ticketId: string; hasDevice: boolean; ticketNumber?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState("")
  const [deviceStatus, setDeviceStatus] = useState("operational")
  const [limitationsNote, setLimitationsNote] = useState("")
  const [password, setPassword] = useState("")
  const [comments, setComments] = useState("")

  const handleResolve = async () => {
    if (summary.trim().length < 10) {
      toast.error("Resolution summary must be at least 10 characters")
      return
    }

    if (!password) {
      toast.error("Password is required for electronic signature authentication")
      return
    }

    setLoading(true)
    const result = await resolveTicket(ticketId, {
      resolutionSummary: summary.trim(),
      finalDeviceStatusCode: deviceStatus,
      limitationsNote: deviceStatus === "operational_with_limitations" ? limitationsNote.trim() || undefined : undefined,
      signaturePassword: password,
      signatureComments: comments.trim() || undefined,
    })

    if (result?.success) {
      toast.success("Ticket resolved & signed with cryptographic SHA-256 hash")
      setOpen(false)
      setSummary("")
      setLimitationsNote("")
      setPassword("")
      setComments("")
      router.refresh()
    } else {
      toast.error((result as any)?.error || "Failed to resolve ticket")
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          Resolve &amp; Sign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <DialogTitle>Resolve Ticket with Electronic Signature</DialogTitle>
          </div>
          <DialogDescription>
            {ticketNumber ? `Ticket ${ticketNumber}` : "Service Ticket"} — Document the fix and cryptographically sign off.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Resolution Description */}
          <div>
            <Label htmlFor="resolutionSummary">Resolution Summary *</Label>
            <Textarea
              id="resolutionSummary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe the fix: what was found, what was done, and the test result..."
              rows={3}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum 10 characters. This will be visible to the reporter and in compliance reports.
            </p>
          </div>

          {/* Final Device Status */}
          {hasDevice && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="finalDeviceStatus">Device Status After Fix</Label>
                <select
                  id="finalDeviceStatus"
                  value={deviceStatus}
                  onChange={(e) => setDeviceStatus(e.target.value)}
                  className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="operational">✅ Operational (Safe for Clinical Use)</option>
                  <option value="operational_with_limitations">⚠️ Operational with Limitations</option>
                  <option value="awaiting_release">⏳ Awaiting Release (QA Verification)</option>
                  <option value="standby">💤 Standby (Reserve Equipment)</option>
                  <option value="out_of_service">🚫 Out of Service (Unrepairable / Condemned)</option>
                  <option value="decommissioned">🗑️ Decommissioned (Permanently Retired)</option>
                </select>
              </div>

              {/* Limitations Note — shown only when operational_with_limitations */}
              {deviceStatus === "operational_with_limitations" && (
                <div className="rounded-md bg-amber-50/70 dark:bg-amber-950/40 p-3 border border-amber-200/80 dark:border-amber-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Operating Limitations Notice</span>
                  </div>
                  <Textarea
                    value={limitationsNote}
                    onChange={(e) => setLimitationsNote(e.target.value)}
                    placeholder="Describe what functions or modes are limited and any clinical usage restrictions..."
                    rows={2}
                    className="text-sm bg-white dark:bg-zinc-900"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    This note will be displayed on the device profile and department dashboard so clinical staff know the equipment&apos;s constraints.
                  </p>
                </div>
              )}

              {/* Out of Service / Decommissioned Warning */}
              {(deviceStatus === "out_of_service" || deviceStatus === "decommissioned") && (
                <div className="rounded bg-rose-50 dark:bg-rose-950/40 p-2.5 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-rose-600" />
                  <strong>Notice:</strong>{" "}
                  {deviceStatus === "decommissioned"
                    ? "Selecting Decommissioned permanently retires this device. It will be removed from active inventory."
                    : "Selecting Out of Service resolves this ticket by declaring the equipment unrepairable. The device will remain non-clinical."}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Tip: If the equipment is still under repair, close this dialog and use <strong>Update Status</strong> instead.
              </p>
            </div>
          )}

          {/* Legal Attestation Statement */}
          <div className="rounded-md bg-emerald-50/50 dark:bg-emerald-950/30 p-3 border border-emerald-200/60 text-xs text-emerald-950 dark:text-emerald-200">
            <span className="font-semibold block mb-1">Attestation Statement (21 CFR Part 11):</span>
            <p className="italic text-muted-foreground">
              &quot;I confirm that the issue has been resolved and the resolution summary accurately describes the work performed.&quot;
            </p>
          </div>

          {/* Signature Re-Authentication Password */}
          <div>
            <Label htmlFor="resolvePassword" className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              Electronic Signature Password *
            </Label>
            <Input
              id="resolvePassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your account password to sign..."
              className="mt-1.5"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Generates a tamper-evident SHA-256 hash locked in the hospital regulatory audit chain.
            </p>
          </div>

          {/* Optional Comments */}
          <div>
            <Label htmlFor="resolveComments">Comments / Sign-Off Note (optional)</Label>
            <Input
              id="resolveComments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. Device passed safety check, handed back to ward sister..."
              className="mt-1.5 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleResolve}
            disabled={loading || summary.trim().length < 10 || !password}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            {loading ? "Signing..." : "Sign & Mark as Resolved"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Close Dialog (with Electronic Signature) ────────────────────────────────────

function CloseDialog({ ticketId, ticketNumber }: { ticketId: string; ticketNumber?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState("")
  const [password, setPassword] = useState("")
  const [comments, setComments] = useState("")

  const handleClose = async () => {
    if (!password) {
      toast.error("Password is required for electronic signature authentication")
      return
    }

    setLoading(true)
    const result = await closeTicket(ticketId, {
      closureReason: reason.trim() || undefined,
      signaturePassword: password,
      signatureComments: comments.trim() || undefined,
    })

    if (result?.success) {
      toast.success("Ticket closed & signed with cryptographic SHA-256 hash")
      setOpen(false)
      setReason("")
      setPassword("")
      setComments("")
      router.refresh()
    } else {
      toast.error((result as any)?.error || "Failed to close ticket")
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <XCircle className="w-4 h-4" />
          Close &amp; Sign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-muted-foreground" />
            <DialogTitle>Close Ticket with Electronic Signature</DialogTitle>
          </div>
          <DialogDescription>
            {ticketNumber ? `Ticket ${ticketNumber}` : "Service Ticket"} — Permanent closure sign-off confirming resolution is verified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Legal Attestation Statement */}
          <div className="rounded-md bg-muted/50 p-3 border text-xs">
            <span className="font-semibold block mb-1">Attestation Statement (21 CFR Part 11):</span>
            <p className="italic text-muted-foreground">
              &quot;I confirm that the ticket resolution is sufficiently documented and complete under the applicable policy.&quot;
            </p>
          </div>

          <div>
            <Label htmlFor="closureReason">Closure Reason / Final Verification Note</Label>
            <Textarea
              id="closureReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Ward confirmed device operational and functioning in clinical use..."
              rows={2}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="closePassword" className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              Electronic Signature Password *
            </Label>
            <Input
              id="closePassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your account password to sign..."
              className="mt-1.5"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleClose}
            disabled={loading || !password}
            className="gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            {loading ? "Signing..." : "Sign & Close Ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Wait for Parts Dialog ───────────────────────────────────────────────────────

function WaitForPartsDialog({ ticketId, ticketNumber }: { ticketId: string; ticketNumber?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState("")
  const [partDescription, setPartDescription] = useState("")

  const handleHold = async () => {
    if (!reason.trim()) {
      toast.error("Please specify what parts or vendor dependency is needed")
      return
    }

    setLoading(true)
    const result = await holdTicketForParts(ticketId, {
      waitingReason: reason.trim(),
      partDescription: partDescription.trim() || undefined,
    })

    if (result?.success) {
      toast.success("Ticket put on hold: Waiting for spare parts")
      setOpen(false)
      setReason("")
      setPartDescription("")
      router.refresh()
    } else {
      toast.error((result as any)?.error || "Failed to update ticket")
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/40">
          <Package className="w-4 h-4 text-amber-600" />
          Wait for Parts
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            <DialogTitle>Hold Ticket for Spare Parts</DialogTitle>
          </div>
          <DialogDescription>
            {ticketNumber ? `Ticket ${ticketNumber}` : "Service Ticket"} — Pause repair work until replacement parts or vendor service arrive.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="partReason">Parts Needed / Dependency *</Label>
            <Input
              id="partReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Display cable, power supply board, valve kit..."
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="partDetails">Supplier / Order Details (optional)</Label>
            <Textarea
              id="partDetails"
              value={partDescription}
              onChange={(e) => setPartDescription(e.target.value)}
              placeholder="e.g. Mindray PO# 49201, expected delivery in 3 days..."
              rows={2}
              className="mt-1.5"
            />
          </div>

          <div className="rounded-md bg-amber-50/60 dark:bg-amber-950/30 p-3 border border-amber-200 text-xs text-amber-900 dark:text-amber-200">
            <p className="font-medium">Device Status Change:</p>
            <p className="text-muted-foreground mt-0.5">
              The linked medical device will be automatically marked as <strong>📦 Waiting for Spare Parts</strong> in department dashboards.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleHold}
            disabled={loading || !reason.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
          >
            <Package className="w-4 h-4" />
            {loading ? "Updating..." : "Place on Hold"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Resume Work Button ─────────────────────────────────────────────────────────

export function ResumeWorkButton({ ticketId }: { ticketId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleResume = async () => {
    setLoading(true)
    const result = await resumeTicketWork(ticketId)
    if (result?.success) {
      toast.success("Spare parts received! Ticket resumed to In Progress")
      router.refresh()
    } else {
      toast.error((result as any)?.error || "Failed to resume ticket")
    }
    setLoading(false)
  }

  return (
    <Button
      size="sm"
      onClick={handleResume}
      disabled={loading}
      className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm"
    >
      <PlayCircle className="w-4 h-4" />
      {loading ? "Resuming..." : "Parts Received (Resume)"}
    </Button>
  )
}

// ── Update Device Status Dialog (Interim Progress) ───────────────────────────

function UpdateDeviceStatusDialog({
  ticketId,
  ticketNumber,
  currentDeviceStatus = "under_repair",
}: {
  ticketId: string
  ticketNumber?: string
  currentDeviceStatus?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deviceStatus, setDeviceStatus] = useState(currentDeviceStatus || "under_repair")
  const [notes, setNotes] = useState("")
  const [partName, setPartName] = useState("")
  const [supplierDetails, setSupplierDetails] = useState("")
  const [limitationsNote, setLimitationsNote] = useState("")

  const isWaiting = deviceStatus === "waiting_for_parts"

  const handleUpdate = async () => {
    if (isWaiting && partName.trim().length < 3) {
      toast.error("Please enter the required spare part name (minimum 3 characters)")
      return
    }

    if (!isWaiting && notes.trim().length < 3) {
      toast.error("Please enter a progress note (minimum 3 characters)")
      return
    }

    setLoading(true)
    const isLimited = deviceStatus === "operational_with_limitations"
    const result = await updateTicketDeviceStatus(ticketId, {
      deviceStatusCode: deviceStatus,
      notes: isWaiting ? (notes.trim() || `Waiting for ${partName.trim()}`) : notes.trim(),
      partName: isWaiting ? partName.trim() : undefined,
      supplierDetails: isWaiting && supplierDetails.trim() ? supplierDetails.trim() : undefined,
      limitationsNote: isLimited ? limitationsNote.trim() || undefined : undefined,
    })

    if (result?.success) {
      if (isWaiting) {
        toast.success("Equipment placed on hold: waiting for spare parts")
      } else {
        toast.success("Device status updated and progress recorded to ticket")
      }
      setOpen(false)
      setNotes("")
      setPartName("")
      setSupplierDetails("")
      setLimitationsNote("")
      router.refresh()
    } else {
      toast.error((result as any)?.error || "Failed to update device status")
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
          <Wrench className="w-4 h-4 text-slate-500" />
          Update Status
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <DialogTitle>Update Equipment Status &amp; Progress</DialogTitle>
          </div>
          <DialogDescription>
            {ticketNumber ? `Ticket ${ticketNumber}` : "Service Ticket"} — Update equipment status while keeping ticket in progress.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="activeDeviceStatus">Current Equipment Status</Label>
            <select
              id="activeDeviceStatus"
              value={deviceStatus}
              onChange={(e) => setDeviceStatus(e.target.value)}
              className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="under_repair">🛠️ Under Repair (Active Work)</option>
              <option value="waiting_for_parts">📦 Waiting for Spare Parts / Vendor</option>
              <option value="under_maintenance">🔧 Under Maintenance (Routine Service)</option>
              <option value="operational_with_limitations">⚠️ Operational with Limitations (Partial Function)</option>
              <option value="out_of_service">🚫 Out of Service (Unsafe / Quarantined)</option>
              <option value="standby">💤 Standby (Temporarily Idle)</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Reflects real-time equipment availability to hospital clinical staff.
            </p>
          </div>

          {isWaiting ? (
            <div className="space-y-3 pt-1">
              <div className="rounded-md bg-amber-50/70 dark:bg-amber-950/40 p-3 border border-amber-200 text-xs text-amber-950 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
                  <Package className="w-4 h-4 text-amber-600" />
                  <span>Spare Parts Hold Workflow</span>
                </div>
                <p className="text-muted-foreground">
                  The ticket will be placed on hold and equipment marked <strong>Waiting for Spare Parts</strong>. A dedicated tracking card will appear on the ticket.
                </p>
              </div>

              <div>
                <Label htmlFor="partName">Required Spare Part / Component *</Label>
                <Input
                  id="partName"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  placeholder="e.g. Power supply board, ECG trunk cable, O2 sensor..."
                  className="mt-1.5 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="supplierDetails">Supplier / Order Tracking Details (optional)</Label>
                <Input
                  id="supplierDetails"
                  value={supplierDetails}
                  onChange={(e) => setSupplierDetails(e.target.value)}
                  placeholder="e.g. Mindray PO# 49201, expected delivery in 3 days..."
                  className="mt-1.5 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="progressNote">Additional Work Notes (optional)</Label>
                <Textarea
                  id="progressNote"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Unit quarantined on bench; removed faulty component."
                  rows={2}
                  className="mt-1.5 text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Operational with Limitations — contextual card */}
              {deviceStatus === "operational_with_limitations" && (
                <div className="rounded-md bg-amber-50/70 dark:bg-amber-950/40 p-3 border border-amber-200/80 dark:border-amber-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Operating Limitations Notice</span>
                  </div>
                  <Textarea
                    value={limitationsNote}
                    onChange={(e) => setLimitationsNote(e.target.value)}
                    placeholder="Describe what functions or modes are limited and any clinical usage restrictions..."
                    rows={2}
                    className="text-sm bg-white dark:bg-zinc-900"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    This note will be shown on the device profile so clinical staff understand equipment constraints.
                  </p>
                </div>
              )}

              {/* Out of Service — contextual warning */}
              {deviceStatus === "out_of_service" && (
                <div className="rounded bg-rose-50 dark:bg-rose-950/40 p-2.5 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-rose-600" />
                  <strong>Warning:</strong> This marks the device as unsafe / quarantined. Clinical staff will be informed that this equipment is unavailable. Use <strong>Resolve &amp; Sign</strong> if repair is complete.
                </div>
              )}

              <div>
                <Label htmlFor="progressNote">Progress Note / Diagnostic Findings *</Label>
                <Textarea
                  id="progressNote"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Unit disassembled on bench; power supply capacitor failed. Ordered replacement component..."
                  rows={3}
                  className="mt-1.5 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recorded in the ticket timeline and device audit history without closing or resolving this ticket.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={loading || (isWaiting ? partName.trim().length < 3 : notes.trim().length < 3)}
            className={`gap-1.5 ${isWaiting ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
          >
            {isWaiting ? <Package className="w-4 h-4" /> : null}
            {loading ? "Saving..." : isWaiting ? "Place on Hold (Waiting for Parts)" : "Save Status & Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Reopen / Resume Work Dialog ────────────────────────────────────────────────

function ReopenDialog({ ticketId, ticketNumber }: { ticketId: string; ticketNumber?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState("")

  const handleReopen = async () => {
    if (reason.trim().length < 5) {
      toast.error("Please provide a reason (minimum 5 characters)")
      return
    }

    setLoading(true)
    const result = await reopenTicket(ticketId, {
      reopenReason: reason.trim(),
    })

    if (result?.success) {
      toast.success("Ticket reopened — repair work resumed and device marked Under Repair")
      setOpen(false)
      setReason("")
      router.refresh()
    } else {
      toast.error((result as any)?.error || "Failed to reopen ticket")
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-amber-500/40 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30">
          <RotateCcw className="w-4 h-4 text-amber-600" />
          Reopen / Resume Work
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-amber-600" />
            <DialogTitle>Reopen Ticket &amp; Resume Work</DialogTitle>
          </div>
          <DialogDescription>
            {ticketNumber ? `Ticket ${ticketNumber}` : "Service Ticket"} — Return ticket to active work and mark device Under Repair.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md bg-amber-50/70 dark:bg-amber-950/40 p-3 border border-amber-200/80 text-xs text-amber-950 dark:text-amber-200">
            <p>
              Reopening clears previous resolution details and moves the ticket back to <strong>In Progress</strong>. The device will be marked <strong>Under Repair</strong>.
            </p>
          </div>

          <div>
            <Label htmlFor="reopenReason">Reason for Reopening *</Label>
            <Textarea
              id="reopenReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Issue recurred during clinical check, or repair incomplete..."
              rows={3}
              className="mt-1.5 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleReopen}
            disabled={loading || reason.trim().length < 5}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            {loading ? "Reopening..." : "Resume Work"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

