"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Camera,
  CameraOff,
  QrCode,
  Loader2,
  Upload,
  SwitchCamera,
  Zap,
  ZapOff,
  AlertCircle,
  FileImage,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { playQrBeep, unlockAudio } from "@/lib/utils/sound"

interface CameraDevice {
  id: string
  label: string
}

export function QrCameraScanner() {
  const router = useRouter()
  const [isScanning, setIsScanning] = React.useState(false)
  const [isStarting, setIsStarting] = React.useState(false)
  const [isProcessingFile, setIsProcessingFile] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [cameras, setCameras] = React.useState<CameraDevice[]>([])
  const [currentCameraIndex, setCurrentCameraIndex] = React.useState(0)
  const [hasTorch, setHasTorch] = React.useState(false)
  const [isTorchOn, setIsTorchOn] = React.useState(false)

  const scannerInstanceRef = React.useRef<any>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Handle successful QR detection
  const handleScanSuccess = React.useCallback(
    (decodedText: string) => {
      // Stop scanner immediately upon detection
      if (scannerInstanceRef.current && isScanning) {
        scannerInstanceRef.current.stop().catch(() => {})
      }
      setIsScanning(false)
      setIsTorchOn(false)

      // Audio feedback
      playQrBeep()
      toast.success("QR Code detected!")

      const cleanText = decodedText.trim()

      // 1. Full URL containing /scan/
      if (cleanText.includes("/scan/")) {
        const parts = cleanText.split("/scan/")
        const code = parts[parts.length - 1].split("?")[0].replace(/\/$/, "")
        router.push(`/scan/${code}`)
        return
      }

      // 2. Direct opaque reference (e.g. dv_xxx)
      if (cleanText.startsWith("dv_")) {
        router.push(`/scan/${cleanText}`)
        return
      }

      // 3. Fallback: Search by asset number
      router.push(`/devices?search=${encodeURIComponent(cleanText)}`)
    },
    [router, isScanning]
  )

  // Start camera scanning with direct Html5Qrcode API
  const startCamera = async (cameraConfig?: any) => {
    setErrorMsg(null)
    setIsStarting(true)
    unlockAudio()

    try {
      const { Html5Qrcode } = await import("html5-qrcode")

      // Clean up any lingering instance
      if (scannerInstanceRef.current) {
        try {
          if (scannerInstanceRef.current.isScanning) {
            await scannerInstanceRef.current.stop()
          }
          await scannerInstanceRef.current.clear()
        } catch {
          // ignore cleanup errors
        }
      }

      const html5QrCode = new Html5Qrcode("bemms-qr-reader")
      scannerInstanceRef.current = html5QrCode

      // Discover cameras on device for switcher support
      try {
        const detectedCameras = await Html5Qrcode.getCameras()
        if (detectedCameras && detectedCameras.length > 0) {
          setCameras(
            detectedCameras.map((cam) => ({
              id: cam.id,
              label: cam.label || `Camera ${detectedCameras.indexOf(cam) + 1}`,
            }))
          )
        }
      } catch {
        // Camera enumeration may be restricted before permission is granted
      }

      // Default to rear/environment camera on phones
      const config = cameraConfig || { facingMode: "environment" }

      await html5QrCode.start(
        config,
        {
          fps: 15,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        (decodedText) => handleScanSuccess(decodedText),
        () => {
          // Frame-by-frame parse failures are expected until QR is aligned
        }
      )

      setIsScanning(true)
      setIsStarting(false)

      // Check for torch capability
      try {
        const capabilities: any = html5QrCode.getRunningTrackCapabilities()
        setHasTorch(Boolean(capabilities?.torch))
      } catch {
        setHasTorch(false)
      }
    } catch (err: any) {
      console.error("Camera start error:", err)
      const message =
        err?.name === "NotAllowedError" || err?.message?.includes("Permission")
          ? "Camera permission was denied. Please allow camera access in your browser or upload a QR image below."
          : err?.message || "Failed to start camera. Please check camera permissions or upload an image."

      setErrorMsg(message)
      setIsScanning(false)
      setIsStarting(false)
    }
  }

  // Stop camera and release hardware
  const stopCamera = async () => {
    if (scannerInstanceRef.current) {
      try {
        if (scannerInstanceRef.current.isScanning) {
          await scannerInstanceRef.current.stop()
        }
        await scannerInstanceRef.current.clear()
      } catch (err) {
        console.error("Error stopping camera:", err)
      }
      scannerInstanceRef.current = null
    }
    setIsScanning(false)
    setIsStarting(false)
    setIsTorchOn(false)
  }

  // Switch between available cameras
  const switchCamera = async () => {
    if (cameras.length < 2) return

    const nextIndex = (currentCameraIndex + 1) % cameras.length
    setCurrentCameraIndex(nextIndex)
    const nextCamera = cameras[nextIndex]

    await stopCamera()
    await startCamera({ deviceId: { exact: nextCamera.id } })
  }

  // Toggle flashlight / torch
  const toggleTorch = async () => {
    if (!scannerInstanceRef.current || !hasTorch) return

    try {
      const nextTorchState = !isTorchOn
      await scannerInstanceRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorchState }],
      })
      setIsTorchOn(nextTorchState)
    } catch (err) {
      console.error("Torch error:", err)
      toast.error("Could not toggle flashlight on this device")
    }
  }

  // Process uploaded QR code image
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessingFile(true)
    setErrorMsg(null)
    unlockAudio()

    try {
      const { Html5Qrcode } = await import("html5-qrcode")

      // Use a dedicated scanner instance for file decoding
      const fileScanner = new Html5Qrcode("bemms-qr-file-runner")
      const decodedText = await fileScanner.scanFile(file, false)
      await fileScanner.clear()

      handleScanSuccess(decodedText)
    } catch (err: any) {
      console.error("File scan error:", err)
      toast.error("No QR code detected in this photo. Please try a clearer image.")
    } finally {
      setIsProcessingFile(false)
      if (event.target) {
        event.target.value = ""
      }
    }
  }

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (scannerInstanceRef.current) {
        try {
          if (scannerInstanceRef.current.isScanning) {
            scannerInstanceRef.current.stop().catch(() => {})
          }
          scannerInstanceRef.current.clear().catch(() => {})
        } catch {
          // ignore cleanup errors
        }
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Hidden container for file-based decoding */}
      <div id="bemms-qr-file-runner" className="hidden" />

      {/* Hidden file input for gallery upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Scanner Viewport Card */}
      <div className="relative aspect-square max-w-sm mx-auto bg-muted/40 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-border/80 overflow-hidden shadow-sm">
        {isScanning ? (
          <>
            {/* The clean video element rendered by Html5Qrcode */}
            <div id="bemms-qr-reader" className="w-full h-full relative" />

            {/* Custom High-Tech Medical HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6 z-10">
              {/* Top status badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/85 backdrop-blur-md text-xs font-medium text-foreground border shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Align QR within frame
              </div>

              {/* Target Reticle with 4 Corner Brackets */}
              <div className="relative w-56 h-56 flex items-center justify-center">
                {/* Top-Left Corner */}
                <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                {/* Top-Right Corner */}
                <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                {/* Bottom-Left Corner */}
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                {/* Bottom-Right Corner */}
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />

                {/* Animated Laser Scanning Beam */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_8px_hsl(var(--primary))] animate-scan-laser" />
              </div>

              {/* Bottom hint */}
              <p className="text-[11px] text-white/90 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md font-medium text-center">
                BEMMS Auto-Focus Active
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center gap-3 w-full">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <QrCode className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-base text-foreground">Camera QR Scanner</p>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Position the BEMMS equipment QR code within camera view to open its service profile.
              </p>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 text-xs text-destructive text-left bg-destructive/10 p-3 rounded-lg border border-destructive/20 w-full max-w-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-tight">{errorMsg}</p>
              </div>
            )}

            {/* Primary Actions: Enable Camera on Top, Upload Image Below */}
            <div className="flex flex-col gap-2.5 w-full max-w-xs pt-1">
              <Button
                type="button"
                variant="default"
                size="default"
                onClick={() => startCamera()}
                disabled={isStarting || isProcessingFile}
                className="w-full gap-2 font-medium h-11 shadow-sm"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting Camera...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Enable Camera
                  </>
                )}
              </Button>

              <div className="relative w-full my-0.5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                  <span className="bg-muted/80 px-2 text-muted-foreground font-medium rounded">
                    or
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => fileInputRef.current?.click()}
                disabled={isStarting || isProcessingFile}
                className="w-full gap-2 font-medium h-10 border-border/80 hover:bg-background/80"
              >
                {isProcessingFile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scanning Image...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-primary" />
                    Upload QR Image
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Live Controls Toolbar (While Camera is Active) */}
      {isScanning && (
        <div className="flex items-center justify-center gap-2 max-w-sm mx-auto flex-wrap">
          {/* Switch Camera Button (if multiple cameras available) */}
          {cameras.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={switchCamera}
              className="gap-1.5 text-xs h-9"
              title="Switch camera"
            >
              <SwitchCamera className="w-3.5 h-3.5" />
              Switch Camera
            </Button>
          )}

          {/* Flashlight / Torch Button (if supported) */}
          {hasTorch && (
            <Button
              type="button"
              variant={isTorchOn ? "default" : "outline"}
              size="sm"
              onClick={toggleTorch}
              className="gap-1.5 text-xs h-9"
              title={isTorchOn ? "Turn off flashlight" : "Turn on flashlight"}
            >
              {isTorchOn ? <ZapOff className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
              {isTorchOn ? "Flash Off" : "Flash On"}
            </Button>
          )}

          {/* Upload Photo Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingFile}
            className="gap-1.5 text-xs h-9"
            title="Scan from image file"
          >
            {isProcessingFile ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileImage className="w-3.5 h-3.5" />
            )}
            Upload Image
          </Button>

          {/* Stop Camera Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={stopCamera}
            className="gap-1.5 text-xs h-9 text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <CameraOff className="w-3.5 h-3.5" />
            Stop Camera
          </Button>
        </div>
      )}
    </div>
  )
}
