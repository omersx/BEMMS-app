import { resolveDeviceScan } from "@/lib/actions/qr"
import { getDeviceActiveTickets } from "@/lib/actions/tickets"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Monitor, MapPin, Hash, Wrench, FileText, AlertTriangle, MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DeviceStatusBadge, CriticalityBadge } from "@/components/devices/device-badges"
import { TicketStatusBadge } from "@/components/tickets/ticket-badges"
import Link from "next/link"
import { use } from "react"

export default function ScanResolverPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  return <ScanResolverContent code={code} />
}

async function ScanResolverContent({ code }: { code: string }) {
  const result = await resolveDeviceScan(code)

  if (result?.success && result.data) {
    // Redirect to the device profile page
    redirect(`/devices/${result.data.deviceId}`)
  }

  // Error state
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold">QR Code Not Recognized</h2>
          <p className="text-muted-foreground text-sm">
            {result?.code === 'INACTIVE'
              ? "This QR label has been revoked or replaced. Please use the current label on the device."
              : "The scanned QR code is not associated with any device in the system."}
          </p>
          <div className="flex gap-2 justify-center">
            <Link href="/scan">
              <Button variant="outline">Try Again</Button>
            </Link>
            <Link href="/devices">
              <Button>Browse Devices</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
