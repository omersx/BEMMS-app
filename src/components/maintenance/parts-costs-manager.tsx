"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  addMaintenancePart,
  deleteMaintenancePart,
  addMaintenanceCost,
  deleteMaintenanceCost,
} from "@/lib/actions/checklists"
import { cn } from "@/lib/utils"
import {
  Plus,
  Trash2,
  Package,
  Receipt,
  DollarSign,
  AlertCircle,
  X,
  Check,
  Calculator,
  Loader2,
} from "lucide-react"

// ── Types & Helpers ──────────────────────────────────────────────────────────

export interface MaintenancePartItem {
  id: string
  maintenanceTaskId?: string
  maintenanceRecordId?: string | null
  partNumber: string
  partName: string
  quantity: number
  unitCost?: number | null
  currency?: string | null
  supplierName?: string | null
  notes?: string | null
  createdAt?: Date | string | null
}

export interface MaintenanceCostItem {
  id: string
  maintenanceTaskId?: string
  maintenanceRecordId?: string | null
  costType: "part" | "vendor_service" | "labor" | "transport" | "other" | string
  amount: number
  currency?: string | null
  vendorName?: string | null
  invoiceNumber?: string | null
  description?: string | null
  recordedAt?: Date | string | null
}

const COST_TYPE_LABELS: Record<string, string> = {
  part: "Part / Consumable",
  vendor_service: "Vendor Service",
  labor: "Labor",
  transport: "Transport / Freight",
  other: "Other",
}

const COST_TYPE_BADGES: Record<string, string> = {
  part: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  vendor_service: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
  labor: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  transport: "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
  other: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
}

/**
 * Formats an integer amount in cents into currency (e.g. 1250 cents -> "$12.50").
 */
export function formatCurrency(cents?: number | null, currency = "USD"): string {
  if (cents === undefined || cents === null || isNaN(cents)) return "$0.00"
  const dollars = cents / 100
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(dollars)
  } catch {
    return `$${dollars.toFixed(2)}`
  }
}

// ── 1. PartsManager Component ─────────────────────────────────────────────────

export interface PartsManagerProps {
  taskId: string
  parts: MaintenancePartItem[] | any[]
  editable: boolean
  className?: string
}

