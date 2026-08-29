"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { getUserById, updateUserProfile } from "@/lib/actions/users"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

export default function EditUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  
  const { register, handleSubmit, setValue } = useForm()

  useEffect(() => {
    async function loadUser() {
      const res = await getUserById(resolvedParams.userId)
      if (res.success && res.data) {
        const u = res.data
        setValue("fullName", u.fullName)
        setValue("phone", u.phone)
        setValue("jobTitle", u.jobTitle)
        setValue("employeeIdentifier", u.employeeIdentifier)
        setLoading(false)
      }
    }
    loadUser()
  }, [resolvedParams.userId, setValue])

  const onSubmit = async (data: any) => {
    const res = await updateUserProfile(resolvedParams.userId, data)
    if (res.success) {
      router.push(`/admin/users/${resolvedParams.userId}`)
    } else {
      alert("Error updating user")
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Profile" description="Update user profile information" />
      
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" {...register("fullName", { required: true })} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input id="jobTitle" {...register("jobTitle")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeIdentifier">Employee ID</Label>
              <Input id="employeeIdentifier" {...register("employeeIdentifier")} />
            </div>

            <Button type="submit">Update Profile</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
