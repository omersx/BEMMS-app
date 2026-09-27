"use client"

import * as React from "react"
import { QrCodeDisplay } from "./qr-code-display"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, RefreshCw, QrCode } from "lucide-react"
import { generateNewQrLabel, recordQrPrint } from "@/lib/actions/qr"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export interface DeviceQrCardProps {
  device: {
    id: string;
    name: string;
    internalCode: string;
    assetNumber: string;
    hospital?: { name?: string } | null;
    department?: { name?: string } | null;
  };
  qrLabel: {
    id: string;
    opaqueReference: string;
    labelStatus: string;
    printCount?: number | null;
  } | null;
}

export function DeviceQrCard({ device, qrLabel }: DeviceQrCardProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = React.useState(false)

  // Construct absolute URL for the QR code target
  const [origin, setOrigin] = React.useState("")
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  const scanTargetUrl = qrLabel
    ? `${origin || ""}/scan/${qrLabel.opaqueReference}`
    : ""

  const handlePrint = async () => {
    if (qrLabel?.id) {
      await recordQrPrint(qrLabel.id)
    }
    window.print()
  }

  const handleRegenerate = async () => {
    if (!confirm("Are you sure you want to regenerate this QR label? The previous QR code will be revoked.")) {
      return
    }

    setIsGenerating(true)
    try {
      const res = await generateNewQrLabel(device.id, "User requested label replacement")
      if (res.success) {
        toast.success("New QR label generated successfully")
        router.refresh()
      } else {
        toast.error((res as any).error || "Failed to generate QR label")
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 print:grid-cols-1">
      {/* 1. Main QR Code & Actions Card */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Active QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-5">
          {qrLabel ? (
            <>
              <QrCodeDisplay
                value={scanTargetUrl || qrLabel.opaqueReference}
                size={220}
                assetNumber={device.assetNumber}
                deviceName={device.name}
              />

              <div className="flex flex-wrap gap-2 justify-center w-full pt-2 border-t">
                <Button variant="default" size="sm" onClick={handlePrint} className="gap-1.5">
                  <Printer className="w-4 h-4" /> Print Label
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="gap-1.5"
                >
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                  Regenerate
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1 text-center">
                <p>
                  Opaque Reference: <span className="font-mono font-medium text-foreground">{qrLabel.opaqueReference}</span>
                </p>
                <p>Status: <span className="capitalize font-medium text-emerald-600 dark:text-emerald-400">{qrLabel.labelStatus}</span></p>
                <p>Print Count: {qrLabel.printCount || 0}</p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No active QR label for this device.</p>
              <Button onClick={handleRegenerate} disabled={isGenerating}>
                <RefreshCw className="w-4 h-4 mr-2" /> Generate QR Label
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Physical Thermal Label Preview (50mm x 30mm format) */}
      <Card>
        <CardHeader className="print:hidden">
          <CardTitle className="text-base">Thermal Label Preview (50 × 30mm)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <div
            id="printable-qr-label"
            className="w-[280px] border-2 border-slate-900 rounded-lg p-3.5 bg-white text-slate-900 shadow-md flex flex-col justify-between aspect-[5/3]"
          >
            <div className="border-b pb-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                {device.hospital?.name || "Biomedical Engineering"}
              </p>
              <p className="text-sm font-bold truncate leading-tight mt-0.5">{device.name}</p>
            </div>

            <div className="flex items-center justify-between gap-2 my-1">
              <div className="space-y-0.5">
                <p className="text-[11px] font-mono font-bold tracking-tight">
                  {device.assetNumber}
                </p>
                <p className="text-[9px] text-slate-600 font-mono">
                  {device.internalCode}
                </p>
                <p className="text-[8px] text-slate-500 truncate max-w-[120px]">
                  {device.department?.name || "General"}
                </p>
              </div>

              {qrLabel ? (
                <div className="p-1 bg-white shrink-0">
                  <QrCodeDisplay
                    value={scanTargetUrl || qrLabel.opaqueReference}
                    size={64}
                    showDownloadOptions={false}
                  />
                </div>
              ) : (
                <div className="w-16 h-16 bg-slate-100 flex items-center justify-center rounded text-[10px] text-slate-400">
                  QR
                </div>
              )}
            </div>

            <div className="border-t pt-1 flex items-center justify-between text-[8px] text-slate-500">
              <span>Scan to view status or report</span>
              <span className="font-mono">{qrLabel?.opaqueReference.slice(0, 8)}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center print:hidden">
            Optimized for 50mm × 30mm thermal label printers (Brother, Zebra, Dymo).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
