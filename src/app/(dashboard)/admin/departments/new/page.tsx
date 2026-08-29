"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { createDepartment } from "@/lib/actions/departments"
import { getOrganizations } from "@/lib/actions/organizations"
import { getHospitals } from "@/lib/actions/hospitals"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

export default function NewDepartmentPage() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<any[]>([])
  const [hospitals, setHospitals] = useState<any[]>([])
  
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      name: "",
      code: "",
      organizationId: "",
      hospitalId: "",
      departmentType: "",
      managerUserId: "",
      status: "ACTIVE",
    }
  })
  
  const selectedOrgId = watch("organizationId")

  useEffect(() => {
    async function loadOrgs() {
      const res = await getOrganizations()
      if (res.success) setOrganizations(res.data || [])
    }
    loadOrgs()
  }, [])

  useEffect(() => {
    async function loadHospitals() {
      if (selectedOrgId) {
        const res = await getHospitals(selectedOrgId)
        if (res.success) setHospitals(res.data || [])
      } else {
        setHospitals([])
      }
    }
    loadHospitals()
  }, [selectedOrgId])

  const onSubmit = async (data: any) => {
    const res = await createDepartment(data)
    if (res.success) {
      router.push("/admin/departments")
    } else {
      alert("Error creating department")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Add Department" description="Create a new hospital department" />
      
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="organizationId">Organization</Label>
              <Select onValueChange={(val) => setValue("organizationId", val)}>
                <SelectTrigger><SelectValue placeholder="Select Organization" /></SelectTrigger>
                <SelectContent>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hospitalId">Hospital</Label>
              <Select disabled={!selectedOrgId} onValueChange={(val) => setValue("hospitalId", val)}>
                <SelectTrigger><SelectValue placeholder="Select Hospital" /></SelectTrigger>
                <SelectContent>
                  {hospitals.map(h => (
                    <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
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

            <Button type="submit">Create Department</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
