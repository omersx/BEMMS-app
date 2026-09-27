"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Camera, CameraOff, QrCode, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function QrCameraScanner() {
  const router = useRouter()
  const [isScanning, setIsScanning] = React.useState(false)
  const [hasCamera, setHasCamera] = React.useState<boolean | null>(null)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const scannerRef = React.useRef<any>(null)

  // Handle scanned text
  const handleScanSuccess = React.useCallback(
    (decodedText: string) => {
      // Stop scanner immediately
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
      }
      setIsScanning(false)

      toast.success("QR Code detected!")

      // Process decoded text
      const cleanText = decodedText.trim()

      // 1. If it's a full URL containing /scan/
      if (cleanText.includes("/scan/")) {
        const parts = cleanText.split("/scan/")
        const code = parts[parts.length - 1].split("?")[0].replace(/\/$/, "")
        router.push(`/scan/${code}`)
        return
      }

      // 2. If it's directly an opaque reference
      if (cleanText.startsWith("dv_")) {
        router.push(`/scan/${cleanText}`)
        return
      }

      // 3. Fallback: Search by asset number
      router.push(`/devices?search=${encodeURIComponent(cleanText)}`)
    },
    [router]
  )

  const startScanner = async () => {
    setErrorMsg(null)
    setIsScanning(true)

    try {
      const { Html5QrcodeScanner } = await import("html5-qrcode")

      // Small delay to ensure the container div exists
      setTimeout(() => {
        try {
          const scanner = new Html5QrcodeScanner(
            "bemms-qr-reader",
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              showTorchButtonIfSupported: true,
            },
            false
          )

          scannerRef.current = scanner

          scanner.render(
            (decodedText) => handleScanSuccess(decodedText),
            (error) => {
              // Non-fatal scanning frames error, can be safely ignored
            }
          )
        } catch (err: any) {
          setErrorMsg(err.message || "Failed to initialize camera")
          setIsScanning(false)
        }
      }, 100)
    } catch (err: any) {
      setErrorMsg("Camera scanner library could not be loaded")
      setIsScanning(false)
    }
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {})
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  React.useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Scanner Viewport Container */}
      <div className="relative aspect-square max-w-sm mx-auto bg-muted rounded-xl flex flex-col items-center justify-center border-2 border-dashed overflow-hidden">
        {isScanning ? (
          <div id="bemms-qr-reader" className="w-full h-full" />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <QrCode className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm">Camera QR Scanner</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Position the BEMMS device QR code within camera view to open the profile.
              </p>
            </div>

            {errorMsg && (
              <p className="text-xs text-destructive font-medium px-2 bg-destructive/10 py-1 rounded">
                {errorMsg}
              </p>
            )}

            <Button
              type="button"
              variant="default"
              onClick={startScanner}
              className="mt-2 gap-2"
            >
              <Camera className="w-4 h-4" />
              Enable Camera
            </Button>
          </div>
        )}
      </div>

      {isScanning && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={stopScanner}
            className="gap-2 text-destructive hover:bg-destructive/10"
          >
            <CameraOff className="w-4 h-4" />
            Stop Camera
          </Button>
        </div>
      )}
    </div>
  )
}
