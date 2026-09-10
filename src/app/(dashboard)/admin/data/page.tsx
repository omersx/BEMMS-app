import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/auth/rbac';
import { getExportSummary } from '@/lib/actions/data-management';
import { DataManagementTabs } from '@/components/admin/data-management/data-management-tabs';

export default async function AdminDataManagementPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  try {
    await requireRole('SYS_ADMIN', 'ORG_ADMIN', 'BIOMED_MGR');
  } catch {
    redirect('/dashboard');
  }

  const summaryRes = await getExportSummary();
  const summary = summaryRes.success && summaryRes.data
    ? summaryRes.data
    : {
        devices: 0,
        departments: 0,
        categories: 0,
        manufacturers: 0,
        tickets: 0,
        auditLogs: 0,
      };

  return (
    <div className="space-y-6">
      <DataManagementTabs summary={summary} />
    </div>
  );
}
