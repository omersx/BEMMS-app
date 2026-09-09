import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getDepartmentDetails } from '@/lib/actions/departments';
import { DepartmentDetailView } from '@/components/departments/department-detail-view';
import { hasRole } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

export default async function DepartmentPage({
  params,
}: {
  params: Promise<{ deptId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { deptId } = await params;
  const result = await getDepartmentDetails(deptId);

  if (!result.success || !result.data) {
    notFound();
  }

  const user = session.user as { roles?: string[] };
  const isAdmin = hasRole(user.roles || [], 'SYS_ADMIN', 'ORG_ADMIN', 'HOSP_ADMIN');

  const { department, devices, tickets, locations, stats } = result.data;

  return (
    <DepartmentDetailView
      department={department}
      devices={devices}
      tickets={tickets}
      locations={locations}
      stats={stats}
      isAdmin={isAdmin}
    />
  );
}
