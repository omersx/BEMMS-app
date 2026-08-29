"use client"

import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Camera, Search, QrCode } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Camera Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-square bg-muted rounded-lg flex flex-col items-center justify-center gap-4 border-2 border-dashed">
            <QrCode className="w-16 h-16 text-muted-foreground/50" />
            <p className="text-muted-foreground text-center text-sm px-4">
              Camera-based QR scanning requires a browser with camera access.
              <br />
              Position the QR code within the viewfinder.
            </p>
            <Button variant="outline" disabled>
              <Camera className="w-4 h-4 mr-2" />
              Enable Camera
            </Button>
          </div>
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
