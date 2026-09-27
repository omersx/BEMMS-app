import { getDeviceById } from "@/lib/actions/devices"
import { getActiveQrLabel } from "@/lib/actions/qr"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { use } from "react"
import { DeviceQrCard } from "@/components/devices/device-qr-card"

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={`QR Code: ${device.name}`}
        description={`${device.internalCode} — Asset #${device.assetNumber}`}
      >
        <Link href={`/devices/${deviceId}`} className="print:hidden">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Device
          </Button>
        </Link>
      </PageHeader>

      <DeviceQrCard
        device={{
          id: device.id,
          name: device.name,
          internalCode: device.internalCode,
          assetNumber: device.assetNumber,
          hospital: (device as any).hospital,
          department: (device as any).department,
        }}
        qrLabel={qrLabel || null}
      />
    </div>
  )
}
