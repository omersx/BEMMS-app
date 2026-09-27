"use client"

import Link from "next/link"
import { Wrench } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface DeviceMaintenanceTabProps {
  maintenanceTasks: any[];
  deviceId: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  assigned: "bg-indigo-100 text-indigo-800 border-indigo-200",
  in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
  work_complete: "bg-emerald-100 text-emerald-800 border-emerald-200",
  awaiting_review: "bg-purple-100 text-purple-800 border-purple-200",
  awaiting_release: "bg-orange-100 text-orange-800 border-orange-200",
  returned_for_rework: "bg-rose-100 text-rose-800 border-rose-200",
  closed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
}

export function DeviceMaintenanceTab({ maintenanceTasks = [], deviceId }: DeviceMaintenanceTabProps) {
  const total = maintenanceTasks.length
  const completed = maintenanceTasks.filter(t => (t.statusCode || t.status) === "closed").length
  const pending = total - completed
  const overdue = maintenanceTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && (t.statusCode || t.status) !== "closed").length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold">{total}</span>
          <span className="text-sm text-muted-foreground">Total Tasks</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-emerald-600">{completed}</span>
          <span className="text-sm text-muted-foreground">Completed</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-blue-600">{pending}</span>
          <span className="text-sm text-muted-foreground">Pending</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-rose-600">{overdue}</span>
          <span className="text-sm text-muted-foreground">Overdue</span>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Maintenance History</h3>
        
        {maintenanceTasks.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h4 className="text-lg font-medium text-foreground">No maintenance records</h4>
            <p className="text-muted-foreground text-sm mt-1">This device has no recorded maintenance history.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {maintenanceTasks.map(task => {
              const statusKey = task.statusCode || task.status || "draft"
              const typeLabel = (task.maintenanceType || task.type || "corrective").replace(/_/g, " ")
              const assigneeName = task.assignedEngineer?.fullName || task.assignedEngineerName || "Unassigned"
              const completedDate = task.completedAt || task.completedDate
              const startDate = task.startedAt || task.startDate
              const dueDate = task.dueDate

              return (
                <Link key={task.id} href={`/maintenance/tasks/${task.id}`}>
                  <Card className="p-4 hover:bg-muted/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">#{task.taskNumber}</span>
                        <span className="font-medium">{task.title}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Assigned to: {assigneeName}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <Badge variant="outline" className="capitalize">{typeLabel}</Badge>
                      <Badge variant="outline" className={cn("capitalize", statusColors[statusKey] || statusColors.draft)}>
                        {statusKey.replace(/_/g, " ")}
                      </Badge>
                      <div className="text-xs text-muted-foreground sm:text-right sm:w-28">
                        {completedDate ? (
                          <span>Done: {new Date(completedDate).toLocaleDateString()}</span>
                        ) : startDate ? (
                          <span>Started: {new Date(startDate).toLocaleDateString()}</span>
                        ) : dueDate ? (
                          <span>Due: {new Date(dueDate).toLocaleDateString()}</span>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
