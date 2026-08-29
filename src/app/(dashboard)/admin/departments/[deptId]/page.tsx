import { getDepartmentById } from "@/lib/actions/departments"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Edit } from "lucide-react"

export default async function DepartmentDetailPage({ params }: { params: Promise<{ deptId: string }> }) {
  const { deptId } = await params
  const result = await getDepartmentById(deptId)
  const dept = result?.success ? result.data : null

  if (!dept) {
    return <div>Department not found</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={dept.name} 
        description={`Code: ${dept.code} | Hospital: ${(dept as any).hospital?.name || dept.hospitalId}`}
      >
        <Button asChild variant="outline">
          <Link href={`/admin/departments/${dept.id}/edit`}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
        </Button>
      </PageHeader>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="font-medium text-muted-foreground">Status: </span>
              <StatusBadge status={dept.status} />
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Type: </span>
              <span>{dept.departmentType || "N/A"}</span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Manager ID: </span>
              <span>{(dept as any).manager?.fullName || dept.managerUserId || "None"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Locations & Devices</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="font-medium text-muted-foreground">Linked Devices: </span>
              <span>{(dept as any).linkedDevicesCount || 0}</span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Locations: </span>
              <ul className="list-disc pl-5 mt-2">
                {((dept as any).locations)?.map((loc: any) => (
                  <li key={loc.id}>{loc.name}</li>
                )) || <li>No locations defined.</li>}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
