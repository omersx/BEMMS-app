"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { addUser } from "@/lib/actions/users"
import { getOrganizations } from "@/lib/actions/organizations"
import { getHospitals } from "@/lib/actions/hospitals"
import { getDepartments } from "@/lib/actions/departments"
import { getRoles } from "@/lib/actions/roles"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import {
  UserPlus,
  Building2,
  Stethoscope,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  KeyRound,
  Radio,
} from "lucide-react"
import Link from "next/link"

export default function AddUserPage() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<any[]>([])
  const [hospitalsList, setHospitalsList] = useState<any[]>([])
  const [departmentsList, setDepartmentsList] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const [selectedOrgId, setSelectedOrgId] = useState<string>("")
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("")
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("")
  const [dutyStatus, setDutyStatus] = useState<string>("on_duty")

  const { register, handleSubmit, setValue } = useForm()

  useEffect(() => {
    async function loadData() {
      const [orgRes, rolesRes] = await Promise.all([
        getOrganizations(),
        getRoles(),
      ])

      if (orgRes.success && orgRes.data) {
        setOrganizations(orgRes.data)
        if (orgRes.data.length === 1) {
          const defaultOrgId = orgRes.data[0].id
          setSelectedOrgId(defaultOrgId)
          setValue("organizationId", defaultOrgId)
        }
      }

      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data)
      }
    }
    loadData()
  }, [setValue])

  // Load hospitals when organization is selected
  useEffect(() => {
    async function loadHospitals() {
      if (!selectedOrgId) {
        setHospitalsList([])
        return
      }
      const hospRes = await getHospitals({ organizationId: selectedOrgId })
      if (hospRes.success && hospRes.data) {
        setHospitalsList(hospRes.data)
      }
    }
    loadHospitals()
  }, [selectedOrgId])

  // Load departments when hospital is selected
  useEffect(() => {
    async function loadDepartments() {
      if (!selectedHospitalId) {
        setDepartmentsList([])
        return
      }
      const deptRes = await getDepartments({ hospitalId: selectedHospitalId })
      if (deptRes.success && deptRes.data) {
        setDepartmentsList(deptRes.data)
      }
    }
    loadDepartments()
  }, [selectedHospitalId])

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    )
  }

  // Detect selected role categories
  const selectedRoleCodes = roles
    .filter((r) => selectedRoleIds.includes(r.id))
    .map((r) => r.code)

  const isEngineerRole = selectedRoleCodes.some((code) =>
    ["BIOMED_ENG", "BIOMED_TECH", "BIOMED_MGR"].includes(code)
  )
  const isStaffRole = selectedRoleCodes.some((code) =>
    ["STAFF", "DEPT_MGR"].includes(code)
  )

  const onSubmit = async (data: any) => {
    if (selectedRoleIds.length === 0) {
      toast.error("Please assign at least one role to the user.")
      return
    }

    if (!selectedOrgId) {
      toast.error("Please select an organization.")
      return
    }

    if (data.password && data.password.trim().length > 0 && data.password.trim().length < 6) {
      toast.error("Initial password must be at least 6 characters long.")
      return
    }

    setLoading(true)
    try {
      const res = await addUser({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || undefined,
        jobTitle: data.jobTitle || undefined,
        employeeIdentifier: data.employeeIdentifier || undefined,
        password: data.password?.trim() ? data.password.trim() : null,
        organizationId: selectedOrgId,
        roleIds: selectedRoleIds,
        hospitalId: selectedHospitalId || undefined,
        departmentId: selectedDepartmentId || undefined,
        specialization: isEngineerRole ? data.specialization || undefined : undefined,
        dutyStatus: isEngineerRole ? dutyStatus : undefined,
      })

      if (res.success) {
        toast.success(`User ${data.fullName || data.email} added successfully!`)
        router.push("/admin/users")
      } else {
        toast.error((res as any)?.error || "Failed to add user")
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
          <Link href="/admin/users">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Users
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Add User"
        description="Create and provision biomedical engineers, clinical department staff, or system administrators"
      />

      <Card className="border shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 1. Basic User Information & Password */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
                <UserPlus className="w-4 h-4 text-primary" />
                User Identity &amp; Credentials
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-semibold">
                    Full Name *
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="e.g. Eng. Tariq Mansour or Nurse Sarah"
                    {...register("fullName", { required: true })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">
                    Official Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@hospital.org"
                    {...register("email", { required: true })}
                  />
                </div>
              </div>

              {/* Password option */}
              <div className="space-y-1.5 p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-primary" />
                    Initial Password (Optional)
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    Min 6 characters
                  </span>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password to activate immediately, or leave empty to send invite"
                  {...register("password")}
                />
                <p className="text-[11px] text-muted-foreground">
                  If set, user account is marked <strong>Active</strong> right away and they can log in immediately.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
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
                <div className="space-y-1.5">
                  <Label htmlFor="jobTitle" className="text-xs font-semibold">
                    Job Title / Clinical Title
                  </Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g. Biomedical Engineer or ICU Nurse"
                    {...register("jobTitle")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="employeeIdentifier" className="text-xs font-semibold">
                    Staff ID / Extension
                  </Label>
                  <Input
                    id="employeeIdentifier"
                    placeholder="e.g. EMP-4011 / Ext. 3120"
                    {...register("employeeIdentifier")}
                  />
                </div>
              </div>
            </div>

            {/* 2. Facility & Department Scope Assignment */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
                <Building2 className="w-4 h-4 text-primary" />
                Facility &amp; Department Allocation
              </h3>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Organization *</Label>
                  <Select
                    value={selectedOrgId}
                    onValueChange={(val) => {
                      setSelectedOrgId(val)
                      setValue("organizationId", val)
                      setSelectedHospitalId("")
                      setSelectedDepartmentId("")
                    }}
                  >
                    <SelectTrigger>
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

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Hospital Facility</Label>
                  <Select
                    value={selectedHospitalId}
                    onValueChange={(val) => {
                      setSelectedHospitalId(val)
                      setSelectedDepartmentId("")
                    }}
                    disabled={!selectedOrgId || hospitalsList.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Hospital (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitalsList.map((hosp) => (
                        <SelectItem key={hosp.id} value={hosp.id}>
                          {hosp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Clinical Department</Label>
                  <Select
                    value={selectedDepartmentId}
                    onValueChange={(val) => setSelectedDepartmentId(val)}
                    disabled={!selectedHospitalId || departmentsList.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentsList.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isStaffRole && (
                <div className="rounded-lg p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2">
                  <Stethoscope className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Clinical Department Scoping:</strong> Selecting a hospital and department automatically configures this user&apos;s department dashboard and problem reporting scope so they can view and report equipment without manual setup.
                  </div>
                </div>
              )}
            </div>

            {/* 3. Role Assignment & System Privileges */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Role Assignment &amp; System Privileges *
              </h3>

              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 border rounded-xl p-4 bg-muted/10">
                {roles.map((role) => {
                  const isChecked = selectedRoleIds.includes(role.id)
                  const isBiomed = ["BIOMED_ENG", "BIOMED_TECH", "BIOMED_MGR"].includes(role.code)
                  const isClinical = ["STAFF", "DEPT_MGR"].includes(role.code)

                  return (
                    <div
                      key={role.id}
                      className={`flex items-start space-x-2.5 p-2 rounded-lg transition-colors border ${
                        isChecked
                          ? "bg-primary/5 border-primary/30"
                          : "hover:bg-muted/40 border-transparent"
                      }`}
                    >
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={isChecked}
                        onCheckedChange={() => toggleRole(role.id)}
                        className="mt-0.5"
                      />
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <label
                          htmlFor={`role-${role.id}`}
                          className="text-xs font-semibold block leading-tight cursor-pointer text-foreground"
                        >
                          {role.name}
                        </label>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {isBiomed ? "🛠️ Engineering" : isClinical ? "👩‍⚕️ Clinical Ward" : "🔒 Admin / Audit"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Automatic Engineer Profile Notice */}
              {isEngineerRole && (
                <div className="rounded-lg p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
                  <Wrench className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Automated Biomedical Engineer Roster Provisioning:</p>
                    <p className="text-[11px] leading-relaxed">
                      Assigning an engineering role automatically registers this user in the hospital <strong>Engineering Team Directory (`/team`)</strong> with availability tracking, weekly duty shift calendar, and emergency incident dispatch.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Engineer-Specific Fields */}
            {isEngineerRole && (
              <div className="space-y-4 pt-2 border-t">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Radio className="w-4 h-4 text-primary" />
                  Biomedical Engineering Configuration
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="specialization" className="text-xs font-semibold">
                      Technical Specialization
                    </Label>
                    <Input
                      id="specialization"
                      placeholder="e.g. ICU / Ventilators, Radiology & CT, Dialysis, General Biomedical"
                      {...register("specialization")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Initial Duty Status</Label>
                    <Select value={dutyStatus} onValueChange={setDutyStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Duty Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on_duty">🟢 On Duty (Available for Dispatch)</SelectItem>
                        <SelectItem value="on_call">🟡 On Call (Emergency Standby)</SelectItem>
                        <SelectItem value="in_maintenance">🔵 In Maintenance (Busy on Task)</SelectItem>
                        <SelectItem value="off_duty">⚪ Off Duty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button asChild variant="outline" disabled={loading}>
                <Link href="/admin/users">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading} className="gap-2 min-w-[140px]">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding User...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Add User
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
