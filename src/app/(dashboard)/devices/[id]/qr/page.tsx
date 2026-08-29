import { getDeviceById } from "@/lib/actions/devices"
import { getActiveQrLabel } from "@/lib/actions/qr"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, RefreshCw, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { use } from "react"

export default function DeviceQrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <QrContent deviceId={id} />
}

async function QrContent({ deviceId }: { deviceId: string }) {
  const [deviceResult, qrResult] = await Promise.all([
    getDeviceById(deviceId),
    getActiveQrLabel(deviceId),
  ])

  const device = deviceResult?.success ? deviceResult.data : null
  const qrLabel = qrResult?.success ? qrResult.data : null

  if (!device) {
    return <div className="p-8 text-center text-muted-foreground">Device not found</div>
  }

  const scanUrl = qrLabel ? `/scan/${qrLabel.opaqueReference}` : null

  return (
    <div className="space-y-6">
      <PageHeader
        title={`QR Code: ${device.name}`}
        description={`${device.internalCode} — Asset #${device.assetNumber}`}
      >
        <Link href={`/devices/${deviceId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Device
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>QR Label</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {qrLabel ? (
              <>
                <div className="bg-white p-6 rounded-lg border-2 border-dashed border-muted-foreground/20">
                  {/* QR code will be rendered client-side using qrcode library */}
                  <div className="w-48 h-48 bg-muted flex items-center justify-center rounded">
                    <div className="text-center text-sm text-muted-foreground">
                      <p className="font-mono text-xs mb-2">{qrLabel.opaqueReference}</p>
                      <p>QR Code</p>
                      <p className="text-xs mt-1">Scan URL: {scanUrl}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Printer className="w-4 h-4 mr-2" /> Print Label
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground text-center">
                  <p>Reference: <span className="font-mono">{qrLabel.opaqueReference}</span></p>
                  <p>Status: {qrLabel.labelStatus}</p>
                  <p>Print Count: {qrLabel.printCount || 0}</p>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No active QR label for this device.</p>
                <Button>
                  <RefreshCw className="w-4 h-4 mr-2" /> Generate QR Label
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Label Preview</CardTitle></CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-white text-black">
              <div className="text-center space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider">
                  {(device as any).hospital?.name || "Hospital"}
                </p>
                <p className="text-lg font-bold">{device.name}</p>
                <p className="text-sm">Asset #{device.assetNumber}</p>
                <div className="w-24 h-24 mx-auto bg-gray-200 flex items-center justify-center rounded my-2">
                  <span className="text-xs text-gray-500">QR</span>
                </div>
                <p className="text-xs text-gray-600">
                  Scan to view status or report a problem
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Label size: 50mm × 30mm (thermal print compatible)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
