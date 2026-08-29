"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  startMaintenanceTask,
  markTaskWaiting,
  completeTaskWork,
  cancelMaintenanceTask,
} from "@/lib/actions/maintenance-tasks"
import {
  reviewMaintenanceRecord,
  releaseDeviceMaintenance,
  signMaintenanceRecord,
} from "@/lib/actions/signatures"
import {
  Play,
  Pause,
  CheckCheck,
  FileSignature,
  Eye,
  Sparkles,
  RotateCcw,
  Ban,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Wrench,
} from "lucide-react"

interface TaskActionBarProps {
  taskId: string
  taskNumber: string
  statusCode: string
  deviceId: string
  resultRecordId?: string | null
  currentUserId?: string
}

export function TaskActionBar({
  taskId,
  taskNumber,
  statusCode,
  deviceId,
  resultRecordId,
  currentUserId,
}: TaskActionBarProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Dialog States
  const [waitingDialogOpen, setWaitingDialogOpen] = useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [signDialogOpen, setSignDialogOpen] = useState(false)

  // Form States - Mark Waiting
  const [waitingDependencyType, setWaitingDependencyType] = useState<
    "parts" | "requester" | "vendor" | "department_access"
  >("parts")
  const [waitingReason, setWaitingReason] = useState("")

  // Form States - Complete Work
  const [diagnosis, setDiagnosis] = useState("")
  const [rootCause, setRootCause] = useState("")
  const [workPerformed, setWorkPerformed] = useState("")
  const [findings, setFindings] = useState("")
  const [recommendations, setRecommendations] = useState("")
  const [finalResultCode, setFinalResultCode] = useState<string>("passed")
  const [finalDeviceStatusCode, setFinalDeviceStatusCode] = useState<string>("awaiting_release")

  // Form States - Review Work
  const [reviewDecision, setReviewDecision] = useState<"approve" | "reject">("approve")
  const [reviewNotes, setReviewNotes] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [reviewPassword, setReviewPassword] = useState("")

  // Form States - Release Device
  const [releaseStatus, setReleaseStatus] = useState<"operational" | "operational_with_limitations">(
    "operational"
  )
  const [releaseNotes, setReleaseNotes] = useState("")
  const [releasePassword, setReleasePassword] = useState("")

  // Form States - Sign & Submit
  const [signPassword, setSignPassword] = useState("")
  const [signComments, setSignComments] = useState("")

  // Form States - Cancel Task
  const [cancellationReason, setCancellationReason] = useState("")

  // Handlers
  const handleStartWork = () => {
    setError(null)
    startTransition(async () => {
      const res = await startMaintenanceTask(taskId)
      if (res?.success) {
        router.refresh()
      } else {
        setError(res?.error || "Failed to start maintenance work")
      }
    })
  }

  const handleMarkWaiting = (e: React.FormEvent) => {
    e.preventDefault()
    if (!waitingReason.trim() || waitingReason.trim().length < 5) {
      setError("Waiting reason must be at least 5 characters")
      return
    }

    setError(null)
    startTransition(async () => {
      const res = await markTaskWaiting(taskId, {
        waitingDependencyType,
        waitingReason: waitingReason.trim(),
      })
      if (res?.success) {
        setWaitingDialogOpen(false)
        setWaitingReason("")
        router.refresh()
      } else {
        setError(res?.error || "Failed to update task to waiting state")
      }
    })
  }

  const handleCompleteWork = (e: React.FormEvent) => {
    e.preventDefault()
    if (!workPerformed.trim() || workPerformed.trim().length < 10) {
      setError("Work performed description must be at least 10 characters")
      return
    }

    setError(null)
    startTransition(async () => {
      const res = await completeTaskWork(taskId, {
        diagnosis: diagnosis.trim() || undefined,
        rootCause: rootCause.trim() || undefined,
        workPerformed: workPerformed.trim(),
        findings: findings.trim() || undefined,
        recommendations: recommendations.trim() || undefined,
        finalResultCode: finalResultCode as any,
        finalDeviceStatusCode: finalDeviceStatusCode as any,
      })
      if (res?.success) {
        setCompleteDialogOpen(false)
        router.refresh()
      } else {
        setError(res?.error || "Failed to record completed work")
      }
    })
  }

  const handleSignAndSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!signPassword) {
      setError("Password is required for electronic signature authentication")
      return
    }

    setError(null)
    startTransition(async () => {
      const res = await signMaintenanceRecord(
        taskId,
        {
          diagnosis: diagnosis.trim() || undefined,
          rootCause: rootCause.trim() || undefined,
          workPerformed: workPerformed.trim() || "Maintenance work completed per checklist and standard procedure.",
          findings: findings.trim() || undefined,
          recommendations: recommendations.trim() || undefined,
          finalResultCode: finalResultCode || "passed",
          finalDeviceStatusCode: finalDeviceStatusCode || "awaiting_release",
        },
        {
          signaturePurpose: "perform",
          authMethod: "password_reauth",
          password: signPassword,
          comments: signComments.trim() || undefined,
        }
      )

      if (res?.success) {
        setSignDialogOpen(false)
        setSignPassword("")
        setSignComments("")
        router.refresh()
      } else {
        setError(res?.error || "Failed to electronically sign and submit record")
      }
    })
  }

  const handleReviewWork = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewPassword) {
      setError("Password is required for electronic review signature")
      return
    }
    if (reviewDecision === "reject" && (!rejectionReason.trim() || rejectionReason.trim().length < 5)) {
      setError("Please provide a reason for rejecting the maintenance work (min 5 characters)")
      return
    }

    setError(null)
    startTransition(async () => {
      const res = await reviewMaintenanceRecord(taskId, {
        decision: reviewDecision,
        reviewNotes: reviewNotes.trim() || undefined,
        rejectionReason: rejectionReason.trim() || undefined,
        password: reviewPassword,
      })
      if (res?.success) {
        setReviewDialogOpen(false)
        setReviewPassword("")
        setReviewNotes("")
        setRejectionReason("")
        router.refresh()
      } else {
        setError(res?.error || "Failed to submit technical review")
      }
    })
  }

  const handleReleaseDevice = (e: React.FormEvent) => {
    e.preventDefault()
    if (!releasePassword) {
      setError("Password is required for release authorization signature")
      return
    }

    setError(null)
    startTransition(async () => {
      const res = await releaseDeviceMaintenance(taskId, {
        finalDeviceStatusCode: releaseStatus,
        releaseNotes: releaseNotes.trim() || undefined,
        password: releasePassword,
      })
      if (res?.success) {
        setReleaseDialogOpen(false)
        setReleasePassword("")
        setReleaseNotes("")
        router.refresh()
      } else {
        setError(res?.error || "Failed to authorize device release")
      }
    })
  }

  const handleCancelTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cancellationReason.trim() || cancellationReason.trim().length < 10) {
      setError("Cancellation reason must be at least 10 characters")
      return
    }

    setError(null)
    startTransition(async () => {
      const res = await cancelMaintenanceTask(taskId, {
        cancellationReason: cancellationReason.trim(),
      })
      if (res?.success) {
        setCancelDialogOpen(false)
        setCancellationReason("")
        router.refresh()
      } else {
        setError(res?.error || "Failed to cancel task")
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto h-6 text-xs text-destructive hover:bg-transparent"
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {/* State: ASSIGNED -> Start Work */}
        {statusCode === "assigned" && (
          <Button
            type="button"
            size="sm"
            onClick={handleStartWork}
            disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Start Work
          </Button>
        )}

        {/* State: IN_PROGRESS -> Mark Waiting & Complete Work */}
        {statusCode === "in_progress" && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null)
                setWaitingDialogOpen(true)
              }}
              disabled={isPending}
              className="gap-1.5 border-amber-300 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            >
              <Pause className="h-4 w-4" />
              Mark Waiting
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                setError(null)
                setCompleteDialogOpen(true)
              }}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
            >
              <CheckCheck className="h-4 w-4" />
              Complete Work
            </Button>
          </>
        )}

        {/* State: WAITING_DEPENDENCY -> Resume Work */}
        {statusCode === "waiting_dependency" && (
          <Button
            type="button"
            size="sm"
            onClick={handleStartWork}
            disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Resume Work
          </Button>
        )}

        {/* State: RETURNED_FOR_REWORK -> Resume Work */}
        {statusCode === "returned_for_rework" && (
          <>
            <Button
              type="button"
              size="sm"
              onClick={handleStartWork}
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
              Resume Work
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                setError(null)
                setCompleteDialogOpen(true)
              }}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
            >
              <CheckCheck className="h-4 w-4" />
              Re-Complete Work
            </Button>
          </>
        )}

        {/* State: WORK_COMPLETE -> Sign & Submit Link and Action */}
        {statusCode === "work_complete" && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setError(null)
                setSignDialogOpen(true)
              }}
              disabled={isPending}
              className="bg-cyan-700 hover:bg-cyan-800 text-white gap-1.5 shadow-sm"
            >
              <FileSignature className="h-4 w-4" />
              Sign & Submit
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/maintenance/tasks/${taskId}/sign`} className="gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Sign Page
              </Link>
            </Button>
          </div>
        )}

        {/* State: AWAITING_REVIEW -> Review Work */}
        {statusCode === "awaiting_review" && (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setError(null)
              setReviewDialogOpen(true)
            }}
            disabled={isPending}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-sm"
          >
            <Eye className="h-4 w-4" />
            Review Work
          </Button>
        )}

        {/* State: AWAITING_RELEASE -> Release Device */}
        {statusCode === "awaiting_release" && (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setError(null)
              setReleaseDialogOpen(true)
            }}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            Release Device
          </Button>
        )}

        {/* Optional Cancel Action for Active Stages */}
        {["draft", "assigned", "in_progress", "waiting_dependency"].includes(statusCode) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setError(null)
              setCancelDialogOpen(true)
            }}
            disabled={isPending}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
          >
            <Ban className="h-3.5 w-3.5 mr-1" />
            Cancel Task
          </Button>
        )}
      </div>

      {/* ── 1. Dialog: Mark Waiting ───────────────────────────────────────── */}
      <Dialog open={waitingDialogOpen} onOpenChange={setWaitingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pause Task — Waiting on Dependency</DialogTitle>
            <DialogDescription>
              Specify the dependency type and detailed justification for pausing maintenance work.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleMarkWaiting} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="dependency-type">Dependency Category</Label>
              <Select
                value={waitingDependencyType}
                onValueChange={(val: any) => setWaitingDependencyType(val)}
              >
                <SelectTrigger id="dependency-type">
                  <SelectValue placeholder="Select dependency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parts">Waiting for Spare Parts</SelectItem>
                  <SelectItem value="vendor">Waiting for External Vendor Service</SelectItem>
                  <SelectItem value="requester">Waiting for Clinical Department / Requester</SelectItem>
                  <SelectItem value="department_access">Waiting for Physical / Room Access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="waiting-reason">Reason & Details</Label>
              <Textarea
                id="waiting-reason"
                placeholder="e.g. Awaiting delivery of power supply unit PN-4402 from OEM supplier."
                value={waitingReason}
                onChange={(e) => setWaitingReason(e.target.value)}
                rows={3}
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setWaitingDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-amber-600 hover:bg-amber-700 text-white">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Confirm Pause
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 2. Dialog: Complete Work ───────────────────────────────────────── */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Maintenance Work</DialogTitle>
            <DialogDescription>
              Record the technical execution details, diagnosis findings, and initial result evaluation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCompleteWork} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="work-performed">
                Work Performed <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="work-performed"
                placeholder="Describe all maintenance, calibration, tests, and repairs executed..."
                value={workPerformed}
                onChange={(e) => setWorkPerformed(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="diagnosis">Diagnosis / Initial Condition</Label>
                <Input
                  id="diagnosis"
                  placeholder="Root technical assessment"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="root-cause">Root Cause</Label>
                <Input
                  id="root-cause"
                  placeholder="e.g. Component wear, electrical surge"
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="final-result-code">Final Test Result</Label>
                <Select value={finalResultCode} onValueChange={setFinalResultCode}>
                  <SelectTrigger id="final-result-code">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="passed_with_limitations">Passed with Limitations</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="no_fault_found">No Fault Found</SelectItem>
                    <SelectItem value="decommission_recommended">Decommission Recommended</SelectItem>
                    <SelectItem value="requires_external_service">Requires External Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="device-status-code">Proposed Device Status</Label>
                <Select value={finalDeviceStatusCode} onValueChange={setFinalDeviceStatusCode}>
                  <SelectTrigger id="device-status-code">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="awaiting_release">Awaiting Release</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="operational_with_limitations">Limited Use</SelectItem>
                    <SelectItem value="under_repair">Under Repair</SelectItem>
                    <SelectItem value="out_of_service">Out of Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="findings">Key Findings & Observations</Label>
              <Input
                id="findings"
                placeholder="Observed test parameters, physical checks"
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recommendations">Recommendations for Next Service</Label>
              <Input
                id="recommendations"
                placeholder="Preventive maintenance advice, parts to monitor"
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCompleteDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Save & Complete Work
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 3. Dialog: Quick Sign & Submit ─────────────────────────────────── */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Sign & Submit Maintenance Record
            </DialogTitle>
            <DialogDescription>
              Electronically attest that the recorded maintenance work is accurate and complete under 21 CFR Part 11 compliance.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSignAndSubmit} className="space-y-4 pt-2">
            <blockquote className="rounded-md border-l-2 border-primary/50 bg-muted/40 p-3 text-xs italic text-foreground/90">
              "I confirm that I performed the recorded maintenance/inspection and the details entered are accurate."
            </blockquote>

            <div className="space-y-1.5">
              <Label htmlFor="sign-comments">Signer Comments (Optional)</Label>
              <Textarea
                id="sign-comments"
                placeholder="Additional notes or context for the technical reviewer..."
                value={signComments}
                onChange={(e) => setSignComments(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sign-password">
                Re-Authenticate Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sign-password"
                type="password"
                placeholder="Enter your account password"
                value={signPassword}
                onChange={(e) => setSignPassword(e.target.value)}
                required
                autoFocus
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSignDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-cyan-700 hover:bg-cyan-800 text-white">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <FileSignature className="h-4 w-4 mr-1.5" />}
                Sign Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 4. Dialog: Technical Review ────────────────────────────────────── */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              Technical Peer Review
            </DialogTitle>
            <DialogDescription>
              Review checklist findings, test measurements, and parts used to approve or return for rework.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReviewWork} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="review-decision">Review Decision</Label>
              <Select
                value={reviewDecision}
                onValueChange={(val: any) => setReviewDecision(val)}
              >
                <SelectTrigger id="review-decision">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve Work (Proceed to Release)</SelectItem>
                  <SelectItem value="reject">Reject & Return for Rework</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reviewDecision === "approve" ? (
              <>
                <blockquote className="rounded-md border-l-2 border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 p-3 text-xs italic text-foreground/90">
                  "I have reviewed the findings, checklist, test results, and parts used, and verify technical completeness."
                </blockquote>
                <div className="space-y-1.5">
                  <Label htmlFor="review-notes">Review Notes (Optional)</Label>
                  <Textarea
                    id="review-notes"
                    placeholder="Comments regarding technical verification..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="rejection-reason">
                  Rework Justification <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Explain why this work was rejected and what specific corrections are needed..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="review-password">
                Re-Authenticate Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="review-password"
                type="password"
                placeholder="Enter password to sign review"
                value={reviewPassword}
                onChange={(e) => setReviewPassword(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReviewDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className={
                  reviewDecision === "approve"
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-rose-600 hover:bg-rose-700 text-white"
                }
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                {reviewDecision === "approve" ? "Sign & Approve" : "Return for Rework"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 5. Dialog: Release Device ──────────────────────────────────────── */}
      <Dialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              Authorize Device Release
            </DialogTitle>
            <DialogDescription>
              Authorize return of this medical device to active clinical service and finalize maintenance records.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReleaseDevice} className="space-y-4 pt-2">
            <blockquote className="rounded-md border-l-2 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 text-xs italic text-foreground/90">
              "I authorize the release of this medical device for clinical use with the specified status."
            </blockquote>

            <div className="space-y-1.5">
              <Label htmlFor="release-status">Final Clinical Device Status</Label>
              <Select
                value={releaseStatus}
                onValueChange={(val: any) => setReleaseStatus(val)}
              >
                <SelectTrigger id="release-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational (Full Clinical Use)</SelectItem>
                  <SelectItem value="operational_with_limitations">Operational with Limitations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="release-notes">Release Notes / Clinical Guidance (Optional)</Label>
              <Textarea
                id="release-notes"
                placeholder="Guidance for clinical operators upon return..."
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="release-password">
                Re-Authenticate Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="release-password"
                type="password"
                placeholder="Enter password to authorize release"
                value={releasePassword}
                onChange={(e) => setReleasePassword(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReleaseDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Sign & Release Device
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 6. Dialog: Cancel Task ─────────────────────────────────────────── */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Ban className="h-5 w-5" />
              Cancel Maintenance Task
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this maintenance work order? This action is audited and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCancelTask} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="cancel-reason">
                Cancellation Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="cancel-reason"
                placeholder="Provide a detailed explanation for cancelling this task (min 10 characters)..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCancelDialogOpen(false)}
                disabled={isPending}
              >
                Keep Task
              </Button>
              <Button type="submit" disabled={isPending} variant="destructive">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Confirm Cancellation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TaskActionBar
