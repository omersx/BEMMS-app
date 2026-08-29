import { getMaintenanceTaskById } from "@/lib/actions/maintenance-tasks"
import { getTaskPartsAndCosts } from "@/lib/actions/checklists"
import { getRecordSignatures } from "@/lib/actions/signatures"
import { db } from "@/lib/db"
import { maintenanceRecords } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { PageHeader } from "@/components/shared/page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  MaintenanceStatusBadge,
  MaintenanceTypeBadge,
  PriorityBadge,
  ChecklistResultBadge,
  FinalResultBadge,
} from "@/components/maintenance/maintenance-badges"
import { DeviceStatusBadge, CriticalityBadge } from "@/components/devices/device-badges"
import {
  TicketStatusBadge,
  TicketPriorityBadge,
  TicketImpactBadge,
} from "@/components/tickets/ticket-badges"
import { PartsCostsManager } from "@/components/maintenance/parts-costs-manager"
import { SignatureTimeline } from "@/components/maintenance/signature-card"
import { TaskActionBar } from "@/components/maintenance/task-action-bar"
import {
  ArrowLeft,
  Calendar,
  Clock,
  User as UserIcon,
  MapPin,
  Monitor,
  CheckSquare,
  DollarSign,
  ShieldCheck,
  Info,
  AlertTriangle,
  FileText,
  Activity,
  Tag,
  Building,
  CheckCircle2,
  XCircle,
  Hash,
  ExternalLink,
  LifeBuoy,
} from "lucide-react"
import Link from "next/link"

