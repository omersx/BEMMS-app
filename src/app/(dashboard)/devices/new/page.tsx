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
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { QuickAddCategoryDialog } from "@/components/devices/quick-add-category-dialog"
import { QuickAddManufacturerDialog } from "@/components/devices/quick-add-manufacturer-dialog"
import { toast } from "sonner"
import { Loader2, ChevronDown, ChevronUp, Sparkles } from "lucide-react"

export default function NewDevicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [deviceName, setDeviceName] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [manufacturers, setManufacturers] = useState<any[]>([])
  const [selectedManufacturerId, setSelectedManufacturerId] = useState("")
  const [hospitals, setHospitals] = useState<any[]>([])
  const [selectedHospitalId, setSelectedHospitalId] = useState("")
  const [departments, setDepartments] = useState<any[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("")
  const [organizationId, setOrganizationId] = useState("")
  const [loadingDepts, setLoadingDepts] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Track auto-detected category name for helpful feedback
  const [detectedCategoryName, setDetectedCategoryName] = useState("")

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, mfrRes, hospRes] = await Promise.all([
          getDeviceCategories(),
          getManufacturers(),
          getHospitals(),
        ])
        if (catRes?.success && catRes.data) setCategories(catRes.data as any[])
        if (mfrRes?.success && mfrRes.data) setManufacturers(mfrRes.data as any[])
        if (hospRes?.success && hospRes.data && Array.isArray(hospRes.data)) {
          const hospList = hospRes.data as any[]
          setHospitals(hospList)
          if (hospList.length > 0) {
            const firstHosp = hospList[0]
            setSelectedHospitalId(firstHosp.id)
            setOrganizationId(firstHosp.organizationId)
            setLoadingDepts(true)
            const deptRes = await getDepartments({ hospitalId: firstHosp.id })
            if (deptRes?.success && deptRes.data) setDepartments(deptRes.data as any[])
            setLoadingDepts(false)
          }
        }
      } catch (err) {
        console.error("Failed to load initial data:", err)
      }
    }
    loadData()
  }, [])

  const handleHospitalChange = async (hospitalId: string) => {
    setSelectedHospitalId(hospitalId)
    setSelectedDepartmentId("")
    if (!hospitalId) { setDepartments([]); setOrganizationId(""); return }
    const hosp = hospitals.find((h: any) => h.id === hospitalId)
    if (hosp) setOrganizationId(hosp.organizationId)
    setLoadingDepts(true)
    try {
      const deptRes = await getDepartments({ hospitalId })
      if (deptRes?.success && deptRes.data) setDepartments(deptRes.data as any[])
      else setDepartments([])
    } catch { setDepartments([]) }
    finally { setLoadingDepts(false) }
  }

  // Smart auto-detection when user types device name
  const handleNameChange = (val: string) => {
    setDeviceName(val)
    if (!val.trim()) {
      setDetectedCategoryName("")
      return
    }

    const lower = val.toLowerCase()
    const matched = categories.find((c: any) => {
      const catLower = c.name.toLowerCase()
      const codeLower = (c.code || "").toLowerCase()
      return lower.includes(catLower) || catLower.includes(lower) || lower.includes(codeLower)
    })

    if (matched) {
      setSelectedCategoryId(matched.id)
      setDetectedCategoryName(matched.name)
    } else {
      setDetectedCategoryName("")
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!organizationId) { setError("Please select a hospital first."); setLoading(false); return }
    if (!selectedDepartmentId) { setError("Please select a department."); setLoading(false); return }

    const fd = new FormData(e.currentTarget)
    const data: any = {}
    fd.forEach((v, k) => { if (v) data[k] = v })

    data.name = deviceName
    data.organizationId = organizationId
    data.hospitalId = selectedHospitalId
    data.departmentId = selectedDepartmentId
    if (selectedCategoryId) data.deviceCategoryId = selectedCategoryId
    if (selectedManufacturerId) data.manufacturerId = selectedManufacturerId

    try {
      const result = await createDevice(data)
      if (result?.success) {
        toast.success("Device registered successfully!")
        router.push(`/devices/${(result as any).data.id}`)
      } else {
        const errMsg = (result as any)?.error || "Failed to create device"
        setError(errMsg)
        toast.error(errMsg)
      }
    } catch (err: any) {
      const errMsg = err.message || "An unexpected error occurred"
      setError(errMsg)
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Add New Device"
        description="Register a new medical device in the hospital inventory"
      />

      {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input type="hidden" name="organizationId" value={organizationId} />

        <div className="grid gap-6 md:grid-cols-2">
          {/* ── Card 1: Device Info ─────────────────────────────────── */}
          <Card>
            <CardHeader><CardTitle>Device Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Device Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={deviceName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Infusion Pump 1, Defibrillator A..."
                  required
                />
                {detectedCategoryName && (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-detected type: {detectedCategoryName}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="assetNumber">Asset Number *</Label>
                <Input id="assetNumber" name="assetNumber" placeholder="e.g. AST-2026-001" required />
              </div>
              <div>
                <Label htmlFor="serialNumber">Serial Number (Optional)</Label>
                <Input id="serialNumber" name="serialNumber" placeholder="Manufacturer serial #" />
              </div>
            </CardContent>
          </Card>

          {/* ── Card 2: Location ───────────────────────────────────── */}
          <Card>
            <CardHeader><CardTitle>Location</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hospitalId">Hospital *</Label>
                <select
                  id="hospitalId" name="hospitalId" required
                  value={selectedHospitalId}
                  onChange={(e) => handleHospitalChange(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select hospital...</option>
                  {hospitals.map((h: any) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="departmentId">Department *</Label>
                  {loadingDepts && (
                    <span className="flex items-center text-xs text-muted-foreground gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                    </span>
                  )}
                </div>
                <select
                  id="departmentId" name="departmentId" required
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                  disabled={!selectedHospitalId || loadingDepts}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                >
                  <option value="">
                    {loadingDepts ? "Loading..." : !selectedHospitalId
                      ? "Select a hospital first..." : departments.length === 0
                      ? "No departments found" : "Select department..."}
                  </option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="exactLocationDescription">Exact Location (Optional)</Label>
                <Input id="exactLocationDescription" name="exactLocationDescription"
                  placeholder="e.g. Room 302, Bay 4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Optional Advanced Details Toggle ─────────────────────── */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1 font-medium"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showAdvanced ? "Hide" : "Show"} Advanced Details
            <span className="text-xs text-muted-foreground/75 font-normal">(device type override, manufacturer, warranty...)</span>
          </button>

          {showAdvanced && (
            <div className="grid gap-6 md:grid-cols-2 mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Type & Classification (Optional)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="deviceCategoryId">Device Type</Label>
                      <QuickAddCategoryDialog
                        onSuccess={(newCat) => {
                          setCategories((prev) => [newCat, ...prev])
                          setSelectedCategoryId(newCat.id)
                          setDetectedCategoryName(newCat.name)
                        }}
                      />
                    </div>
                    <select
                      id="deviceCategoryId"
                      name="deviceCategoryId"
                      value={selectedCategoryId}
                      onChange={(e) => {
                        setSelectedCategoryId(e.target.value)
                        const c = categories.find((cat: any) => cat.id === e.target.value)
                        setDetectedCategoryName(c ? c.name : "")
                      }}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Auto-assign (Default: General Medical Equipment)</option>
                      {categories.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty to auto-detect from name or use default.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="manufacturerId">Manufacturer</Label>
                      <QuickAddManufacturerDialog
                        onSuccess={(newMfr) => {
                          setManufacturers((prev) => [newMfr, ...prev])
                          setSelectedManufacturerId(newMfr.id)
                        }}
                      />
                    </div>
                    <select
                      id="manufacturerId" name="manufacturerId"
                      value={selectedManufacturerId}
                      onChange={(e) => setSelectedManufacturerId(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select manufacturer...</option>
                      {manufacturers.map((m: any) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.country ? `(${m.country})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="modelNameFree">Model Name</Label>
                    <Input id="modelNameFree" name="modelNameFree" placeholder="Model name/number" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Purchase & Warranty (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="purchaseDate">Purchase Date</Label>
                      <Input id="purchaseDate" name="purchaseDate" type="date" />
                    </div>
                    <div>
                      <Label htmlFor="installationDate">Installation Date</Label>
                      <Input id="installationDate" name="installationDate" type="date" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="purchaseCost">Purchase Cost</Label>
                      <Input id="purchaseCost" name="purchaseCost" type="number" step="0.01" placeholder="0.00" />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Input id="currency" name="currency" defaultValue="USD" placeholder="USD" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="warrantyStartDate">Warranty Start</Label>
                      <Input id="warrantyStartDate" name="warrantyStartDate" type="date" />
                    </div>
                    <div>
                      <Label htmlFor="warrantyEndDate">Warranty End Date</Label>
                      <Input id="warrantyEndDate" name="warrantyEndDate" type="date" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading} className="min-h-[44px] px-6">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registering...</>
            ) : (
              "Register Device"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
