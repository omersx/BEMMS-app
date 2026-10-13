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
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function EditUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, setValue } = useForm()

  useEffect(() => {
    async function loadUser() {
      const res = await getUserById(resolvedParams.userId)
      if (res.success && res.data) {
        const u = res.data
        setValue("fullName", u.fullName)
        setValue("phone", u.phone || "")
        setValue("jobTitle", u.jobTitle || "")
        setValue("employeeIdentifier", u.employeeIdentifier || "")
        setLoading(false)
      } else {
        toast.error("Failed to load user profile")
        setLoading(false)
      }
    }
    loadUser()
  }, [resolvedParams.userId, setValue])

  const onSubmit = async (data: any) => {
    setSubmitting(true)
    try {
      const res = await updateUserProfile(resolvedParams.userId, data)
      if (res.success) {
        toast.success("Profile updated successfully")
        router.push(`/admin/users/${resolvedParams.userId}`)
      } else {
        toast.error((res as any)?.error || "Error updating user")
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
          <Link href={`/admin/users/${resolvedParams.userId}`}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to User Details
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Edit Profile"
        description="Update user identity and contact information"
      />

      <Card className="border shadow-xs">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-semibold">
                Full Name *
              </Label>
              <Input
                id="fullName"
                placeholder="e.g. Dr. Ahmed Salem"
                {...register("fullName", { required: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jobTitle" className="text-xs font-semibold">
                Job / Clinical Title
              </Label>
              <Input
                id="jobTitle"
                placeholder="e.g. Biomedical Engineer, Head Nurse"
                {...register("jobTitle")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="employeeIdentifier" className="text-xs font-semibold">
                Employee ID / Username
              </Label>
              <Input
                id="employeeIdentifier"
                placeholder="e.g. EMP-1042"
                {...register("employeeIdentifier")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold">
                Direct Phone / Mobile
              </Label>
              <Input
                id="phone"
                placeholder="+966 50 123 4567"
                {...register("phone")}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button asChild variant="outline" disabled={submitting}>
                <Link href={`/admin/users/${resolvedParams.userId}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Update Profile
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
