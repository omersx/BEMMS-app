"use client"

import * as React from "react"
import { QRCodeCanvas } from "qrcode.react"
import { QrCode, ExternalLink, Copy, Check } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface DeviceMiniQrProps {
  deviceId: string
  opaqueReference: string
  assetNumber?: string
  deviceName?: string
}

export function DeviceMiniQr({
  deviceId,
  opaqueReference,
  assetNumber,
  deviceName,
}: DeviceMiniQrProps) {
  const [origin, setOrigin] = React.useState("")
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  const scanUrl = `${origin || ""}/scan/${opaqueReference}`

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(scanUrl)
      setCopied(true)
      toast.success("Scan link copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy link")
    }
  }

  return (
    <div className="flex items-center gap-3.5 p-3 rounded-lg border bg-muted/40 hover:bg-muted/60 transition-colors">
      {/* Mini QR Canvas with clickable link to print page */}
      <Link
        href={`/devices/${deviceId}/qr`}
        className="bg-white p-1.5 rounded-md border shadow-2xs shrink-0 hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer group"
        title="Click to view & print full label"
      >
        <QRCodeCanvas
          value={scanUrl}
          size={72}
          level="M"
          includeMargin={false}
        />
      </Link>

      {/* Info & quick actions */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <QrCode className="w-3.5 h-3.5 text-primary" />
            <span>Device QR Label</span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border">
            {opaqueReference}
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground leading-tight">
          Scan to access quick helpdesk &amp; status
        </p>

        <div className="pt-1 flex items-center gap-3 text-xs">
          <Link
            href={`/devices/${deviceId}/qr`}
            className="text-primary hover:underline font-medium inline-flex items-center gap-1 text-[11px]"
          >
            <span>View &amp; Print</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          <button
            type="button"
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11px] transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
