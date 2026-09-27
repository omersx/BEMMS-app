"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CheckCircle2, Clock, Circle, XCircle, PenSquare } from "lucide-react"

export interface SignatureRequirement {
  purpose: string
  allowedRoles: string[]
  required: boolean
}

export interface CompletedSignature {
  id: string
  purpose: string
  signerName: string
  signerRole: string
  signedAt: Date | string
  status: string
  contentHash: string
}

export interface SignatureStatusPanelProps {
  required: SignatureRequirement[]
  completed: CompletedSignature[]
  pending: SignatureRequirement[]
  canSign: { purpose: string; allowed: boolean; reason?: string }[]
  onSignClick?: (purpose: string) => void
  className?: string
}

const formatPurpose = (purpose: string) => {
  const map: Record<string, string> = {
    perform: "Performer Signature",
    review: "Reviewer Signature",
    release: "Release Authority",
    approve: "Approval",
    reject: "Rejection",
  }
  if (map[purpose]) return map[purpose]
  return purpose.charAt(0).toUpperCase() + purpose.slice(1)
}

const formatTime = (date: Date | string) => {
  const d = new Date(date)
  return d.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

export function SignatureStatusPanel({
  required,
  completed,
  pending,
  canSign,
  onSignClick,
  className,
}: SignatureStatusPanelProps) {
  // Combine into an ordered list of steps based on the requirements
  const steps = required.map((req) => {
    const comp = completed.find((c) => c.purpose === req.purpose)
    const isPending = pending.some((p) => p.purpose === req.purpose)
    const signAuth = canSign.find((c) => c.purpose === req.purpose)
    
    return {
      requirement: req,
      completed: comp,
      isPending,
      signAuth,
    }
  })

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-muted/40 pb-3 pt-4 px-4 border-b">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          Signature Status
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col divide-y">
          {steps.map((step, idx) => {
            const purposeLabel = formatPurpose(step.requirement.purpose)
            
            if (step.completed) {
              const isRejected = step.completed.status === 'rejected'
              return (
                <div key={idx} className="flex items-start gap-3 p-4 bg-card">
                  {isRejected ? (
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {purposeLabel}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {step.completed.signerName}, {step.completed.signerRole} • {formatTime(step.completed.signedAt)}
                    </p>
                  </div>
                </div>
              )
            }
            
            if (step.isPending) {
              return (
                <div key={idx} className="flex items-start gap-3 p-4 bg-muted/20">
                  <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {purposeLabel}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.signAuth?.allowed 
                          ? "Awaiting your signature" 
                          : step.signAuth?.reason || "Awaiting review"}
                      </p>
                    </div>
                    {step.signAuth?.allowed && onSignClick && (
                      <Button 
                        size="sm" 
                        onClick={() => onSignClick(step.requirement.purpose)}
                        className="shrink-0 h-8 gap-1.5"
                      >
                        <PenSquare className="h-3.5 w-3.5" />
                        Sign
                      </Button>
                    )}
                  </div>
                </div>
              )
            }
            
            // Not yet required
            return (
              <div key={idx} className="flex items-start gap-3 p-4 opacity-60">
                <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {purposeLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Not yet required (waiting for previous steps)
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
