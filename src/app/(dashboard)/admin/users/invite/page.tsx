"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { inviteUser } from "@/lib/actions/users"
import { getOrganizations } from "@/lib/actions/organizations"
import { getRoles } from "@/lib/actions/roles"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

export default function InviteUserPage() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  
  const { register, handleSubmit, setValue } = useForm()

  useEffect(() => {
    async function loadData() {
      const orgRes = await getOrganizations()
      if (orgRes.success) setOrganizations(orgRes.data || [])
        
      const rolesRes = await getRoles()
      if (rolesRes.success) setRoles(rolesRes.data || [])
    }
    loadData()
  }, [])

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    )
  }

  const onSubmit = async (data: any) => {
    const res = await inviteUser({ ...data, roleIds: selectedRoleIds })
    if (res.success) {
      router.push("/admin/users")
    } else {
      alert("Error inviting user")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Invite User" description="Send an invitation to join BEMMS" />
      
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" {...register("fullName", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email", { required: true })} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input id="phone" {...register("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title (Optional)</Label>
                <Input id="jobTitle" {...register("jobTitle")} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employeeIdentifier">Employee ID (Optional)</Label>
                <Input id="employeeIdentifier" {...register("employeeIdentifier")} />
              </div>
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
            </div>

            <div className="space-y-3">
              <Label>Roles</Label>
              <div className="grid gap-2 sm:grid-cols-2 border rounded-md p-4">
                {roles.map(role => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`role-${role.id}`} 
                      checked={selectedRoleIds.includes(role.id)}
                      onCheckedChange={() => toggleRole(role.id)}
                    />
                    <label 
                      htmlFor={`role-${role.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {role.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit">Send Invitation</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
