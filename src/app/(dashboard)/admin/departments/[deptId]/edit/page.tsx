"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { getDepartmentById, updateDepartment } from "@/lib/actions/departments"
import { getUsers } from "@/lib/actions/users"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const DEPARTMENT_TYPES = [
  "Emergency",
  "Intensive Care",
  "Surgical",
  "Laboratory",
  "Diagnostic & Imaging",
  "Pediatrics",
  "Dental",
  "Clinical",
  "Biomedical Engineering",
  "Administration",
  "Support Services",
  "Other",
]

export default function EditDepartmentPage({ params }: { params: Promise<{ deptId: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [selectedManagerId, setSelectedManagerId] = useState<string>("none")
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("active")
  
  const { register, handleSubmit, setValue } = useForm()

  useEffect(() => {
    async function loadData() {
      try {
        const [deptRes, usersRes] = await Promise.all([
          getDepartmentById(resolvedParams.deptId),
          getUsers(),
        ])

        if (usersRes.success && Array.isArray(usersRes.data)) {
          setUsers(usersRes.data)
        }

        if (deptRes.success && deptRes.data) {
          const d = deptRes.data
          setValue("name", d.name)
          setValue("code", d.code)
          setValue("departmentType", d.departmentType || "")
          setValue("status", d.status || "active")
          setSelectedType(d.departmentType || "")
          setSelectedStatus(d.status || "active")
          setSelectedManagerId(d.managerUserId || "none")
        }
      } catch (err) {
        console.error("Failed to load department data:", err)
        toast.error("Failed to load department details")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [resolvedParams.deptId, setValue])

  const onSubmit = async (data: any) => {
    setSaving(true)
    try {
      const payload = {
        name: data.name,
        code: data.code,
        departmentType: selectedType || null,
        status: selectedStatus || "active",
        managerUserId: selectedManagerId === "none" ? null : selectedManagerId,
      }

      const res = await updateDepartment(resolvedParams.deptId, payload)
      if (res.success) {
        toast.success("Department updated successfully")
        router.push(`/departments/${resolvedParams.deptId}`)
        router.refresh()
      } else {
        toast.error((res as any).error || "Failed to update department")
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/departments/${resolvedParams.deptId}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <PageHeader title="Edit Department" description="Update department configuration and assigned manager" />
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name <span className="text-destructive">*</span></Label>
              <Input id="name" {...register("name", { required: true })} placeholder="e.g. Emergency Department" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="code">Department Code <span className="text-destructive">*</span></Label>
              <Input id="code" {...register("code", { required: true })} placeholder="e.g. EMERG" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="departmentType">Department Type</Label>
              <Select value={selectedType} onValueChange={(val) => setSelectedType(val)}>
                <SelectTrigger id="departmentType">
                  <SelectValue placeholder="Select Department Type" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager">Department Manager (Head of Department)</Label>
              <Select value={selectedManagerId} onValueChange={(val) => setSelectedManagerId(val)}>
                <SelectTrigger id="manager">
                  <SelectValue placeholder="Assign a Department Manager" />
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
                You can invite new department heads anytime under Administration → Users, then assign them here.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Operational Status</Label>
              <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t">
              <Button type="submit" disabled={saving} className="min-h-[44px]">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button variant="outline" asChild className="min-h-[44px]">
                <Link href={`/departments/${resolvedParams.deptId}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