export function PartsManager({
  taskId,
  parts = [],
  editable = true,
  className,
}: PartsManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isAdding, setIsAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Inline form state
  const [partNumber, setPartNumber] = useState("")
  const [partName, setPartName] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [unitCostInput, setUnitCostInput] = useState("")
  const [supplierName, setSupplierName] = useState("")
  const [notes, setNotes] = useState("")

  const resetForm = () => {
    setPartNumber("")
    setPartName("")
    setQuantity("1")
    setUnitCostInput("")
    setSupplierName("")
    setNotes("")
    setError(null)
    setIsAdding(false)
  }

  // Calculate live total for parts
  const totalPartsCost = parts.reduce((sum, p) => {
    const qty = Number(p.quantity) || 1
    const cost = Number(p.unitCost) || 0
    return sum + cost * qty
  }, 0)

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partNumber.trim()) {
      setError("Part number is required")
      return
    }
    if (!partName.trim()) {
      setError("Part name is required")
      return
    }

    const qtyNum = parseInt(quantity, 10)
    if (isNaN(qtyNum) || qtyNum < 1) {
      setError("Quantity must be at least 1")
      return
    }

    let unitCostCents: number | undefined = undefined
    if (unitCostInput.trim() !== "") {
      const parsedDollars = parseFloat(unitCostInput)
      if (isNaN(parsedDollars) || parsedDollars < 0) {
        setError("Unit cost must be a valid non-negative number")
        return
      }
      unitCostCents = Math.round(parsedDollars * 100)
    }

    setError(null)

    startTransition(async () => {
      const res = await addMaintenancePart(taskId, {
        partNumber: partNumber.trim(),
        partName: partName.trim(),
        quantity: qtyNum,
        unitCost: unitCostCents,
        currency: "USD",
        supplierName: supplierName.trim() || undefined,
        notes: notes.trim() || undefined,
      })

      if (res?.success) {
        resetForm()
        router.refresh()
      } else {
        setError(res?.error || "Failed to add spare part")
      }
    })
  }

  const handleDeletePart = async (partId: string) => {
    setError(null)
    setDeletingId(partId)

    startTransition(async () => {
      const res = await deleteMaintenancePart(partId)
      if (res?.success) {
        router.refresh()
      } else {
        setError(res?.error || "Failed to delete spare part")
      }
      setDeletingId(null)
    })
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Spare Parts Used</h3>
          <Badge variant="secondary" className="text-xs font-medium">
            {parts.length} {parts.length === 1 ? "item" : "items"}
          </Badge>
        </div>
        {editable && !isAdding && (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setError(null)
              setIsAdding(true)
            }}
            className="h-8 gap-1 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Part
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setError(null)}
            className="ml-auto h-5 w-5 text-destructive hover:bg-transparent"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[140px] font-semibold">Part #</TableHead>
              <TableHead className="font-semibold">Part Name</TableHead>
              <TableHead className="w-[70px] text-center font-semibold">Qty</TableHead>
              <TableHead className="w-[110px] text-right font-semibold">Unit Cost</TableHead>
              <TableHead className="w-[110px] text-right font-semibold">Total</TableHead>
              <TableHead className="w-[160px] font-semibold">Supplier</TableHead>
              {editable && <TableHead className="w-[60px] text-center font-semibold">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {parts.length === 0 && !isAdding ? (
              <TableRow>
                <TableCell
                  colSpan={editable ? 7 : 6}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No spare parts recorded for this task.
                </TableCell>
              </TableRow>
            ) : (
              parts.map((part) => {
                const qty = Number(part.quantity) || 1
                const unitCost = Number(part.unitCost) || 0
                const rowTotal = qty * unitCost
                const isDeleting = deletingId === part.id

                return (
                  <TableRow key={part.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs font-medium text-foreground">
                      {part.partNumber}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-foreground">{part.partName}</div>
                      {part.notes && (
                        <div className="text-xs text-muted-foreground line-clamp-1">{part.notes}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium">
                      {qty}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {formatCurrency(part.unitCost, part.currency || "USD")}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                      {formatCurrency(rowTotal, part.currency || "USD")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {part.supplierName || "—"}
                    </TableCell>
                    {editable && (
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={isDeleting || isPending}
                          onClick={() => handleDeletePart(part.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete part"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}

            {/* Inline Add Part Form */}
            {isAdding && (
              <TableRow className="bg-primary/5 border-primary/20">
                <TableCell className="p-2">
                  <Input
                    placeholder="Part #"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                    disabled={isPending}
                    className="h-8 text-xs font-mono"
                    autoFocus
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    placeholder="Part Name"
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                    disabled={isPending}
                    className="h-8 text-xs"
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    disabled={isPending}
                    className="h-8 text-xs text-center"
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={unitCostInput}
                    onChange={(e) => setUnitCostInput(e.target.value)}
                    disabled={isPending}
                    className="h-8 text-xs text-right font-mono"
                  />
                </TableCell>
                <TableCell className="p-2 text-right font-mono text-xs font-semibold text-muted-foreground">
                  {formatCurrency(
                    (parseInt(quantity || "0", 10) || 0) *
                      Math.round((parseFloat(unitCostInput || "0") || 0) * 100)
                  )}
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    placeholder="Supplier (optional)"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    disabled={isPending}
                    className="h-8 text-xs"
                  />
                </TableCell>
                <TableCell className="p-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="default"
                      disabled={isPending}
                      onClick={handleAddPart}
                      className="h-7 w-7 bg-primary text-primary-foreground"
                      title="Save part"
                    >
                      {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={isPending}
                      onClick={resetForm}
                      className="h-7 w-7 text-muted-foreground hover:bg-muted"
                      title="Cancel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>

          <TableFooter>
            <TableRow className="bg-muted/30 font-semibold">
              <TableCell colSpan={4} className="text-right text-xs uppercase tracking-wider text-muted-foreground">
                Total Spare Parts Cost:
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-bold text-foreground">
                {formatCurrency(totalPartsCost)}
              </TableCell>
              <TableCell colSpan={editable ? 2 : 1} />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}

// ── 2. CostsManager Component ─────────────────────────────────────────────────

export interface CostsManagerProps {
  taskId: string
  costs: MaintenanceCostItem[] | any[]
  editable: boolean
  className?: string
}

export function CostsManager({
  taskId,
  costs = [],
  editable = true,
  className,
}: CostsManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isAdding, setIsAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Inline form state
  const [costType, setCostType] = useState<string>("vendor_service")
  const [amountInput, setAmountInput] = useState("")
  const [vendorName, setVendorName] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [description, setDescription] = useState("")

  const resetForm = () => {
    setCostType("vendor_service")
    setAmountInput("")
    setVendorName("")
    setInvoiceNumber("")
    setDescription("")
    setError(null)
    setIsAdding(false)
  }

  // Calculate live total for additional costs
  const totalOtherCosts = costs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amountInput.trim()) {
      setError("Cost amount is required")
      return
    }

    const parsedDollars = parseFloat(amountInput)
    if (isNaN(parsedDollars) || parsedDollars < 0) {
      setError("Amount must be a valid non-negative number")
      return
    }

    const amountCents = Math.round(parsedDollars * 100)
    setError(null)

    startTransition(async () => {
      const res = await addMaintenanceCost(taskId, {
        costType: costType as any,
        amount: amountCents,
        currency: "USD",
        vendorName: vendorName.trim() || undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        description: description.trim() || undefined,
      })

      if (res?.success) {
        resetForm()
        router.refresh()
      } else {
        setError(res?.error || "Failed to add cost item")
      }
    })
  }

  const handleDeleteCost = async (costId: string) => {
    setError(null)
    setDeletingId(costId)

    startTransition(async () => {
      const res = await deleteMaintenanceCost(costId)
      if (res?.success) {
        router.refresh()
      } else {
        setError(res?.error || "Failed to delete cost item")
      }
      setDeletingId(null)
    })
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Additional Service & Labor Costs</h3>
          <Badge variant="secondary" className="text-xs font-medium">
            {costs.length} {costs.length === 1 ? "entry" : "entries"}
          </Badge>
        </div>
        {editable && !isAdding && (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setError(null)
              setIsAdding(true)
            }}
            className="h-8 gap-1 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Cost
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setError(null)}
            className="ml-auto h-5 w-5 text-destructive hover:bg-transparent"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[160px] font-semibold">Cost Type</TableHead>
              <TableHead className="w-[120px] text-right font-semibold">Amount</TableHead>
              <TableHead className="w-[180px] font-semibold">Vendor / Provider</TableHead>
              <TableHead className="w-[140px] font-semibold">Invoice #</TableHead>
              <TableHead className="font-semibold">Description</TableHead>
              {editable && <TableHead className="w-[60px] text-center font-semibold">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {costs.length === 0 && !isAdding ? (
              <TableRow>
                <TableCell
                  colSpan={editable ? 6 : 5}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No additional service or labor costs recorded.
                </TableCell>
              </TableRow>
            ) : (
              costs.map((cost) => {
                const isDeleting = deletingId === cost.id
                const badgeColor = COST_TYPE_BADGES[cost.costType] || "bg-muted text-muted-foreground"
                const typeLabel = COST_TYPE_LABELS[cost.costType] || cost.costType

                return (
                  <TableRow key={cost.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs font-medium", badgeColor)}>
                        {typeLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold text-foreground">
                      {formatCurrency(cost.amount, cost.currency || "USD")}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground">
                      {cost.vendorName || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {cost.invoiceNumber || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {cost.description || "—"}
                    </TableCell>
                    {editable && (
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={isDeleting || isPending}
                          onClick={() => handleDeleteCost(cost.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete cost entry"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}

            {/* Inline Add Cost Form */}
            {isAdding && (
              <TableRow className="bg-primary/5 border-primary/20">
                <TableCell className="p-2">
                  <Select value={costType} onValueChange={setCostType} disabled={isPending}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendor_service">Vendor Service</SelectItem>
                      <SelectItem value="labor">Labor</SelectItem>
                      <SelectItem value="part">Part / Consumable</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    disabled={isPending}
                    className="h-8 text-xs text-right font-mono bg-background"
                    autoFocus
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    placeholder="Vendor / Provider"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    disabled={isPending}
                    className="h-8 text-xs bg-background"
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    placeholder="Invoice #"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    disabled={isPending}
                    className="h-8 text-xs font-mono bg-background"
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    placeholder="Cost description / notes"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isPending}
                    className="h-8 text-xs bg-background"
                  />
                </TableCell>
                <TableCell className="p-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="default"
                      disabled={isPending}
                      onClick={handleAddCost}
                      className="h-7 w-7 bg-primary text-primary-foreground"
                      title="Save cost"
                    >
                      {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={isPending}
                      onClick={resetForm}
                      className="h-7 w-7 text-muted-foreground hover:bg-muted"
                      title="Cancel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>

          <TableFooter>
            <TableRow className="bg-muted/30 font-semibold">
              <TableCell className="text-right text-xs uppercase tracking-wider text-muted-foreground">
                Total Other Costs:
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-bold text-foreground">
                {formatCurrency(totalOtherCosts)}
              </TableCell>
              <TableCell colSpan={editable ? 4 : 3} />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}

// ── 3. PartsCostsSummary Component ────────────────────────────────────────────

export interface PartsCostsSummaryProps {
  parts?: MaintenancePartItem[] | any[]
  costs?: MaintenanceCostItem[] | any[]
  totalPartsCost?: number
  totalOtherCosts?: number
  grandTotal?: number
  currency?: string
  className?: string
}

export function PartsCostsSummary({
  parts = [],
  costs = [],
  totalPartsCost,
  totalOtherCosts,
  grandTotal,
  currency = "USD",
  className,
}: PartsCostsSummaryProps) {
  // Compute totals if not provided explicitly
  const calculatedParts =
    totalPartsCost !== undefined
      ? totalPartsCost
      : parts.reduce((sum, p) => sum + (Number(p.unitCost) || 0) * (Number(p.quantity) || 1), 0)

  const calculatedCosts =
    totalOtherCosts !== undefined
      ? totalOtherCosts
      : costs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)

  const calculatedGrandTotal =
    grandTotal !== undefined ? grandTotal : calculatedParts + calculatedCosts

  const partsCount = parts.length
  const costsCount = costs.length

  return (
    <Card className={cn("overflow-hidden border-border shadow-sm", className)}>
      <CardHeader className="bg-muted/40 border-b pb-3 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
              Cost & Resource Summary
            </CardTitle>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {currency}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Financial total for parts and service execution
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Total Parts */}
          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <Package className="h-3.5 w-3.5 text-blue-500" />
                Spare Parts
              </span>
              <span className="text-[11px]">
                {partsCount} {partsCount === 1 ? "item" : "items"}
              </span>
            </div>
            <div className="mt-1.5 font-mono text-lg font-bold text-foreground">
              {formatCurrency(calculatedParts, currency)}
            </div>
          </div>

          {/* Total Other Costs */}
          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <Receipt className="h-3.5 w-3.5 text-purple-500" />
                Service & Labor
              </span>
              <span className="text-[11px]">
                {costsCount} {costsCount === 1 ? "entry" : "entries"}
              </span>
            </div>
            <div className="mt-1.5 font-mono text-lg font-bold text-foreground">
              {formatCurrency(calculatedCosts, currency)}
            </div>
          </div>

          {/* Grand Total */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 dark:bg-primary/10">
            <div className="flex items-center justify-between text-xs text-primary font-semibold">
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                Grand Total
              </span>
              <Badge variant="default" className="text-[10px] h-4 px-1 bg-primary">
                Final
              </Badge>
            </div>
            <div className="mt-1.5 font-mono text-lg font-extrabold text-primary">
              {formatCurrency(calculatedGrandTotal, currency)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Combined Container Component ──────────────────────────────────────────────

export interface PartsCostsManagerCombinedProps {
  taskId: string
  parts?: MaintenancePartItem[] | any[]
  costs?: MaintenanceCostItem[] | any[]
  editable?: boolean
  currency?: string
  className?: string
}

export function PartsCostsManager({
  taskId,
  parts = [],
  costs = [],
  editable = true,
  currency = "USD",
  className,
}: PartsCostsManagerCombinedProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <PartsManager taskId={taskId} parts={parts} editable={editable} />
      <CostsManager taskId={taskId} costs={costs} editable={editable} />
      <PartsCostsSummary parts={parts} costs={costs} currency={currency} />
    </div>
  )
}

export default PartsCostsManager
