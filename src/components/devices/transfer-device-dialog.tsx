"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getHospitals } from "@/lib/actions/hospitals"
import { getDepartments } from "@/lib/actions/departments"
import { transferDeviceLocation } from "@/lib/actions/devices"

interface TransferDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId: string;
  deviceName: string;
  currentHospital: string;
  currentDepartment: string;
  currentLocation?: string;
  onSuccess: () => void;
}

export function TransferDeviceDialog({
  open,
  onOpenChange,
  deviceId,
  deviceName,
  currentHospital,
  currentDepartment,
  currentLocation,
  onSuccess
}: TransferDeviceDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [hospitals, setHospitals] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  
  const [hospitalId, setHospitalId] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [locationDescription, setLocationDescription] = useState("")
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (open) {
      getHospitals().then(res => {
        if (res?.success && Array.isArray(res.data)) {
          setHospitals(res.data)
        }
      }).catch(console.error)
    }
  }, [open])

  useEffect(() => {
    if (hospitalId) {
      getDepartments(hospitalId).then(res => {
        if (res?.success && Array.isArray(res.data)) {
          setDepartments(res.data)
        }
      }).catch(console.error)
      setDepartmentId("")
    }
  }, [hospitalId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospitalId || !departmentId || !reason) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      await transferDeviceLocation(deviceId, {
        destinationHospitalId: hospitalId,
        destinationDepartmentId: departmentId,
        exactLocationDescription: locationDescription,
        transferReason: reason as any,
        notes
      })
      toast.success("Device transferred successfully")
      onSuccess()
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("Failed to transfer device")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Transfer Device Location</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="text-sm bg-muted p-3 rounded-md">
              <p><strong>Device:</strong> {deviceName}</p>
              <p><strong>Current:</strong> {currentHospital} - {currentDepartment} {currentLocation ? `(${currentLocation})` : ""}</p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="hospital">Destination Hospital *</Label>
              <Select value={hospitalId} onValueChange={setHospitalId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select hospital" />
                </SelectTrigger>
                <SelectContent>
                  {hospitals.map(h => (
                    <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="department">Destination Department *</Label>
              <Select value={departmentId} onValueChange={setDepartmentId} disabled={!hospitalId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Location Description</Label>
              <Input
                id="location"
                placeholder="e.g. Room 101, Bed 3"
                value={locationDescription}
                onChange={(e) => setLocationDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Transfer Reason *</Label>
              <Select value={reason} onValueChange={setReason} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relocation">Relocation</SelectItem>
                  <SelectItem value="temporary_loan">Temporary Loan</SelectItem>
                  <SelectItem value="department_change">Department Change</SelectItem>
                  <SelectItem value="correction">Correction</SelectItem>
                  <SelectItem value="replacement">Replacement</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="storage">Storage</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional details about the transfer"
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
              {loading ? "Transferring..." : "Transfer Device"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
