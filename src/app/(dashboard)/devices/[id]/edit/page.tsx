"use client"

import { updateDevice } from "@/lib/actions/devices"
import { getDeviceById } from "@/lib/actions/devices"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useState, useEffect, use } from "react"

export default function EditDevicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [device, setDevice] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const res = await getDeviceById(id)
      if (res?.success && res.data) setDevice(res.data)
    }
    load()
  }, [id])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const data: any = {}
    fd.forEach((v, k) => { if (v) data[k] = v })

    const result = await updateDevice(id, data)
    if (result?.success) {
      router.push(`/devices/${id}`)
    } else {
      setError((result as any)?.error || "Failed to update device")
    }
    setLoading(false)
  }

  if (!device) return <div className="p-8 text-center text-muted-foreground">Loading...</div>

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit: ${device.name}`} description={`${device.internalCode}`} />
      {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Device Identity</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Device Name</Label>
                <Input id="name" name="name" defaultValue={device.name} />
              </div>
              <div>
                <Label htmlFor="assetNumber">Asset Number</Label>
                <Input id="assetNumber" name="assetNumber" defaultValue={device.assetNumber} />
              </div>
              <div>
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input id="serialNumber" name="serialNumber" defaultValue={device.serialNumber || ""} />
              </div>
              <div>
                <Label htmlFor="modelNameFree">Model Name</Label>
                <Input id="modelNameFree" name="modelNameFree" defaultValue={device.modelNameFree || ""} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Classification</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="criticalityLevel">Criticality Level</Label>
                <select id="criticalityLevel" name="criticalityLevel" defaultValue={device.criticalityLevel || "medium"}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <Label htmlFor="riskClassification">Risk Classification</Label>
                <select id="riskClassification" name="riskClassification" defaultValue={device.riskClassification || ""}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  <option value="class_i">Class I</option>
                  <option value="class_iia">Class IIa</option>
                  <option value="class_iib">Class IIb</option>
                  <option value="class_iii">Class III</option>
                </select>
              </div>
              <div>
                <Label htmlFor="exactLocationDescription">Exact Location</Label>
                <Input id="exactLocationDescription" name="exactLocationDescription" defaultValue={device.exactLocationDescription || ""} />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Warranty</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="warrantyStartDate">Warranty Start</Label>
                <Input id="warrantyStartDate" name="warrantyStartDate" type="date" defaultValue={device.warrantyStartDate || ""} />
              </div>
              <div>
                <Label htmlFor="warrantyEndDate">Warranty End</Label>
                <Input id="warrantyEndDate" name="warrantyEndDate" type="date" defaultValue={device.warrantyEndDate || ""} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
