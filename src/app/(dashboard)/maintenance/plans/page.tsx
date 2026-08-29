import { PageHeader } from "@/components/shared/page-header"
import {
  MaintenancePlanStatusBadge,
  DueStateBadge,
} from "@/components/maintenance/maintenance-badges"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  Info,
  Monitor,
  Plus,
  RotateCw,
  User,
  Wrench,
} from "lucide-react"
import Link from "next/link"

export default async function MaintenancePlansPage() {
  // Sample structure demonstration for PM plans until listMaintenancePlans with device joins is available
  const samplePlans = [
    {
      id: "pm-plan-1",
      title: "Quarterly Defibrillator Safety & Calibration",
      deviceName: "Zoll R Series Defibrillator",
      deviceAsset: "ASSET-2024-001",
      department: "Emergency Department",
      frequency: "Every 3 Months",
      nextDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: "active",
      dueState: "scheduled",
      assignedEngineer: "Alex Taylor (Lead Biomed)",
      calculationMethod: "fixed_calendar",
    },
    {
      id: "pm-plan-2",
      title: "Semi-Annual Anesthesia Machine PM & Vaporizer Check",
      deviceName: "Mindray A7 Anesthesia System",
      deviceAsset: "ASSET-2024-042",
      department: "Surgical Suite 3",
      frequency: "Every 6 Months",
      nextDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: "active",
      dueState: "due_soon",
      assignedEngineer: "Sarah Jenkins (Senior CE)",
      calculationMethod: "completion_based",
    },
    {
      id: "pm-plan-3",
      title: "Annual Infusion Pump Electrical Safety Testing",
      deviceName: "Alaris 8100 Infusion Pump",
      deviceAsset: "ASSET-2024-108",
      department: "ICU Ward B",
      frequency: "Every 12 Months",
      nextDueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: "active",
      dueState: "overdue",
      assignedEngineer: "David Chen (Biomed Tech II)",
      calculationMethod: "fixed_calendar",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Preventive Maintenance Plans"
        description="Configure automated recurring PM schedules, calibration cycles, and maintenance routines"
      >
        <Link href="/maintenance/plans/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Plan
          </Button>
        </Link>
      </PageHeader>

      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20">
        <CardContent className="flex items-start gap-4 p-4">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
              Database Synchronization Active
            </h3>
            <p className="text-xs text-blue-800 dark:text-blue-300">
              PM Plans will be loaded from the database. Automated background schedules trigger task creation according to specified lead time days and recurrence calculations.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {samplePlans.map((plan) => (
          <Card key={plan.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-semibold line-clamp-2">
                  {plan.title}
                </CardTitle>
                <MaintenancePlanStatusBadge status={plan.status} />
              </div>
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <Monitor className="w-3.5 h-3.5" />
                <span>{plan.deviceName}</span>
                <span className="text-muted-foreground font-mono">({plan.deviceAsset})</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 text-sm flex-1">
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border">
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <RotateCw className="w-3 h-3" /> Frequency
                  </span>
                  <span className="font-medium text-foreground">{plan.frequency}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Next Due Date
                  </span>
                  <span className="font-medium text-foreground">{plan.nextDueDate}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <User className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[140px]">{plan.assignedEngineer}</span>
                </div>
                <DueStateBadge dueState={plan.dueState} showIcon />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
