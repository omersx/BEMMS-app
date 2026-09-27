"use client"

import { triageTicket, assignTicket } from "@/lib/actions/tickets"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function TicketTriagePanel({ ticketId, currentPriority, engineers }: { ticketId: string, currentPriority: string, engineers: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleTriage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const data: any = {
      priorityCode: fd.get("priorityCode") || currentPriority,
      priorityReason: fd.get("priorityReason") || undefined,
      selectedMaintenanceType: fd.get("selectedMaintenanceType") || undefined,
      selectedTechnicalCategory: fd.get("selectedTechnicalCategory") || undefined,
      assignedEngineerUserId: fd.get("assignedEngineerUserId") || undefined,
      internalTriageNote: fd.get("internalTriageNote") || undefined,
    }

    const result = await triageTicket(ticketId, data)
    if (result?.success) {
      const assigned = !!data.assignedEngineerUserId
      toast.success(
        assigned
          ? "Triage complete — ticket is now In Progress"
          : "Triage saved — assign an engineer to start work"
      )
      router.refresh()
    } else {
      const errMsg = (result as any)?.error || "Failed to triage ticket"
      setError(errMsg)
      toast.error(errMsg)
    }
    setLoading(false)
  }

  return (
    <Card className="border-indigo-200">
      <CardHeader className="bg-indigo-50/50 pb-4">
        <CardTitle className="text-lg text-indigo-900">Biomedical Triage</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm mb-4">{error}</div>}
        <form onSubmit={handleTriage} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priorityCode">Priority</Label>
              <select id="priorityCode" name="priorityCode" defaultValue={currentPriority}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="p1_critical">P1 Critical</option>
                <option value="p2_high">P2 High</option>
                <option value="p3_normal">P3 Normal</option>
                <option value="p4_low">P4 Low</option>
              </select>
            </div>
            <div>
              <Label htmlFor="priorityReason">Priority Justification</Label>
              <Textarea id="priorityReason" name="priorityReason" placeholder="Required if changing priority" rows={1} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="selectedMaintenanceType">Maintenance Type</Label>
              <select id="selectedMaintenanceType" name="selectedMaintenanceType"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select type...</option>
                <option value="corrective_maintenance">Corrective Maintenance</option>
                <option value="preventive_maintenance">Preventive Maintenance</option>
                <option value="troubleshooting">Troubleshooting</option>
                <option value="inspection">Inspection</option>
                <option value="calibration">Calibration</option>
                <option value="software_configuration">Software / Config</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="selectedTechnicalCategory">Technical Category</Label>
              <select id="selectedTechnicalCategory" name="selectedTechnicalCategory"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select category...</option>
                <option value="electrical_power">Electrical / Power</option>
                <option value="display_user_interface">Display / UI</option>
                <option value="alarm_safety">Alarm / Safety</option>
                <option value="mechanical">Mechanical</option>
                <option value="software_configuration">Software</option>
                <option value="no_fault_found">No Fault Found</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="assignedEngineerUserId">Assign To</Label>
            <select id="assignedEngineerUserId" name="assignedEngineerUserId"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Leave unassigned</option>
              {engineers.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="internalTriageNote">Internal Triage Note</Label>
            <Textarea id="internalTriageNote" name="internalTriageNote" placeholder="Visible only to biomedical team" rows={2} />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Complete Triage"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
