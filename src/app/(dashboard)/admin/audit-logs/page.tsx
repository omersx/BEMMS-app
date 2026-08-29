import { getAuditLogs } from "@/lib/actions/audit-logs"
import { DataTable } from "@/components/shared/data-table"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

export default async function AuditLogsPage() {
  const result = await getAuditLogs({})
  const logs = (result?.success && result.data) ? result.data : []

  const columns = [
    { key: "timestamp", header: "Timestamp", render: (log: any) => new Date(log.timestamp).toLocaleString() },
    { key: "actorUserId", header: "Actor", render: (log: any) => log.actor?.fullName || log.actorUserId || "System" },
    { key: "entityType", header: "Entity Type" },
    { key: "entityId", header: "Entity ID" },
    { key: "actionType", header: "Action" },
    { key: "changeReason", header: "Reason", render: (log: any) => log.changeReason || "N/A" },
    {
      key: "details",
      header: "Details",
      render: (log: any) => {
        if (!log.previousState && !log.newState) return <span className="text-muted-foreground text-sm">None</span>
        
        return (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Audit Log Details</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 mt-4">
                {log.previousState && (
                  <div>
                    <h4 className="font-semibold mb-2">Previous State</h4>
                    <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                      {JSON.stringify(log.previousState, null, 2)}
                    </pre>
                  </div>
                )}
                {log.newState && (
                  <div>
                    <h4 className="font-semibold mb-2">New State</h4>
                    <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                      {JSON.stringify(log.newState, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Audit Logs" 
        description="Track system activities and data changes" 
      />
      
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={logs}
            searchable
            searchPlaceholder="Search logs..."
            emptyMessage="No audit logs found."
          />
        </CardContent>
      </Card>
    </div>
  )
}
