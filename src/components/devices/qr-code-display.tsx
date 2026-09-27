"use client"

import * as React from "react"
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Download, Copy, Check, QrCode } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export interface QrCodeDisplayProps {
  value: string;
  size?: number;
  assetNumber?: string;
  deviceName?: string;
  className?: string;
  showDownloadOptions?: boolean;
}

export function QrCodeDisplay({
  value,
  size = 200,
  assetNumber = "device",
  deviceName = "Medical Device",
  className,
  showDownloadOptions = true,
}: QrCodeDisplayProps) {
  const [copied, setCopied] = React.useState(false)
  const canvasRef = React.useRef<HTMLDivElement>(null)

  const handleDownloadPng = () => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current.querySelector("canvas")
    if (!canvas) {
      toast.error("Could not find QR canvas element")
      return
    }

    try {
      // Create full printable resolution image with border & label
      const padding = 24
      const textHeight = 48
      const exportCanvas = document.createElement("canvas")
      exportCanvas.width = canvas.width + padding * 2
      exportCanvas.height = canvas.height + padding * 2 + textHeight
      const ctx = exportCanvas.getContext("2d")

      if (ctx) {
        // Fill white background
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)

        // Draw QR
        ctx.drawImage(canvas, padding, padding)

        // Draw label text
        ctx.fillStyle = "#0f172a"
        ctx.font = "bold 14px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(assetNumber, exportCanvas.width / 2, canvas.height + padding + 18)

        ctx.fillStyle = "#64748b"
        ctx.font = "11px sans-serif"
        ctx.fillText(deviceName.slice(0, 30), exportCanvas.width / 2, canvas.height + padding + 36)

        const link = document.createElement("a")
        const safeName = assetNumber.replace(/[^a-zA-Z0-9_-]/g, "_")
        link.download = `BEMMS_QR_${safeName}.png`
        link.href = exportCanvas.toDataURL("image/png")
        link.click()
        toast.success("QR code image downloaded successfully")
      }
    } catch (err: any) {
      toast.error("Failed to download image: " + err.message)
    }
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success("QR URL copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div
        ref={canvasRef}
        className="bg-white p-4 rounded-xl shadow-xs border flex items-center justify-center"
      >
        <QRCodeCanvas
          value={value}
          size={size}
          level="H"
          includeMargin={false}
        />
      </div>

      {showDownloadOptions && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadPng}
            className="gap-1.5"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>Download PNG</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyUrl}
            className="gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
