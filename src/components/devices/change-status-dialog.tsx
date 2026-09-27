"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { changeDeviceStatus } from "@/lib/actions/devices"
import { DeviceStatusBadge } from "./device-badges"

interface ChangeStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId: string;
  deviceName: string;
  currentStatus: string;
  onSuccess: () => void;
}

export function ChangeStatusDialog({
  open,
  onOpenChange,
  deviceId,
  deviceName,
  currentStatus,
  onSuccess
}: ChangeStatusDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [status, setStatus] = useState("")
  const [reason, setReason] = useState("")
  const [limitationsNote, setLimitationsNote] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!status || !reason) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      await changeDeviceStatus(deviceId, {
        newStatusCode: status as any,
        reason,
        notes,
        limitationsNote: status === 'operational_with_limitations' ? limitationsNote : undefined,
      })
      toast.success("Device status updated successfully")
      onSuccess()
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("Failed to update status")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change Device Status</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Current Status:</span>
              <DeviceStatusBadge status={currentStatus} />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="status">New Status *</Label>
              <Select value={status} onValueChange={setStatus} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="operational_with_limitations">Operational with Limitations</SelectItem>
                  <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="under_repair">Under Repair</SelectItem>
                  <SelectItem value="waiting_for_parts">Waiting for Parts</SelectItem>
                  <SelectItem value="awaiting_release">Awaiting Release</SelectItem>
                  <SelectItem value="out_of_service">Out of Service</SelectItem>
                  <SelectItem value="standby">Standby</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Reason for Change *</Label>
              <Input
                id="reason"
                placeholder="Brief reason for status change"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            {status === 'operational_with_limitations' && (
              <div className="grid gap-2">
                <Label htmlFor="limitations">Limitations Note *</Label>
                <Textarea
                  id="limitations"
                  placeholder="Describe the operational limitations"
                  value={limitationsNote}
                  onChange={(e) => setLimitationsNote(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any other relevant details"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
