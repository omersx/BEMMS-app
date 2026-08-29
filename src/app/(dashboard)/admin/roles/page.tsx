import { getPermissionsMatrix } from "@/lib/actions/roles"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Check, X } from "lucide-react"

export default async function RolesPage() {
  const result = await getPermissionsMatrix()
  const rolePerms = (result?.success && Array.isArray(result.data)) ? result.data : []

  const roles = ['SYS_ADMIN', 'ORG_ADMIN', 'HOSP_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG', 'BIOMED_TECH', 'DEPT_MGR', 'STAFF', 'AUDITOR']
  const modules = ['DEVICES', 'TICKETS', 'MAINTENANCE', 'PM_CALIBRATION', 'SIGNATURES', 'REPORTS', 'ADMIN', 'AUDIT']

  // Helper to check if a role has a module permission
  const hasPermission = (roleCode: string, moduleName: string) => {
    if (roleCode === 'SYS_ADMIN') return true
    return rolePerms.some((rp: any) => rp.role?.code === roleCode && rp.permission?.module === moduleName)
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Roles & Permissions" 
        description="View system roles and their assigned access privileges" 
      />
      
      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">Role</th>
                {modules.map((mod: string) => (
                  <th key={mod} className="px-6 py-3 font-medium text-center">{mod}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {roles.map((role: string) => (
                <tr key={role} className="hover:bg-muted/30">
                  <td className="px-6 py-4 font-medium">{role}</td>
                  {modules.map((mod: string) => (
                    <td key={`${role}-${mod}`} className="px-6 py-4 text-center">
                      {hasPermission(role, mod) ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
