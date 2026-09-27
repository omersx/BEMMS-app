import { resolveDeviceScan } from "@/lib/actions/qr"
import { getDeviceActiveTickets } from "@/lib/actions/tickets"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, AlertTriangle, ExternalLink, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DeviceStatusBadge } from "@/components/devices/device-badges"
import { DeviceAvailabilityBanner } from "@/components/devices/device-availability-banner"
import { TicketStatusBadge } from "@/components/tickets/ticket-badges"
import Link from "next/link"

export default async function ScanResolverPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return <ScanResolverContent code={code} />
}

async function ScanResolverContent({ code }: { code: string }) {
  const result = await resolveDeviceScan(code)

  if (result?.success && result.data) {
    const device = result.data
    const ticketsResult = await getDeviceActiveTickets(device.deviceId)
    const activeTickets = (ticketsResult?.success && Array.isArray(ticketsResult.data)) ? ticketsResult.data : []

    return (
      <div className="max-w-lg mx-auto space-y-5 pb-8">
        {/* Navigation link */}
        <Link
          href="/scan"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Scanner
        </Link>

        {/* 1. Clinical Availability & Safety Banner */}
        <DeviceAvailabilityBanner
          status={device.currentStatus}
          limitationsNote={device.statusLimitationsNote}
        />

        {/* 2. Device Identity Summary Card */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {device.hospitalName || "Hospital"}
                </p>
                <CardTitle className="text-xl font-bold mt-0.5">{device.deviceName}</CardTitle>
              </div>
              <DeviceStatusBadge status={device.currentStatus} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-sm">
            <div className="flex justify-between py-1.5 border-b text-xs">
              <span className="text-muted-foreground">Asset Number</span>
              <span className="font-mono font-semibold">{device.assetNumber}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b text-xs">
              <span className="text-muted-foreground">Internal Code</span>
              <span className="font-mono">{device.internalCode}</span>
            </div>
            <div className="flex items-start justify-between py-1.5 border-b text-xs">
              <span className="text-muted-foreground">Location</span>
              <span className="text-right font-medium">
                {device.departmentName ? `${device.departmentName} — ` : ""}
                {device.locationName || "General Area"}
              </span>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2.5 pt-2">
            <Button
              asChild
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-5"
            >
              <Link href={`/tickets/create?deviceId=${device.deviceId}&source=qr_scan`}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Report a Problem / Request Maintenance
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full py-5">
              <Link href={`/devices/${device.deviceId}`}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View Full Device Profile & History
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* 3. Active Tickets Alert Card */}
        {activeTickets.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-amber-600" />
                Active Service Ticket in Progress ({activeTickets.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {activeTickets.map((t: any) => (
                <div
                  key={t.id}
                  className="p-3 bg-white dark:bg-card rounded-md border text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium text-primary">{t.ticketNumber}</span>
                    <TicketStatusBadge status={t.statusCode} />
                  </div>
                  <p className="font-medium text-foreground text-sm">{t.title}</p>
                  <p className="text-muted-foreground line-clamp-1">{t.description}</p>
                  <div className="pt-1">
                    <Link
                      href={`/tickets/${t.id}`}
                      className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                    >
                      Track this ticket & add updates →
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Error state for unknown or revoked QR code
  return (
    <div className="flex items-center justify-center min-h-[60vh] max-w-md mx-auto">
      <Card className="w-full text-center">
        <CardContent className="pt-8 pb-6 space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold">QR Code Not Recognized</h2>
          <p className="text-muted-foreground text-sm leading-relaxed px-4">
            {result?.code === "INACTIVE"
              ? "This QR label has been revoked or replaced with a new label. Please check the current label affixed to the device."
              : "The scanned QR code is not associated with any active device in the BEMMS registry."}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/scan">Scan Another</Link>
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/devices">Browse Device Inventory</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
