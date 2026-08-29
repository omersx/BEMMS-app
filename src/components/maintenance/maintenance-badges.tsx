"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Shield,
  Wrench,
  Search,
  Eye,
  Ruler,
  Zap,
  Activity,
  PackagePlus,
  Sliders,
  Archive,
  Ban,
  Calendar,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ExternalLink,
  FileEdit,
  UserCheck,
  RotateCcw,
  CheckCheck,
  HelpCircle,
  Minus,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from "lucide-react"

/**
 * Format string with underscore to capitalized readable words
 */
function formatLabel(value?: string | null): string {
  if (!value) return "Unknown"
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

// ---------------------------------------------------------------------------
// 1. MaintenanceStatusBadge
// ---------------------------------------------------------------------------
interface MaintenanceStatusConfig {
  label: string
  className: string
  icon: React.ComponentType<{ className?: string }>
}

const maintenanceStatusConfig: Record<string, MaintenanceStatusConfig> = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    icon: FileEdit,
  },
  assigned: {
    label: "Assigned",
    className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    icon: UserCheck,
  },
  in_progress: {
    label: "In Progress",
    className: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800",
    icon: Activity,
  },
  waiting_dependency: {
    label: "Waiting Dependency",
    className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    icon: Clock,
  },
  work_complete: {
    label: "Work Complete",
    className: "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800",
    icon: CheckCheck,
  },
  awaiting_review: {
    label: "Awaiting Review",
    className: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    icon: Eye,
  },
  returned_for_rework: {
    label: "Returned for Rework",
    className: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    icon: RotateCcw,
  },
  awaiting_release: {
    label: "Awaiting Release",
    className: "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
    icon: Sparkles,
  },
  closed: {
    label: "Closed",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-rose-100 text-rose-800 border-rose-300 line-through dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
    icon: XCircle,
  },
}

export interface MaintenanceStatusBadgeProps {
  status?: string | null
  className?: string
  showIcon?: boolean
}

export function MaintenanceStatusBadge({
  status,
  className,
  showIcon = false,
}: MaintenanceStatusBadgeProps) {
  const normalized = status ? status.toLowerCase() : ""
  const config = maintenanceStatusConfig[normalized] || {
    label: formatLabel(status),
    className: "bg-muted text-muted-foreground border-border",
    icon: HelpCircle,
  }
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn("inline-flex items-center gap-1.5 font-medium text-xs", config.className, className)}
    >
      {showIcon && <Icon className="h-3 w-3 shrink-0" />}
      <span>{config.label}</span>
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// 2. MaintenanceTypeBadge
// ---------------------------------------------------------------------------
interface MaintenanceTypeConfig {
  label: string
  className: string
  icon: React.ComponentType<{ className?: string }>
}

const maintenanceTypeConfig: Record<string, MaintenanceTypeConfig> = {
  preventive_maintenance: {
    label: "Preventive Maintenance",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    icon: Shield,
  },
  corrective_maintenance: {
    label: "Corrective Maintenance",
    className: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    icon: Wrench,
  },
  troubleshooting: {
    label: "Troubleshooting",
    className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    icon: Search,
  },
  inspection: {
    label: "Inspection",
    className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    icon: Eye,
  },
  calibration: {
    label: "Calibration",
    className: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    icon: Ruler,
  },
  electrical_safety_testing: {
    label: "Electrical Safety Testing",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
    icon: Zap,
  },
  performance_testing: {
    label: "Performance Testing",
    className: "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
    icon: Activity,
  },
  installation_commissioning: {
    label: "Installation / Commissioning",
    className: "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
    icon: PackagePlus,
  },
  software_configuration: {
    label: "Software Configuration",
    className: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800",
    icon: Sliders,
  },
  decommissioning: {
    label: "Decommissioning",
    className: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
    icon: Ban,
  },
  other: {
    label: "Other Maintenance",
    className: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    icon: Wrench,
  },
}

