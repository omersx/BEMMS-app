"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { getDepartmentById, updateDepartment } from "@/lib/actions/departments"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

export default function EditDepartmentPage({ params }: { params: Promise<{ deptId: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  
  const { register, handleSubmit, setValue } = useForm()

  useEffect(() => {
    async function loadDept() {
      const res = await getDepartmentById(resolvedParams.deptId)
      if (res.success && res.data) {
        const d = res.data
        setValue("name", d.name)
        setValue("code", d.code)
        setValue("departmentType", d.departmentType)
        setValue("status", d.status)
        setLoading(false)
      }
    }
    loadDept()
  }, [resolvedParams.deptId, setValue])

  const onSubmit = async (data: any) => {
    const res = await updateDepartment(resolvedParams.deptId, data)
    if (res.success) {
      router.push(`/admin/departments/${resolvedParams.deptId}`)
    } else {
      alert("Error updating department")
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Department" description="Update department details" />
      
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name", { required: true })} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" {...register("code", { required: true })} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="departmentType">Department Type</Label>
              <Select onValueChange={(val) => setValue("departmentType", val)}>
                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLINICAL">Clinical</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="ADMINISTRATION">Administration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(val) => setValue("status", val)}>
                <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit">Update Department</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
