"use client"

import { createDevice } from "@/lib/actions/devices"
import { getDeviceCategories } from "@/lib/actions/device-categories"
import { getManufacturers } from "@/lib/actions/manufacturers"
import { getHospitals } from "@/lib/actions/hospitals"
import { getDepartments } from "@/lib/actions/departments"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function NewDevicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [manufacturers, setManufacturers] = useState<any[]>([])
  const [hospitals, setHospitals] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const [catRes, mfrRes, hospRes] = await Promise.all([
        getDeviceCategories(),
        getManufacturers(),
        getHospitals(),
      ])
      if (catRes?.success && catRes.data) setCategories(catRes.data as any[])
      if (mfrRes?.success && mfrRes.data) setManufacturers(mfrRes.data as any[])
      if (hospRes?.success && hospRes.data) setHospitals(hospRes.data as any[])
    }
    loadData()
  }, [])

  const handleHospitalChange = async (hospitalId: string) => {
    if (!hospitalId) { setDepartments([]); return }
    const deptRes = await getDepartments({ hospitalId })
    if (deptRes?.success && deptRes.data) setDepartments(deptRes.data as any[])
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const data: any = {}
    fd.forEach((v, k) => { if (v) data[k] = v })

    const result = await createDevice(data)
    if (result?.success) {
      router.push(`/devices/${(result as any).data.id}`)
    } else {
      setError((result as any)?.error || "Failed to create device")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Add New Device" description="Register a new medical device in the inventory" />

      {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Device Identity</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Device Name *</Label>
                <Input id="name" name="name" placeholder="e.g. Infusion Pump" required />
              </div>
              <div>
                <Label htmlFor="assetNumber">Asset Number *</Label>
                <Input id="assetNumber" name="assetNumber" placeholder="e.g. AST-2026-001" required />
              </div>
              <div>
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input id="serialNumber" name="serialNumber" placeholder="Manufacturer serial #" />
              </div>
              <div>
                <Label htmlFor="deviceCategoryId">Category *</Label>
                <select id="deviceCategoryId" name="deviceCategoryId" required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select category...</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="manufacturerId">Manufacturer</Label>
                <select id="manufacturerId" name="manufacturerId"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select manufacturer...</option>
                  {manufacturers.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="modelNameFree">Model Name</Label>
                <Input id="modelNameFree" name="modelNameFree" placeholder="Model name/number" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Location & Assignment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="organizationId">Organization ID *</Label>
                <Input id="organizationId" name="organizationId" required placeholder="Organization UUID" />
              </div>
              <div>
                <Label htmlFor="hospitalId">Hospital *</Label>
                <select id="hospitalId" name="hospitalId" required
                  onChange={(e) => handleHospitalChange(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select hospital...</option>
                  {hospitals.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="departmentId">Department *</Label>
                <select id="departmentId" name="departmentId" required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select department...</option>
                  {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="exactLocationDescription">Exact Location</Label>
                <Input id="exactLocationDescription" name="exactLocationDescription" placeholder="Room / Area description" />
              </div>
              <div>
                <Label htmlFor="criticalityLevel">Criticality Level</Label>
                <select id="criticalityLevel" name="criticalityLevel"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="medium">Medium</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <Label htmlFor="riskClassification">Risk Classification</Label>
                <select id="riskClassification" name="riskClassification"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  <option value="class_i">Class I</option>
                  <option value="class_iia">Class IIa</option>
                  <option value="class_iib">Class IIb</option>
                  <option value="class_iii">Class III</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Purchase & Warranty</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input id="purchaseDate" name="purchaseDate" type="date" />
              </div>
              <div>
                <Label htmlFor="purchaseCost">Purchase Cost</Label>
                <Input id="purchaseCost" name="purchaseCost" type="number" step="0.01" placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" name="currency" defaultValue="USD" placeholder="USD" />
              </div>
              <div>
                <Label htmlFor="installationDate">Installation Date</Label>
                <Input id="installationDate" name="installationDate" type="date" />
              </div>
              <div>
                <Label htmlFor="warrantyStartDate">Warranty Start</Label>
                <Input id="warrantyStartDate" name="warrantyStartDate" type="date" />
              </div>
              <div>
                <Label htmlFor="warrantyEndDate">Warranty End</Label>
                <Input id="warrantyEndDate" name="warrantyEndDate" type="date" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Register Device"}
          </Button>
        </div>
      </form>
    </div>
  )
}