export interface MaintenanceTypeBadgeProps {
  type?: string | null
  className?: string
  showIcon?: boolean
}

export function MaintenanceTypeBadge({
  type,
  className,
  showIcon = true,
}: MaintenanceTypeBadgeProps) {
  const normalized = type ? type.toLowerCase() : ""
  const config = maintenanceTypeConfig[normalized] || {
    label: formatLabel(type),
    className: "bg-muted text-muted-foreground border-border",
    icon: Wrench,
  }
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn("inline-flex items-center gap-1.5 font-medium text-xs", config.className, className)}
    >
      {showIcon && <Icon className="h-3 w-3 shrink-0" />}
      <span>{config.label}</span>
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// 3. DueStateBadge
// ---------------------------------------------------------------------------
interface DueStateConfig {
  label: string
  className: string
  icon: React.ComponentType<{ className?: string }>
}

const dueStateConfig: Record<string, DueStateConfig> = {
  scheduled: {
    label: "Scheduled",
    className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    icon: Calendar,
  },
  due_soon: {
    label: "Due Soon",
    className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    icon: Clock,
  },
  due_today: {
    label: "Due Today",
    className: "bg-orange-100 text-orange-800 border-orange-300 font-semibold dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    icon: AlertCircle,
  },
  overdue: {
    label: "Overdue",
    className: "bg-red-100 text-red-800 border-red-400 animate-pulse font-bold dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    icon: AlertTriangle,
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  deferred: {
    label: "Deferred",
    className: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    icon: Clock,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-500 border-gray-300 line-through dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
    icon: XCircle,
  },
}

export interface DueStateBadgeProps {
  state?: string | null
  dueState?: string | null
  className?: string
  showIcon?: boolean
}

export function DueStateBadge({
  state,
  dueState,
  className,
  showIcon = true,
}: DueStateBadgeProps) {
  const target = state || dueState
  const normalized = target ? target.toLowerCase() : ""
  const config = dueStateConfig[normalized] || {
    label: formatLabel(target),
    className: "bg-muted text-muted-foreground border-border",
    icon: Calendar,
  }
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn("inline-flex items-center gap-1.5 font-medium text-xs", config.className, className)}
    >
      {showIcon && <Icon className="h-3 w-3 shrink-0" />}
      <span>{config.label}</span>
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// 4. PriorityBadge
// ---------------------------------------------------------------------------
interface PriorityConfig {
  label: string
  className: string
  icon?: React.ComponentType<{ className?: string }>
}

const priorityConfig: Record<string, PriorityConfig> = {
  p1_critical: {
    label: "P1 Critical",
    className: "bg-red-100 text-red-800 border-red-300 font-bold dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    icon: AlertTriangle,
  },
  critical: {
    label: "Critical",
    className: "bg-red-100 text-red-800 border-red-300 font-bold dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    icon: AlertTriangle,
  },
  p2_high: {
    label: "P2 High",
    className: "bg-orange-100 text-orange-800 border-orange-300 font-semibold dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    icon: ArrowUp,
  },
  high: {
    label: "High",
    className: "bg-orange-100 text-orange-800 border-orange-300 font-semibold dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    icon: ArrowUp,
  },
  p3_normal: {
    label: "P3 Normal",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    icon: Minus,
  },
  medium: {
    label: "Medium",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    icon: Minus,
  },
  normal: {
    label: "Normal",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    icon: Minus,
  },
  p4_low: {
    label: "P4 Low",
    className: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    icon: ArrowDown,
  },
  low: {
    label: "Low",
    className: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    icon: ArrowDown,
  },
}

export interface PriorityBadgeProps {
  priority?: string | null
  level?: string | null
  className?: string
  showIcon?: boolean
}

export function PriorityBadge({
  priority,
  level,
  className,
  showIcon = false,
}: PriorityBadgeProps) {
  const target = priority || level
  const normalized = target ? target.toLowerCase() : ""
  const config = priorityConfig[normalized] || {
    label: formatLabel(target),
    className: "bg-muted text-muted-foreground border-border",
  }
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn("inline-flex items-center gap-1 font-medium text-xs", config.className, className)}
    >
      {showIcon && Icon && <Icon className="h-3 w-3 shrink-0" />}
      <span>{config.label}</span>
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// 5. ChecklistResultBadge
// ---------------------------------------------------------------------------
interface ChecklistResultConfig {
  label: string
  className: string
  icon: React.ComponentType<{ className?: string }>
}

const checklistResultConfig: Record<string, ChecklistResultConfig> = {
  passed: {
    label: "Passed",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-800 border-red-300 font-semibold dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    icon: XCircle,
  },
  not_applicable: {
    label: "Not Applicable",
    className: "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    icon: MinusCircle,
  },
  requires_follow_up: {
    label: "Requires Follow-up",
    className: "bg-amber-100 text-amber-800 border-amber-300 font-semibold dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    icon: AlertTriangle,
  },
}

export interface ChecklistResultBadgeProps {
  result?: string | null
  status?: string | null
  className?: string
  showIcon?: boolean
}

export function ChecklistResultBadge({
  result,
  status,
  className,
  showIcon = true,
}: ChecklistResultBadgeProps) {
  const target = result || status
  const normalized = target ? target.toLowerCase() : ""
  const config = checklistResultConfig[normalized] || {
    label: formatLabel(target),
    className: "bg-muted text-muted-foreground border-border",
    icon: HelpCircle,
  }
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn("inline-flex items-center gap-1.5 font-medium text-xs", config.className, className)}
    >
      {showIcon && <Icon className="h-3 w-3 shrink-0" />}
      <span>{config.label}</span>
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// 6. FinalResultBadge
// ---------------------------------------------------------------------------
interface FinalResultConfig {
  label: string
  className: string
  icon: React.ComponentType<{ className?: string }>
}

const finalResultConfig: Record<string, FinalResultConfig> = {
  passed: {
    label: "Passed",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  passed_with_limitations: {
    label: "Passed with Limitations",
    className: "bg-amber-100 text-amber-800 border-amber-300 font-medium dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    icon: AlertCircle,
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-800 border-red-300 font-semibold dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    icon: XCircle,
  },
  no_fault_found: {
    label: "No Fault Found",
    className: "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
    icon: Search,
  },
  decommission_recommended: {
    label: "Decommission Recommended",
    className: "bg-rose-100 text-rose-800 border-rose-300 font-semibold dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
    icon: Ban,
  },
  requires_external_service: {
    label: "Requires External Service",
    className: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800",
    icon: ExternalLink,
  },
}

export interface FinalResultBadgeProps {
  result?: string | null
  className?: string
  showIcon?: boolean
}

export function FinalResultBadge({
  result,
  className,
  showIcon = true,
}: FinalResultBadgeProps) {
  const normalized = result ? result.toLowerCase() : ""
  const config = finalResultConfig[normalized] || {
    label: formatLabel(result),
    className: "bg-muted text-muted-foreground border-border",
    icon: HelpCircle,
  }
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn("inline-flex items-center gap-1.5 font-medium text-xs", config.className, className)}
    >
      {showIcon && <Icon className="h-3 w-3 shrink-0" />}
      <span>{config.label}</span>
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// 7. MaintenancePlanStatusBadge (Helper)
// ---------------------------------------------------------------------------
const planStatusConfig: Record<string, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  },
  paused: {
    label: "Paused",
    className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  archived: {
    label: "Archived",
    className: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
}

export function MaintenancePlanStatusBadge({
  status,
  className,
}: {
  status?: string | null
  className?: string
}) {
  const normalized = status ? status.toLowerCase() : ""
  const config = planStatusConfig[normalized] || {
    label: formatLabel(status),
    className: "bg-muted text-muted-foreground border-border",
  }

  return (
    <Badge variant="outline" className={cn("font-medium text-xs", config.className, className)}>
      {config.label}
    </Badge>
  )
}
