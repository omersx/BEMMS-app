"use client"

import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Camera, Search, QrCode } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { QrCameraScanner } from "@/components/devices/qr-camera-scanner"

export default function ScanPage() {
  const router = useRouter()
  const [manualInput, setManualInput] = useState("")

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualInput.trim()) {
      // If it looks like a QR reference (starts with dv_), go to scan resolver
      if (manualInput.startsWith("dv_")) {
        router.push(`/scan/${manualInput.trim()}`)
      } else {
        // Otherwise search by asset number in devices list
        router.push(`/devices?search=${encodeURIComponent(manualInput.trim())}`)
      }
    }
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <PageHeader
        title="Scan Device QR"
        description="Scan a QR code or enter an asset number to find a device"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="w-5 h-5 text-primary" />
            Live Camera Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QrCameraScanner />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Manual Lookup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleManualSearch} className="flex gap-2">
            <Input
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter asset number or QR reference (dv_xxx)..."
              className="flex-1"
            />
            <Button type="submit">
              <Search className="w-4 h-4 mr-2" />
              Find
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
