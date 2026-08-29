import { getDeviceById } from "@/lib/actions/devices"
import { getDeviceStatusHistory, getDeviceLocationHistory } from "@/lib/actions/devices"
import { getActiveQrLabel } from "@/lib/actions/qr"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeviceStatusBadge, CriticalityBadge, RiskClassBadge } from "@/components/devices/device-badges"
import { DeviceAvailabilityBanner } from "@/components/devices/device-availability-banner"
import { DeviceStatusTimeline } from "@/components/devices/device-timelines"
import { DeviceLocationTimeline } from "@/components/devices/device-timelines"
import { Edit, QrCode, ArrowLeftRight, Activity } from "lucide-react"
import Link from "next/link"
import { use } from "react"

export default function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  // We need to call these in a server component context — use async wrapper
  return <DeviceDetailContent deviceId={id} />
}

async function DeviceDetailContent({ deviceId }: { deviceId: string }) {
  const [deviceResult, statusResult, locationResult, qrResult] = await Promise.all([
    getDeviceById(deviceId),
    getDeviceStatusHistory(deviceId),
    getDeviceLocationHistory(deviceId),
    getActiveQrLabel(deviceId),
  ])

  const device = deviceResult?.success ? deviceResult.data : null
  const statusHistory = (statusResult?.success && Array.isArray(statusResult.data)) ? statusResult.data : []
  const locationHistory = (locationResult?.success && Array.isArray(locationResult.data)) ? locationResult.data : []
  const qrLabel = qrResult?.success ? qrResult.data : null

  if (!device) {
    return <div className="p-8 text-center text-muted-foreground">Device not found</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={device.name}
        description={`${device.internalCode} — Asset #${device.assetNumber}`}
      >
        <div className="flex gap-2">
          <Link href={`/devices/${deviceId}/qr`}>
            <Button variant="outline" size="sm">
              <QrCode className="w-4 h-4 mr-2" /> QR Code
            </Button>
          </Link>
          <Link href={`/devices/${deviceId}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" /> Edit
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            <ArrowLeftRight className="w-4 h-4 mr-2" /> Transfer
          </Button>
          <Button variant="outline" size="sm">
            <Activity className="w-4 h-4 mr-2" /> Change Status
          </Button>
        </div>
      </PageHeader>

      <DeviceAvailabilityBanner
        status={device.currentStatusCode}
        limitationsNote={device.statusLimitationsNote}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="status-history">Status History</TabsTrigger>
          <TabsTrigger value="location-history">Location History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Device Identity</CardTitle></CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Internal Code</span>
                  <span className="font-mono">{device.internalCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asset Number</span>
                  <span className="font-mono">{device.assetNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serial Number</span>
                  <span>{device.serialNumber || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span>{(device as any).deviceCategory?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Manufacturer</span>
                  <span>{(device as any).manufacturer?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model</span>
                  <span>{(device as any).deviceModel?.modelName || device.modelNameFree || "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <DeviceStatusBadge status={device.currentStatusCode} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Criticality</span>
                  <CriticalityBadge level={device.criticalityLevel} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Risk Class</span>
                  <RiskClassBadge classification={device.riskClassification} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Location & Assignment</CardTitle></CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Organization</span>
                  <span>{(device as any).organization?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hospital</span>
                  <span>{(device as any).hospital?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span>{(device as any).department?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span>{(device as any).location?.name || device.exactLocationDescription || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned Engineer</span>
                  <span>{(device as any).assignedEngineer?.fullName || "Unassigned"}</span>
                </div>
                {qrLabel && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">QR Reference</span>
                    <span className="font-mono text-sm">{qrLabel.opaqueReference}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader><CardTitle>Purchase & Warranty</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div>
                  <span className="text-muted-foreground block text-sm">Purchase Date</span>
                  <span>{device.purchaseDate || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-sm">Purchase Cost</span>
                  <span>{device.purchaseCost ? `${device.currency || 'USD'} ${device.purchaseCost}` : "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-sm">Installation Date</span>
                  <span>{device.installationDate || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-sm">Warranty Start</span>
                  <span>{device.warrantyStartDate || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-sm">Warranty End</span>
                  <span>{device.warrantyEndDate || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-sm">Lifecycle</span>
                  <span className="capitalize">{device.lifecycleStatus}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Technical Specifications</CardTitle></CardHeader>
            <CardContent>
              {device.technicalSpecifications ? (
                <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
                  {JSON.stringify(device.technicalSpecifications, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground">No technical specifications recorded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status-history" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Status Change History</CardTitle></CardHeader>
            <CardContent>
              <DeviceStatusTimeline entries={statusHistory as any} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location-history" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Location Transfer History</CardTitle></CardHeader>
            <CardContent>
              <DeviceLocationTimeline entries={locationHistory as any} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
