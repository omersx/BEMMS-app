import { getPermissionsMatrix } from "@/lib/actions/roles"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, ShieldAlert, ShieldCheck, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  SYS_ADMIN: ['DEVICES', 'REPORTS', 'ADMIN', 'AUDIT'],
  ORG_ADMIN: ['DEVICES', 'REPORTS', 'ADMIN', 'AUDIT'],
  HOSP_ADMIN: ['DEVICES', 'REPORTS', 'ADMIN', 'AUDIT'],
  BIOMED_MGR: ['DEVICES', 'TICKETS', 'MAINTENANCE', 'PM_CALIBRATION', 'SIGNATURES', 'REPORTS', 'AUDIT'],
  BIOMED_ENG: ['DEVICES', 'TICKETS', 'MAINTENANCE', 'PM_CALIBRATION', 'SIGNATURES', 'REPORTS'],
  BIOMED_TECH: ['DEVICES', 'TICKETS', 'MAINTENANCE', 'PM_CALIBRATION', 'REPORTS'],
  DEPT_MGR: ['DEVICES', 'TICKETS', 'REPORTS'],
  STAFF: ['DEVICES', 'TICKETS'],
  AUDITOR: ['DEVICES', 'TICKETS', 'MAINTENANCE', 'PM_CALIBRATION', 'SIGNATURES', 'REPORTS', 'AUDIT'],
}

const ROLE_DESCRIPTIONS: Record<string, { label: string; boundary: string }> = {
  SYS_ADMIN: { label: "System Administrator", boundary: "Platform settings, users, and audit logs. No clinical sign-off authority." },
  ORG_ADMIN: { label: "Organization Admin", boundary: "Health system administration and hospital configuration." },
  HOSP_ADMIN: { label: "Hospital Admin", boundary: "Facility-level administrative operations and departmental oversight." },
  BIOMED_MGR: { label: "Biomedical Manager", boundary: "Clinical engineering supervisor; reviews evidence and releases critical devices." },
  BIOMED_ENG: { label: "Biomedical Engineer", boundary: "Triage, diagnosis, work execution, test recording, and performer signatures." },
  BIOMED_TECH: { label: "Biomedical Technician", boundary: "Routine maintenance and ticket handling. Cannot sign release for critical equipment." },
  DEPT_MGR: { label: "Department Manager", boundary: "Departmental request tracking and operational asset awareness." },
  STAFF: { label: "Clinical Staff / Doctor", boundary: "QR device lookup, issue reporting, and requester ticket tracking." },
  AUDITOR: { label: "Quality / Compliance Auditor", boundary: "Immutable read-only access to audit logs, histories, and signatures." },
}

export default async function RolesPage() {
  const result = await getPermissionsMatrix()
  const rolePerms = (result?.success && Array.isArray(result.data)) ? result.data : []

  const roles = ['SYS_ADMIN', 'ORG_ADMIN', 'HOSP_ADMIN', 'BIOMED_MGR', 'BIOMED_ENG', 'BIOMED_TECH', 'DEPT_MGR', 'STAFF', 'AUDITOR']
  const modules = ['DEVICES', 'TICKETS', 'MAINTENANCE', 'PM_CALIBRATION', 'SIGNATURES', 'REPORTS', 'ADMIN', 'AUDIT']

  // Helper to check if a role has a module permission
  const hasPermission = (roleCode: string, moduleName: string) => {
    // Separation of Duties (Section 3.3 / Rule 8):
    // System Administrators manage infrastructure and users, but CANNOT sign maintenance records or release medical devices
    if ((roleCode === 'SYS_ADMIN' || roleCode === 'ORG_ADMIN' || roleCode === 'HOSP_ADMIN') && 
        (moduleName === 'SIGNATURES' || moduleName === 'MAINTENANCE')) {
      return false
    }

    const hasDbGrant = rolePerms.some((rp: any) => 
      rp.role?.code === roleCode && 
      rp.permission?.module?.toUpperCase() === moduleName.toUpperCase()
    )
    if (hasDbGrant) return true

    // Fall back to documented clinical RBAC matrix
    return DEFAULT_ROLE_PERMISSIONS[roleCode]?.includes(moduleName) ?? false
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Roles & Permissions Matrix" 
        description="Role-based access control (RBAC) governance and clinical separation of duties" 
      />

      {/* ── Governance & Separation of Duties Compliance Notice ── */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-2">
        <div className="flex items-center gap-2 text-blue-900 font-semibold text-sm">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <span>Separation of Duties Policy (21 CFR Part 11 / BEMMS Section 3.3)</span>
        </div>
        <p className="text-xs text-blue-800 leading-relaxed">
          In compliance with medical device regulatory standards, administrative privileges are strictly decoupled from clinical engineering authorities. <strong>System Administrators</strong> manage accounts, security, and catalog settings, but cannot execute maintenance records or sign device release approvals without a verified biomedical engineering credential.
        </p>
      </div>

      {/* ── Role Permission Matrix Table ── */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-semibold">System Module Access Matrix</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">Role</th>
                {modules.map((mod: string) => (
                  <th key={mod} className="px-3 py-3 font-medium text-center">{mod}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {roles.map((role: string) => (
                <tr key={role} className="hover:bg-muted/30">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-sm">{role}</div>
                    <div className="text-xs text-muted-foreground">
                      {ROLE_DESCRIPTIONS[role]?.label || role}
                    </div>
                  </td>
                  {modules.map((mod: string) => {
                    const granted = hasPermission(role, mod)
                    const isProtectedClinical = (role.includes('ADMIN') && (mod === 'SIGNATURES' || mod === 'MAINTENANCE'))

                    return (
                      <td key={`${role}-${mod}`} className="px-3 py-3.5 text-center">
                        {granted ? (
                          <div className="inline-flex items-center justify-center p-1 rounded bg-green-50 text-green-600">
                            <Check className="w-4 h-4" />
                          </div>
                        ) : isProtectedClinical ? (
                          <div className="inline-flex items-center justify-center p-1 rounded bg-red-50 text-red-400" title="Restricted by Separation of Duties policy">
                            <X className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center p-1 text-muted-foreground/30">
                            <X className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ── Role Boundaries Legend ── */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            Role Safety Boundaries & Delegations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {roles.map((role) => (
            <div key={role} className="p-3 rounded-lg border bg-muted/20 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary">{role}</span>
                <span className="text-xs text-muted-foreground font-medium">({ROLE_DESCRIPTIONS[role]?.label})</span>
              </div>
              <p className="text-xs text-muted-foreground leading-normal">
                {ROLE_DESCRIPTIONS[role]?.boundary}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
