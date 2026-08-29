import { getDevices } from "@/lib/actions/devices"
import { PageHeader } from "@/components/shared/page-header"
import { DataTable } from "@/components/shared/data-table"
import { DeviceStatusBadge, CriticalityBadge } from "@/components/devices/device-badges"
import { Button } from "@/components/ui/button"
import { Plus, QrCode } from "lucide-react"
import Link from "next/link"

export default async function DevicesPage() {
  const result = await getDevices()
  const devicesList = (result?.success && Array.isArray(result.data)) ? result.data : []

  const columns = [
    { key: "internalCode", header: "Code", render: (item: any) => (
      <Link href={`/devices/${item.id}`} className="text-primary hover:underline font-mono text-sm">{item.internalCode}</Link>
    )},
    { key: "name", header: "Device Name", render: (item: any) => (
      <Link href={`/devices/${item.id}`} className="font-medium hover:underline">{item.name}</Link>
    )},
    { key: "assetNumber", header: "Asset #" },
    { key: "category", header: "Category", render: (item: any) => item.deviceCategory?.name || "—" },
    { key: "manufacturer", header: "Manufacturer", render: (item: any) => item.manufacturer?.name || "—" },
    { key: "department", header: "Department", render: (item: any) => (
      <span className="text-sm">{item.hospital?.name} / {item.department?.name}</span>
    )},
    { key: "location", header: "Location", render: (item: any) => item.location?.name || "—" },
    { key: "status", header: "Status", render: (item: any) => <DeviceStatusBadge status={item.currentStatusCode} /> },
    { key: "criticality", header: "Criticality", render: (item: any) => <CriticalityBadge level={item.criticalityLevel} /> },
    { key: "actions", header: "", render: (item: any) => (
      <div className="flex gap-1">
        <Link href={`/devices/${item.id}/qr`}>
          <Button variant="ghost" size="sm"><QrCode className="w-4 h-4" /></Button>
        </Link>
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
          <Link href="/scan">
            <Button variant="outline">
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR
            </Button>
          </Link>
          <Link href="/devices/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Device
            </Button>
          </Link>
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
