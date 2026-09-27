import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDepartmentsOverview } from '@/lib/actions/departments';
import { PageHeader } from '@/components/shared/page-header';
import { DepartmentCardsView } from '@/components/departments/department-cards-view';
import { Button } from '@/components/ui/button';
import { Plus, QrCode } from 'lucide-react';
import Link from 'next/link';
import { hasRole } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

export default async function DepartmentsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = session.user as { roles?: string[] };
  const isAdmin = hasRole(user.roles || [], 'SYS_ADMIN', 'ORG_ADMIN', 'HOSP_ADMIN');

  const result = await getDepartmentsOverview();
  const departments = result.success && result.data ? result.data.departments : [];
  const hospitals = result.success && result.data ? result.data.hospitals : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Departments"
        description="Browse clinical departments, equipment health, and device allocations"
      >
        <div className="flex gap-2">
          <Button asChild variant="outline" className="min-h-[44px]">
            <Link href="/scan">
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR
            </Link>
          </Button>
          {isAdmin && (
            <Button asChild className="min-h-[44px]">
              <Link href="/departments/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Department
              </Link>
            </Button>
          )}
        </div>
      </PageHeader>

      <DepartmentCardsView departments={departments} hospitals={hospitals} />
    </div>
  );
}
