"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createDepartment } from "@/lib/actions/departments"
import { getOrganizations } from "@/lib/actions/organizations"
import { getHospitals } from "@/lib/actions/hospitals"
import { getUsers } from "@/lib/actions/users"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Building2, Loader2, Check } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const DEPARTMENT_TYPES = [
  { value: "Clinical", label: "Clinical" },
  { value: "Surgical", label: "Surgical" },
  { value: "Intensive Care", label: "Intensive Care (ICU)" },
  { value: "Emergency", label: "Emergency" },
  { value: "Diagnostic & Imaging", label: "Diagnostic & Imaging" },
  { value: "Laboratory", label: "Laboratory" },
  { value: "Pharmacy", label: "Pharmacy" },
  { value: "Biomedical Engineering", label: "Biomedical Engineering" },
  { value: "Support Services", label: "Support Services" },
  { value: "Administration", label: "Administration" },
  { value: "Other", label: "Other" },
]

export default function NewDepartmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [hospitals, setHospitals] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  
  const [organizationId, setOrganizationId] = useState("")
  const [hospitalId, setHospitalId] = useState("")
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [departmentType, setDepartmentType] = useState("")
  const [managerUserId, setManagerUserId] = useState<string>("none")

  // Load organizations and users on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [orgRes, usersRes] = await Promise.all([
          getOrganizations(),
          getUsers(),
        ])
        if (orgRes?.success && Array.isArray(orgRes.data)) {
          setOrganizations(orgRes.data)
          // If only one org, auto-select it
          if (orgRes.data.length === 1) {
            setOrganizationId(orgRes.data[0].id)
          }
        }
        if (usersRes?.success && Array.isArray(usersRes.data)) {
          setUsers(usersRes.data)
        }
      } catch (err) {
        console.error("Failed to load initial data:", err)
      }
    }
    loadInitialData()
  }, [])

  // Load hospitals when organization is selected
  useEffect(() => {
    async function loadHospitals() {
      if (organizationId) {
        try {
          const res = await getHospitals(organizationId)
          if (res?.success && Array.isArray(res.data)) {
            setHospitals(res.data)
            // If only one hospital, auto-select it
            if (res.data.length === 1) {
              setHospitalId(res.data[0].id)
            } else {
              setHospitalId("")
            }
          }
        } catch (err) {
          console.error("Failed to load hospitals:", err)
        }
      } else {
        setHospitals([])
        setHospitalId("")
      }
    }
    loadHospitals()
  }, [organizationId])

  // Auto-generate code from department name if code is empty
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setName(val)
    if (!code || code === name.slice(0, 4).toUpperCase()) {
      setCode(val.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase())
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!organizationId) {
      toast.error("Please select an organization")
      return
    }
    if (!hospitalId) {
      toast.error("Please select a hospital")
      return
    }
    if (!name.trim()) {
      toast.error("Please enter a department name")
      return
    }
    if (!code.trim()) {
      toast.error("Please enter a department code")
      return
    }

    setLoading(true)
    try {
      const res = await createDepartment({
        organizationId,
        hospitalId,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        departmentType: departmentType || undefined,
        managerUserId: managerUserId === "none" ? undefined : managerUserId,
        status: "active",
      })

      if (res.success) {
        toast.success("Department created successfully!")
        router.push("/departments")
        router.refresh()
      } else {
        toast.error((res as any).error || "Failed to create department")
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <div className="flex items-center gap-2">
        <Link
          href="/departments"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Departments
        </Link>
      </div>

      <PageHeader
        title="Add Department"
        description="Create a new clinical or operational hospital department"
      />

      <Card className="shadow-xs border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Department Details
          </CardTitle>
          <CardDescription>
            Specify the organization, hospital location, and operational category for the department.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Organization Select */}
            <div className="space-y-2">
              <Label htmlFor="organization">
                Organization <span className="text-destructive">*</span>
              </Label>
              <Select value={organizationId} onValueChange={setOrganizationId}>
                <SelectTrigger id="organization">
                  <SelectValue placeholder="Select Organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hospital Select (cascading) */}
            <div className="space-y-2">
              <Label htmlFor="hospital">
                Hospital <span className="text-destructive">*</span>
              </Label>
              <Select
                value={hospitalId}
                onValueChange={setHospitalId}
                disabled={!organizationId || hospitals.length === 0}
              >
                <SelectTrigger id="hospital">
                  <SelectValue
                    placeholder={
                      !organizationId
                        ? "Select an organization first"
                        : hospitals.length === 0
                        ? "No hospitals available"
                        : "Select Hospital"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {hospitals.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Department Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Intensive Care Unit, Cardiology, Radiology"
                required
              />
            </div>

            {/* Department Code */}
            <div className="space-y-2">
              <Label htmlFor="code">
                Department Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. ICU, CARD, RAD"
                className="font-mono uppercase"
                maxLength={20}
                required
              />
              <p className="text-xs text-muted-foreground">
                Short unique identifier for asset codes and reporting (2-20 characters).
              </p>
            </div>

            {/* Department Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Department Type</Label>
              <Select value={departmentType} onValueChange={setDepartmentType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select Department Type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Manager */}
            <div className="space-y-2">
              <Label htmlFor="manager">Department Manager (Head of Department)</Label>
              <Select value={managerUserId} onValueChange={setManagerUserId}>
                <SelectTrigger id="manager">
                  <SelectValue placeholder="Assign a Department Manager (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- No Manager (Unassigned) --</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.fullName || u.email} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Optional. You can assign or change the department manager anytime later.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Link href="/departments">
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Create Department
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
