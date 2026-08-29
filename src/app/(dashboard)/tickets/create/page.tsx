"use client"

import { createTicket } from "@/lib/actions/tickets"
import { getDeviceById } from "@/lib/actions/devices"
import { getDeviceActiveTickets } from "@/lib/actions/tickets"
import { getHospitals } from "@/lib/actions/hospitals"
import { getDepartments } from "@/lib/actions/departments"
import { getDevices } from "@/lib/actions/devices"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DeviceStatusBadge } from "@/components/devices/device-badges"
import { TicketStatusBadge, TicketPriorityBadge } from "@/components/tickets/ticket-badges"
import { AlertTriangle, Monitor } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

import { Suspense } from "react"

export default function CreateTicketPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading form...</div>}>
      <CreateTicketContent />
    </Suspense>
  )
}

function CreateTicketContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefilledDeviceId = searchParams.get("deviceId")
  const prefilledSource = searchParams.get("source") || "manual_entry"

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [device, setDevice] = useState<any>(null)
  const [activeTickets, setActiveTickets] = useState<any[]>([])
  const [hospitals, setHospitals] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [deviceResults, setDeviceResults] = useState<any[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState(prefilledDeviceId || "")
  const [deviceSearch, setDeviceSearch] = useState("")

  // Load prefilled device
  useEffect(() => {
    async function load() {
      const hospRes = await getHospitals()
      if (hospRes?.success && hospRes.data) setHospitals(hospRes.data as any[])

      if (prefilledDeviceId) {
        const devRes = await getDeviceById(prefilledDeviceId)
        if (devRes?.success && devRes.data) {
          setDevice(devRes.data)
          setSelectedDeviceId(prefilledDeviceId)
          // Load active tickets for duplicate check
          const activeRes = await getDeviceActiveTickets(prefilledDeviceId)
          if (activeRes?.success && activeRes.data) setActiveTickets(activeRes.data as any[])
        }
      }
    }
    load()
  }, [prefilledDeviceId])

  const handleHospitalChange = async (hospitalId: string) => {
    if (!hospitalId) { setDepartments([]); return }
    const deptRes = await getDepartments({ hospitalId })
    if (deptRes?.success && deptRes.data) setDepartments(deptRes.data as any[])
  }

  const handleDeviceSearch = async (search: string) => {
    setDeviceSearch(search)
    if (search.length < 2) { setDeviceResults([]); return }
    const res = await getDevices({ search, pageSize: 5 })
    if (res?.success && res.data) setDeviceResults(res.data as any[])
  }

  const selectDevice = async (dev: any) => {
    setDevice(dev)
    setSelectedDeviceId(dev.id)
    setDeviceResults([])
    setDeviceSearch("")
    const activeRes = await getDeviceActiveTickets(dev.id)
    if (activeRes?.success && activeRes.data) setActiveTickets(activeRes.data as any[])
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const data: any = {
      source: prefilledSource,
      deviceId: selectedDeviceId || undefined,
      hospitalId: device?.hospitalId || fd.get("hospitalId"),
      departmentId: device?.departmentId || fd.get("departmentId"),
      organizationId: device?.organizationId || fd.get("organizationId"),
      title: fd.get("title"),
      description: fd.get("description"),
      reportedImpact: fd.get("reportedImpact"),
      reportedProblemCategory: fd.get("reportedProblemCategory") || undefined,
      requesterContactPhone: fd.get("requesterContactPhone") || undefined,
      reportedLocationCorrection: fd.get("reportedLocationCorrection") || undefined,
    }

    const result = await createTicket(data)
    if (result?.success) {
      router.push(`/tickets/${(result as any).data.id}`)
    } else {
      setError((result as any)?.error || "Failed to create ticket")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Report Device Problem"
        description="Submit a service request or report a device issue"
      />

      {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">{error}</div>}

      {/* Duplicate Ticket Warning */}
      {activeTickets.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">
                  {activeTickets.length} active ticket(s) already exist for this device
                </p>
                <div className="mt-2 space-y-2">
                  {activeTickets.map((t: any) => (
                    <div key={t.id} className="flex items-center gap-2 text-sm">
                      <span className="font-mono">{t.ticketNumber}</span>
                      <TicketStatusBadge status={t.statusCode} />
                      <span className="text-muted-foreground">— {t.title}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-700 mt-2">
                  Consider adding a comment to an existing ticket instead of creating a duplicate.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        {/* Device Selection */}
        {device ? (
          <Card className="mb-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><Monitor className="w-5 h-5" />Selected Device</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-lg">{device.name}</span>
                <DeviceStatusBadge status={device.currentStatusCode} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <span>Asset: {device.assetNumber}</span>
                <span>Code: {device.internalCode}</span>
                <span>Hospital: {(device as any).hospital?.name || '—'}</span>
                <span>Department: {(device as any).department?.name || '—'}</span>
              </div>
              {!prefilledDeviceId && (
                <Button type="button" variant="ghost" size="sm" onClick={() => { setDevice(null); setSelectedDeviceId(""); setActiveTickets([]) }}>
                  Change device
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardHeader><CardTitle>Select Device</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Search by device name, asset number, serial..."
                value={deviceSearch}
                onChange={(e) => handleDeviceSearch(e.target.value)}
              />
              {deviceResults.length > 0 && (
                <div className="border rounded-md divide-y max-h-48 overflow-auto">
                  {deviceResults.map((d: any) => (
                    <button
                      key={d.id} type="button"
                      onClick={() => selectDevice(d)}
                      className="w-full text-left px-3 py-2 hover:bg-muted flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium">{d.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">#{d.assetNumber}</span>
                      </div>
                      <DeviceStatusBadge status={d.currentStatusCode} />
                    </button>
                  ))}
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="organizationId">Organization ID</Label>
                  <Input id="organizationId" name="organizationId" placeholder="Org UUID" required={!device} />
                </div>
                <div>
                  <Label htmlFor="hospitalId">Hospital</Label>
                  <select id="hospitalId" name="hospitalId" required={!device}
                    onChange={(e) => handleHospitalChange(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select hospital...</option>
                    {hospitals.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="departmentId">Department</Label>
                  <select id="departmentId" name="departmentId" required={!device}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select department...</option>
                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Problem Report */}
        <Card className="mb-6">
          <CardHeader><CardTitle>Problem Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">What is the problem? *</Label>
              <Input id="title" name="title" required placeholder="Brief description of the issue" />
            </div>
            <div>
              <Label htmlFor="description">Describe the problem in more detail *</Label>
              <Textarea id="description" name="description" required rows={4}
                placeholder="When did it start? What were you trying to do? Any error messages or unusual behavior?" />
            </div>
            <div>
              <Label htmlFor="reportedImpact">Impact *</Label>
              <select id="reportedImpact" name="reportedImpact" required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="device_usable">Device is still usable</option>
                <option value="device_not_usable">Device is NOT usable</option>
                <option value="patient_care_affected">May affect patient care — URGENT</option>
              </select>
            </div>
            <div>
              <Label htmlFor="reportedProblemCategory">Problem Category (optional)</Label>
              <select id="reportedProblemCategory" name="reportedProblemCategory"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select category...</option>
                <option value="power_issue">Power Issue</option>
                <option value="device_not_starting">Device Not Starting</option>
                <option value="display_interface">Display / Interface</option>
                <option value="alarm_problem">Alarm Problem</option>
                <option value="sensor_accessory">Sensor / Accessory</option>
                <option value="electrical_concern">Electrical Concern</option>
                <option value="mechanical_damage">Mechanical Damage</option>
                <option value="software_configuration">Software / Config</option>
                <option value="performance_concern">Performance Concern</option>
                <option value="maintenance_request">Maintenance Request</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="requesterContactPhone">Contact Phone (optional)</Label>
              <Input id="requesterContactPhone" name="requesterContactPhone" placeholder="For follow-up questions" />
            </div>
            <div>
              <Label htmlFor="reportedLocationCorrection">Location Correction (optional)</Label>
              <Input id="reportedLocationCorrection" name="reportedLocationCorrection"
                placeholder="If device is in a different location than recorded" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </form>
    </div>
  )
}
