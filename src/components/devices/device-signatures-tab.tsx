"use client"

import { SignatureTimeline } from "@/components/maintenance/signature-card"
import { SignatureHistory } from "@/components/signatures/signature-history"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShieldCheck, FileCheck, Wrench, Lock, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"

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
          <SignatureTimeline signatures={signatures} />

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