export default async function MaintenanceTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // 1. Fetch Task and Parts/Costs concurrently
  const [taskRes, partsRes] = await Promise.all([
    getMaintenanceTaskById(id),
    getTaskPartsAndCosts(id),
  ])

  if (!taskRes?.success || !taskRes.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8 text-center">
        <div className="rounded-full bg-muted p-4">
          <AlertTriangle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">Maintenance Task Not Found</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {taskRes?.error || "The requested maintenance task could not be loaded or does not exist."}
        </p>
        <Button asChild variant="outline">
          <Link href="/maintenance/tasks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Maintenance Tasks
          </Link>
        </Button>
      </div>
    )
  }

  const task = taskRes.data
  const partsData = partsRes?.success && partsRes.data ? partsRes.data : { parts: [], costs: [], totalPartsCost: 0, totalOtherCosts: 0, grandTotal: 0 }

  // 2. Fetch Signatures and Maintenance Record details if resultRecordId exists
  let signatures: any[] = []
  let recordVersions: any[] = []
  let maintenanceRecord: any = null

  if (task.resultRecordId) {
    const [sigRes, recordData] = await Promise.all([
      getRecordSignatures(task.resultRecordId),
      db.query.maintenanceRecords.findFirst({
        where: eq(maintenanceRecords.id, task.resultRecordId),
      }),
    ])

    if (sigRes?.success && sigRes.data) {
      signatures = sigRes.data.signatures || []
      recordVersions = sigRes.data.versions || []
    }
    maintenanceRecord = recordData || null
  }

  // Active work states where parts and costs are editable
  const isEditable = [
    "assigned",
    "in_progress",
    "waiting_dependency",
    "returned_for_rework",
    "work_complete",
  ].includes(task.statusCode)

  // Checklist items & results processing
  const templateItems: any[] =
    (task.checklistTemplateVersion?.itemsJsonb as any[]) || []
  const checklistResultsMap = new Map<string, any>()
  if (Array.isArray(task.checklistResults)) {
    task.checklistResults.forEach((r: any) => {
      checklistResultsMap.set(r.templateItemId, r)
    })
  }

  // Combine template items with executed results or fallback to checklist results
  const checklistRows =
    templateItems.length > 0
      ? templateItems.map((item: any, idx: number) => {
          const result = checklistResultsMap.get(item.id)
          return {
            order: item.itemOrder ?? idx + 1,
            id: item.id,
            label: item.label,
            description: item.description,
            isRequired: item.isRequired,
            inputType: item.inputType,
            toleranceMin: item.toleranceMin,
            toleranceMax: item.toleranceMax,
            unit: item.unit,
            resultCode: result?.resultCode || null,
            measuredValue: result?.measuredValue || null,
            resultUnit: result?.unit || item.unit || null,
            notes: result?.notes || null,
            completedAt: result?.completedAt || null,
          }
        })
      : (task.checklistResults || []).map((r: any, idx: number) => ({
          order: r.itemOrder ?? idx + 1,
          id: r.templateItemId || `item-${idx}`,
          label: r.itemLabelSnapshot || `Checklist Item #${idx + 1}`,
          description: null,
          isRequired: true,
          inputType: r.measuredValue ? "measurement" : "pass_fail",
          toleranceMin: null,
          toleranceMax: null,
          unit: r.unit,
          resultCode: r.resultCode,
          measuredValue: r.measuredValue,
          resultUnit: r.unit,
          notes: r.notes,
          completedAt: r.completedAt,
        }))

  const checklistTotal = checklistRows.length
  const checklistPassed = checklistRows.filter(
    (r: any) => r.resultCode === "passed"
  ).length
  const checklistFailed = checklistRows.filter(
    (r: any) => r.resultCode === "failed" || r.resultCode === "requires_follow_up"
  ).length

  // Counts for tabs
  const partsAndCostsCount =
    (partsData.parts?.length || 0) + (partsData.costs?.length || 0)

  // Format helper for display strings
  const formatCategory = (cat?: string | null) => {
    if (!cat) return "Not specified"
    return cat
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return (
    <div className="space-y-6">
      {/* ── Top Back Link ──────────────────────────────────────────────────── */}
      <div>
        <Link
          href="/maintenance/tasks"
          className="inline-flex items-center text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Maintenance Tasks
        </Link>
      </div>

      {/* ── 1. Header Section ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-b pb-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs sm:text-sm font-semibold text-muted-foreground">
              {task.taskNumber}
            </span>
            <MaintenanceStatusBadge status={task.statusCode} showIcon />
            <PriorityBadge priority={task.priorityCode} showIcon />
            <MaintenanceTypeBadge type={task.maintenanceType} showIcon />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {task.title}
          </h1>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building className="h-3.5 w-3.5" />
              {task.hospital?.name || "Hospital"}
              {task.department?.name ? ` • ${task.department.name}` : ""}
            </span>

            {task.device && (
              <span className="flex items-center gap-1">
                <Monitor className="h-3.5 w-3.5" />
                <Link
                  href={`/devices/${task.deviceId}`}
                  className="font-medium text-primary hover:underline"
                >
                  {task.device.name}
                </Link>
                {task.device.assetNumber && (
                  <span className="text-muted-foreground/80">
                    ({task.device.assetNumber})
                  </span>
                )}
              </span>
            )}

            {task.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Due {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}

            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Created {new Date(task.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* ── 2. Action Buttons Bar (Contextual) ───────────────────────────── */}
        <div className="shrink-0 pt-1">
          <TaskActionBar
            taskId={task.id}
            taskNumber={task.taskNumber}
            statusCode={task.statusCode}
            deviceId={task.deviceId}
            resultRecordId={task.resultRecordId}
          />
        </div>
      </div>

      {/* ── Quick Summary Cards Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Device Snapshot Item */}
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Monitor className="h-3.5 w-3.5 text-primary" />
            Target Device
          </span>
          <div className="mt-1 font-semibold text-sm truncate">
            {task.device ? (
              <Link
                href={`/devices/${task.deviceId}`}
                className="text-foreground hover:text-primary hover:underline truncate block"
              >
                {task.device.name}
              </Link>
            ) : (
              "—"
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {task.device?.assetNumber ? `Asset: ${task.device.assetNumber}` : "No asset tag"}
          </div>
        </div>

        {/* Location & Dept */}
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Location
          </span>
          <div className="mt-1 font-semibold text-sm truncate">
            {task.department?.name || task.hospital?.name || "—"}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {task.hospital?.name || "Hospital Facility"}
          </div>
        </div>

        {/* Assignee */}
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <UserIcon className="h-3.5 w-3.5 text-primary" />
            Assigned Engineer
          </span>
          <div className="mt-1 font-semibold text-sm truncate">
            {task.assignedEngineer?.fullName || "Unassigned"}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {task.assignedEngineer?.email || "Biomedical Team"}
          </div>
        </div>

        {/* Schedule & Due */}
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Due Date
          </span>
          <div className="mt-1 font-semibold text-sm font-mono truncate">
            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Flexible / None"}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {task.completedAt
              ? `Completed ${new Date(task.completedAt).toLocaleDateString()}`
              : task.startedAt
              ? `Started ${new Date(task.startedAt).toLocaleDateString()}`
              : "Not started"}
          </div>
        </div>
      </div>

      {/* ── 3. Tabs Section ────────────────────────────────────────────────── */}
      <Tabs defaultValue="overview" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-4 sm:w-auto sm:inline-flex">
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
            <Info className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>

          <TabsTrigger value="checklist" className="gap-1.5 text-xs sm:text-sm">
            <CheckSquare className="h-4 w-4" />
            <span>Checklist</span>
            {checklistTotal > 0 && (
              <Badge variant="secondary" className="ml-1 text-[11px] px-1.5 py-0 h-4">
                {checklistTotal}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="parts-costs" className="gap-1.5 text-xs sm:text-sm">
            <DollarSign className="h-4 w-4" />
            <span>Parts & Costs</span>
            {partsAndCostsCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-[11px] px-1.5 py-0 h-4">
                {partsAndCostsCount}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="signatures" className="gap-1.5 text-xs sm:text-sm">
            <ShieldCheck className="h-4 w-4" />
            <span>Signatures</span>
            {signatures.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[11px] px-1.5 py-0 h-4">
                {signatures.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: OVERVIEW ──────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left 2 Cols: Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Waiting Dependency Alert Callout */}
              {task.statusCode === "waiting_dependency" && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-sm">
                      <h4 className="font-semibold text-amber-900 dark:text-amber-200">
                        Task Paused — Waiting on Dependency
                      </h4>
                      <p className="text-amber-800 dark:text-amber-300 text-xs sm:text-sm">
                        <span className="font-semibold capitalize">
                          {task.waitingDependencyType?.replace(/_/g, " ") || "External dependency"}:
                        </span>{" "}
                        {task.waitingReason || "No specific reason recorded."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Task Description & Technical Category */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Problem & Task Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                    {task.description || "No specific task description provided."}
                  </p>

                  <div className="flex flex-wrap gap-4 pt-4 border-t">
                    <div className="space-y-1">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                        Technical Category
                      </span>
                      <div className="text-sm font-medium">
                        {formatCategory(task.technicalProblemCategory)}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                        Maintenance Type
                      </span>
                      <div>
                        <MaintenanceTypeBadge type={task.maintenanceType} showIcon />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                        Task Priority
                      </span>
                      <div>
                        <PriorityBadge priority={task.priorityCode} showIcon />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Execution & Findings Card (if completed or record available) */}
              {maintenanceRecord && (
                <Card className="border-cyan-200/70 dark:border-cyan-900/50">
                  <CardHeader className="bg-cyan-50/40 dark:bg-cyan-950/20 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-cyan-700 dark:text-cyan-400" />
                        <CardTitle className="text-base font-semibold">
                          Executed Maintenance & Resolution
                        </CardTitle>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        {maintenanceRecord.recordNumber}
                      </span>
                    </div>
                    <CardDescription className="text-xs">
                      Technical findings, diagnostic conclusions, and resolution summary
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4">
                    {/* Work Performed */}
                    <div className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Work Executed
                      </span>
                      <p className="text-sm whitespace-pre-wrap text-foreground bg-muted/30 p-3 rounded-md border">
                        {maintenanceRecord.workPerformed || "Standard maintenance procedure completed."}
                      </p>
                    </div>

                    {/* Diagnosis & Root Cause Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {maintenanceRecord.diagnosis && (
                        <div className="space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Diagnosis
                          </span>
                          <p className="text-sm text-foreground">{maintenanceRecord.diagnosis}</p>
                        </div>
                      )}

                      {maintenanceRecord.rootCause && (
                        <div className="space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Root Cause
                          </span>
                          <p className="text-sm text-foreground">{maintenanceRecord.rootCause}</p>
                        </div>
                      )}
                    </div>

                    {/* Findings & Recommendations */}
                    {(maintenanceRecord.findings || maintenanceRecord.recommendations) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                        {maintenanceRecord.findings && (
                          <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Key Findings
                            </span>
                            <p className="text-sm text-muted-foreground">{maintenanceRecord.findings}</p>
                          </div>
                        )}

                        {maintenanceRecord.recommendations && (
                          <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Recommendations
                            </span>
                            <p className="text-sm text-muted-foreground">{maintenanceRecord.recommendations}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Final Result & Device Status Badges */}
                    <div className="flex flex-wrap items-center gap-4 pt-3 border-t">
                      <div className="space-y-1">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                          Final Test Result
                        </span>
                        <FinalResultBadge result={maintenanceRecord.finalResultCode} />
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                          Final Device Status
                        </span>
                        <DeviceStatusBadge status={maintenanceRecord.finalDeviceStatusCode} />
                      </div>

                      {maintenanceRecord.calibrationCertificateNumber && (
                        <div className="space-y-1">
                          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                            Calibration Certificate
                          </span>
                          <span className="font-mono text-xs font-medium text-foreground">
                            {maintenanceRecord.calibrationCertificateNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Linked Service Ticket Card */}
              {task.serviceTicket ? (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LifeBuoy className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base font-semibold">Originating Service Ticket</CardTitle>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                        <Link href={`/tickets/${task.serviceTicket.id}`} className="gap-1">
                          <span>View Ticket</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-muted-foreground">
                        {task.serviceTicket.ticketNumber}
                      </span>
                      <TicketPriorityBadge priority={task.serviceTicket.priorityCode} />
                      <TicketStatusBadge status={task.serviceTicket.statusCode} />
                    </div>

                    <h4 className="font-semibold text-sm text-foreground">
                      {task.serviceTicket.title}
                    </h4>

                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      {task.serviceTicket.description}
                    </p>

                    <div className="flex flex-wrap gap-4 pt-2 border-t text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">Category:</span>{" "}
                        {task.serviceTicket.reportedProblemCategory || "General"}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Impact:</span>{" "}
                        <TicketImpactBadge impact={task.serviceTicket.reportedImpact} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            {/* Right 1 Col: Metadata & Context */}
            <div className="space-y-6">
              {/* Target Device Snapshot Card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-primary" />
                      Device Details
                    </CardTitle>
                    {task.device && (
                      <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                        <Link href={`/devices/${task.deviceId}`} className="gap-1">
                          <span>Open</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {task.device ? (
                    <div className="space-y-2.5">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Device Name</span>
                        <Link
                          href={`/devices/${task.deviceId}`}
                          className="font-semibold text-sm text-primary hover:underline block"
                        >
                          {task.device.name}
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Asset Tag</span>
                          <span className="font-mono font-medium text-foreground">
                            {task.device.assetNumber || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Serial #</span>
                          <span className="font-mono font-medium text-foreground">
                            {task.device.serialNumber || "—"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Model</span>
                          <span className="font-medium text-foreground">
                            {task.device.modelNameFree || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Criticality</span>
                          <CriticalityBadge level={task.device.criticalityLevel} />
                        </div>
                      </div>

                      <div className="pt-1 border-t">
                        <span className="text-muted-foreground block text-[11px] mb-1">
                          Current Device Status
                        </span>
                        <DeviceStatusBadge status={task.device.currentStatusCode} />
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No medical device linked.</p>
                  )}
                </CardContent>
              </Card>

              {/* Assignment & People Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-primary" />
                    Assignment & Responsibility
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Assigned Engineer</span>
                    <span className="font-medium text-sm text-foreground block mt-0.5">
                      {task.assignedEngineer?.fullName || "Unassigned"}
                    </span>
                    {task.assignedEngineer?.email && (
                      <span className="text-muted-foreground text-[11px]">
                        {task.assignedEngineer.email}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground block text-[11px]">Created By</span>
                    <span className="font-medium text-foreground">
                      {task.createdByUser?.fullName || "System / Automated"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Execution Milestones & Timeline Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Milestones & Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-mono text-foreground">
                      {new Date(task.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {task.startedAt && (
                    <div className="flex justify-between items-center pt-1 border-t">
                      <span className="text-muted-foreground">Work Started:</span>
                      <span className="font-mono text-foreground">
                        {new Date(task.startedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}

                  {task.completedAt && (
                    <div className="flex justify-between items-center pt-1 border-t">
                      <span className="text-muted-foreground">Work Completed:</span>
                      <span className="font-mono text-foreground">
                        {new Date(task.completedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}

                  {task.dueDate && (
                    <div className="flex justify-between items-center pt-1 border-t">
                      <span className="text-muted-foreground font-medium">Due Date:</span>
                      <span className="font-mono font-semibold text-foreground">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1 border-t">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-mono text-muted-foreground">
                      {new Date(task.updatedAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 2: CHECKLIST ────────────────────────────────────────────── */}
        <TabsContent value="checklist" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base font-semibold">
                      Maintenance Inspection & Procedure Checklist
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {task.checklistTemplateVersion
                      ? `Template Version v${task.checklistTemplateVersion.versionNumber} • Read-only review of measured values and criteria verification`
                      : "Standard maintenance checklist execution results"}
                  </CardDescription>
                </div>

                {checklistTotal > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
                      {checklistPassed} Passed
                    </Badge>
                    {checklistFailed > 0 && (
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
                        {checklistFailed} Issues
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {checklistRows.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <CheckSquare className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">No Checklist Attached</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      This maintenance task was created without a standardized checklist template. Work details are recorded in the task resolution.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[60px] text-center font-semibold">#</TableHead>
                        <TableHead className="min-w-[200px] font-semibold">Checklist Item / Requirement</TableHead>
                        <TableHead className="w-[140px] font-semibold">Type & Range</TableHead>
                        <TableHead className="w-[130px] font-semibold">Result</TableHead>
                        <TableHead className="w-[130px] font-semibold">Measured Value</TableHead>
                        <TableHead className="min-w-[180px] font-semibold">Findings / Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checklistRows.map((row: any) => {
                        const hasTolerance =
                          row.toleranceMin !== null &&
                          row.toleranceMin !== undefined &&
                          row.toleranceMax !== null &&
                          row.toleranceMax !== undefined

                        return (
                          <TableRow key={row.id} className="hover:bg-muted/30">
                            <TableCell className="text-center font-mono text-xs text-muted-foreground font-semibold">
                              {row.order}
                            </TableCell>

                            <TableCell>
                              <div className="font-medium text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                                <span>{row.label}</span>
                                {row.isRequired && (
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-3.5 bg-muted">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              {row.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{row.description}</p>
                              )}
                            </TableCell>

                            <TableCell className="text-xs text-muted-foreground font-mono">
                              <span className="capitalize">{row.inputType.replace(/_/g, " ")}</span>
                              {hasTolerance && (
                                <span className="block text-[11px] text-muted-foreground/80">
                                  [{row.toleranceMin} - {row.toleranceMax} {row.unit || ""}]
                                </span>
                              )}
                            </TableCell>

                            <TableCell>
                              {row.resultCode ? (
                                <ChecklistResultBadge result={row.resultCode} showIcon />
                              ) : (
                                <Badge variant="outline" className="text-xs text-muted-foreground">
                                  Pending
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell className="font-mono text-xs font-semibold text-foreground">
                              {row.measuredValue ? (
                                <span>
                                  {row.measuredValue} {row.resultUnit || row.unit || ""}
                                </span>
                              ) : (
                                <span className="text-muted-foreground font-normal">—</span>
                              )}
                            </TableCell>

                            <TableCell className="text-xs text-muted-foreground">
                              {row.notes ? (
                                <span className="whitespace-pre-wrap">{row.notes}</span>
                              ) : (
                                <span className="text-muted-foreground/60">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 3: PARTS & COSTS ────────────────────────────────────────── */}
        <TabsContent value="parts-costs" className="space-y-6">
          <PartsCostsManager
            taskId={task.id}
            parts={partsData.parts}
            costs={partsData.costs}
            editable={isEditable}
          />
        </TabsContent>

        {/* ── TAB 4: SIGNATURES ───────────────────────────────────────────── */}
        <TabsContent value="signatures" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base font-semibold">
                      21 CFR Part 11 Electronic Signatures & Audit Trail
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Cryptographic signature attestation history for work execution, peer review, and release authorization
                  </CardDescription>
                </div>

                {signatures.length > 0 && (
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {signatures.length} Verified {signatures.length === 1 ? "Signature" : "Signatures"}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-2">
              {/* Record Version Hash Information */}
              {recordVersions.length > 0 && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-primary" />
                      Record Version v{recordVersions[0].versionNumber} Canonical Digest
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Created {new Date(recordVersions[0].createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground truncate bg-background p-2 rounded border">
                    SHA-256: {recordVersions[0].contentHashSha256}
                  </div>
                </div>
              )}

              {/* Signature Timeline Component */}
              <SignatureTimeline
                signatures={signatures}
                emptyMessage={
                  task.statusCode === "work_complete"
                    ? "Work is complete. Click 'Sign & Submit' in the header to execute performer signature."
                    : "No electronic signatures recorded yet. Signatures appear upon completion, review, and release."
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
