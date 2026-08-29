import { getUserById } from "@/lib/actions/users"
import { getAuditLogs } from "@/lib/actions/audit-logs"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Edit, UserX, UserCheck, Archive } from "lucide-react"

export default async function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const result = await getUserById(userId)
  const user = result?.success ? result.data : null

  if (!user) {
    return <div>User not found</div>
  }

  const logsResult = await getAuditLogs({ actorId: userId, pageSize: 10 })
  const activityLogs = (logsResult?.success && logsResult.data) ? logsResult.data : []

  return (
    <div className="space-y-6">
      <PageHeader 
        title={user.fullName} 
        description={user.email}
      >
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/users/${user.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
          {user.accountStatus === 'active' ? (
            <Button variant="destructive">
              <UserX className="w-4 h-4 mr-2" />
              Deactivate
            </Button>
          ) : (
            <Button variant="default" className="bg-green-600 hover:bg-green-700">
              <UserCheck className="w-4 h-4 mr-2" />
              Reactivate
            </Button>
          )}
        </div>
      </PageHeader>
      
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="roles">Roles & Access</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader><CardTitle>User Information</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <span className="font-medium text-muted-foreground block mb-1">Status</span>
                <StatusBadge status={user.accountStatus} />
              </div>
              <div>
                <span className="font-medium text-muted-foreground block mb-1">Employee ID</span>
                <span>{user.employeeIdentifier || "N/A"}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground block mb-1">Job Title</span>
                <span>{user.jobTitle || "N/A"}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground block mb-1">Phone</span>
                <span>{user.phone || "N/A"}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground block mb-1">Organization</span>
                <span>{(user as any).organization?.name || user.organizationId || "N/A"}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground block mb-1">Last Login</span>
                <span>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="roles" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Assigned Roles</CardTitle>
              <Button size="sm">Add Role</Button>
            </CardHeader>
            <CardContent>
              {(user as any).roles && (user as any).roles.length > 0 ? (
                <div className="space-y-4">
                  {(user as any).roles.map((role: any) => (
                    <div key={role.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div>
                        <div className="font-medium">{role.name}</div>
                        <div className="text-sm text-muted-foreground">{role.description}</div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground py-4 text-center">No roles assigned.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
              {activityLogs && activityLogs.length > 0 ? (
                <div className="space-y-4">
                  {activityLogs.map((log: any) => (
                    <div key={log.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">{log.action}</span>
                        <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                      </div>
                      <div className="text-sm">
                        {log.entityType} ({log.entityId})
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground py-4 text-center">No recent activity.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
