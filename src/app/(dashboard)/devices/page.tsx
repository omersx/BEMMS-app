import { getDevices } from "@/lib/actions/devices"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { DeviceStatusBadge, CriticalityBadge } from "@/components/devices/device-badges"
import { Button } from "@/components/ui/button"
import { Plus, QrCode } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function DevicesPage() {
  const result = await getDevices()
  const devicesList = (result?.success && Array.isArray(result.data)) ? result.data : []

  const columns = [
    { key: "internalCode", header: "Code", render: (item: any) => (
      <Link href={`/devices/${item.id}`} className="text-primary hover:underline font-mono text-sm">
        {item.internalCode}
      </Link>
    )},
    { key: "name", header: "Device Name", render: (item: any) => (
      <Link href={`/devices/${item.id}`} className="font-medium hover:underline">
        {item.name}
      </Link>
    )},
    { key: "assetNumber", header: "Asset #" },
    { key: "category", header: "Category", render: (item: any) => item.deviceCategory?.name || "—" },
    { key: "manufacturer", header: "Manufacturer", render: (item: any) => item.manufacturer?.name || "—" },
    { key: "department", header: "Department", render: (item: any) => (
      <span className="text-sm">
        {[item.hospital?.name, item.department?.name].filter(Boolean).join(" / ") || "—"}
      </span>
    )},
    { key: "location", header: "Location", render: (item: any) => item.location?.name || item.exactLocationDescription || "—" },
    { key: "status", header: "Status", render: (item: any) => <DeviceStatusBadge status={item.currentStatusCode} /> },
    { key: "criticality", header: "Criticality", render: (item: any) => <CriticalityBadge level={item.criticalityLevel} /> },
    { key: "actions", header: "", render: (item: any) => (
      <div className="flex gap-1">
        <Button asChild variant="ghost" size="sm" title="View & Print QR">
          <Link href={`/devices/${item.id}/qr`}>
            <QrCode className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Device Inventory"
        description="Manage medical equipment and device lifecycle"
      >
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/scan">
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR
            </Link>
          </Button>
          <Button asChild>
            <Link href="/devices/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Device
            </Link>
          </Button>
        </div>
      </PageHeader>

      <DataTable
        data={devicesList}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search devices by name, asset #, serial #..."
      />
    </div>
  )
}
