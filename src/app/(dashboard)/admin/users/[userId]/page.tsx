import { getUserById } from "@/lib/actions/users"
import { getAuditLogs } from "@/lib/actions/audit-logs"
import { getRoles } from "@/lib/actions/roles"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { UserStatusDialog } from "@/components/admin/user-status-dialog"
import { UserRoleDialog } from "@/components/admin/user-role-dialog"
import Link from "next/link"
import {
  Edit,
  ArrowLeft,
  Building2,
  Wrench,
  Stethoscope,
  MapPin,
  Calendar,
  Phone,
  Radio,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const [result, logsResult, rolesResult] = await Promise.all([
    getUserById(userId),
    getAuditLogs({ actorId: userId, pageSize: 10 }),
    getRoles(),
  ])

  const user = result?.success ? result.data : null

  if (!user) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-semibold">User not found</h2>
        <Button asChild variant="outline">
          <Link href="/admin/users">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Link>
        </Button>
      </div>
    )
  }

  const activityLogs = logsResult?.success && logsResult.data ? logsResult.data : []
  const availableRoles = rolesResult?.success && Array.isArray(rolesResult.data) ? rolesResult.data : []
  const accessScopes = (user as any).accessScopes || []
  const primaryScope = accessScopes.find((s: any) => s.departmentId) || accessScopes[0] || null
  const engineerProfile = (user as any).engineerProfile

  const roleCodes = ((user as any).roles || []).map((r: any) => r.code)
  const isEngineer = roleCodes.some((code: string) =>
    ['BIOMED_ENG', 'BIOMED_TECH', 'BIOMED_MGR'].includes(code)
  )
  const isStaff = roleCodes.some((code: string) =>
    ['STAFF', 'DEPT_MGR'].includes(code)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
          <Link href="/admin/users">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Users
          </Link>
        </Button>
      </div>

      <PageHeader
        title={user.fullName}
        description={user.email}
      >
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/users/${user.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Link>
          </Button>
          <UserStatusDialog
            userId={user.id}
            userName={user.fullName}
            currentStatus={user.accountStatus || 'active'}
          />
        </div>
      </PageHeader>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile & Facility</TabsTrigger>
          <TabsTrigger value="roles">Roles & Access</TabsTrigger>
          <TabsTrigger value="activity">Activity Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* General User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">User Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="font-medium text-xs text-muted-foreground block mb-1">Status</span>
                  <StatusBadge status={user.accountStatus} />
                </div>
                <div>
                  <span className="font-medium text-xs text-muted-foreground block mb-1">Employee ID / Username</span>
                  <span className="text-sm font-semibold">{user.employeeIdentifier || "N/A"}</span>
                </div>
                <div>
                  <span className="font-medium text-xs text-muted-foreground block mb-1">Official Email</span>
                  <span className="text-sm">{user.email}</span>
                </div>
                <div>
                  <span className="font-medium text-xs text-muted-foreground block mb-1">Job / Clinical Title</span>
                  <span className="text-sm">{user.jobTitle || "N/A"}</span>
                </div>
                <div>
                  <span className="font-medium text-xs text-muted-foreground block mb-1">Direct Phone</span>
                  <span className="text-sm">{user.phone || "N/A"}</span>
                </div>
                <div>
                  <span className="font-medium text-xs text-muted-foreground block mb-1">Organization</span>
                  <span className="text-sm font-medium">{(user as any).organization?.name || "N/A"}</span>
                </div>
                <div>
                  <span className="font-medium text-xs text-muted-foreground block mb-1">Last Login</span>
                  <span className="text-xs text-muted-foreground">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never logged in"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-xs text-muted-foreground block mb-1">Account Created</span>
                  <span className="text-xs text-muted-foreground">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Facility & Department Allocation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Facility & Department Allocation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {primaryScope ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
                      <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
                        {isStaff ? (
                          <Stethoscope className="w-4 h-4" />
                        ) : isEngineer ? (
                          <Wrench className="w-4 h-4" />
                        ) : (
                          <Building2 className="w-4 h-4" />
                        )}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {primaryScope.department?.name || "Facility-Wide"}
                          </span>
                          {primaryScope.department?.code && (
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {primaryScope.department.code}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px] uppercase">
                            {primaryScope.scopeType}
                          </Badge>
                        </div>
                        {primaryScope.hospital?.name && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {primaryScope.hospital.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                    No department or facility scope assigned. Account has organization-wide default access.
                  </div>
                )}

                {/* Additional Access Scopes */}
                {accessScopes.length > 1 && (
                  <div className="space-y-2 pt-2 border-t">
                    <span className="text-xs font-semibold text-muted-foreground block">
                      Additional Facility Scopes ({accessScopes.length})
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {accessScopes.map((scope: any) => (
                        <div key={scope.id} className="text-xs flex items-center justify-between p-2 rounded border bg-card">
                          <span>{scope.department?.name || scope.hospital?.name || scope.scopeType}</span>
                          <Badge variant="outline" className="text-[10px]">{scope.scopeType}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Biomedical Engineer Profile Configuration Card */}
          {engineerProfile && (
            <Card className="border-blue-200 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/10">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-blue-900 dark:text-blue-300">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  Biomedical Engineering Roster Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div>
                  <span className="font-medium text-xs text-muted-foreground block mb-1">Technical Specialization</span>
                  <Badge variant="outline" className="bg-blue-100/60 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300">
                    {engineerProfile.specialization || "General Biomedical"}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium text-xs text-muted-foreground block mb-1">Current Duty Status</span>
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                    <span className="capitalize">{engineerProfile.dutyStatus?.replace('_', ' ')}</span>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-xs text-muted-foreground block mb-1">Extension / Bleep</span>
                  <span className="text-sm font-mono">{engineerProfile.extension || "N/A"}</span>
                </div>
                <div>
                  <span className="font-medium text-xs text-muted-foreground block mb-1">Shift Hours</span>
                  <span className="text-xs">{engineerProfile.shiftHours || "Standard Hospital Shift"}</span>
                </div>
                <div>
                  <span className="font-medium text-xs text-muted-foreground block mb-1">Emergency Mobile</span>
                  <span className="text-xs flex items-center gap-1">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    {engineerProfile.mobileNumber || user.phone || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-xs text-muted-foreground block mb-1">Team Roster Link</span>
                  <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs text-blue-600">
                    <Link href="/team">View in Engineering Team →</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="roles" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Assigned Roles & Access Privileges</CardTitle>
            </CardHeader>
            <CardContent>
              <UserRoleDialog
                userId={user.id}
                assignedRoles={(user as any).roles || []}
                availableRoles={availableRoles}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Recent Activity Audit Trail (21 CFR Part 11)</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLogs && activityLogs.length > 0 ? (
                <div className="space-y-4">
                  {activityLogs.map((log: any) => (
                    <div key={log.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-xs">{log.action}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : ""}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.entityType} ({log.entityId})
                        {log.changeReason && (
                          <span className="italic block mt-0.5">Reason: &quot;{log.changeReason}&quot;</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground py-6 text-center text-xs">No activity logged for this user.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
