"use client"

import { SignatureTimeline } from "@/components/maintenance/signature-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck } from "lucide-react"

interface TicketSignaturesPanelProps {
  signatures: any[]
}

export function TicketSignaturesPanel({ signatures = [] }: TicketSignaturesPanelProps) {
  if (!signatures || signatures.length === 0) {
    return null
  }

  return (
    <Card className="border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-b from-indigo-50/20 to-transparent">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <CardTitle className="text-base font-semibold">
              Electronic Signatures ({signatures.length})
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200">
            21 CFR Part 11 Compliant
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <SignatureTimeline signatures={signatures} />
      </CardContent>
    </Card>
  )
}
