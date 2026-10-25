import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTodayRound, isEngineerRoundEnabled } from '@/lib/actions/engineer-rounds';
import { hasRole } from '@/lib/auth/rbac';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StartRoundCard } from '@/components/rounds/start-round-card';
import { RoundDepartmentList } from '@/components/rounds/round-department-list';
import { History, CalendarDays, Users, AlertCircle, Coffee } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function RoundsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = session.user as any;
  const enabled = await isEngineerRoundEnabled();

  if (!enabled) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          title="Engineer's Round"
          description="Daily department rounds"
        />
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground" />
            <h3 className="font-semibold">Feature Not Enabled</h3>
            <p className="text-sm text-muted-foreground">
              The Engineer&apos;s Round feature is not enabled for your organization.
              An administrator can enable it in Organization Settings → Features.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const result = await getTodayRound();

  const isManager = hasRole(user.roles || [], 'BIOMED_MGR', 'HOSP_ADMIN', 'ORG_ADMIN', 'SYS_ADMIN');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Engineer's Round"
        description="Daily department inspection round"
      >
        <Link href="/rounds/history">
          <Button variant="outline" size="sm" className="gap-1.5">
            <History className="h-4 w-4" />
            History
          </Button>
        </Link>
      </PageHeader>

      {/* Error state */}
      {!result.success && (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
            <h3 className="font-semibold">Unable to load round</h3>
            <p className="text-sm text-muted-foreground">{result.error}</p>
          </CardContent>
        </Card>
      )}

      {/* Off day */}
      {result.success && result.isOffDay && (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <Coffee className="h-10 w-10 mx-auto text-muted-foreground" />
            <h3 className="font-semibold">Day Off</h3>
            <p className="text-sm text-muted-foreground">
              Today is not a scheduled working day. Enjoy your time off!
            </p>
            <Link href="/rounds/history">
              <Button variant="outline" size="sm" className="mt-2 gap-1.5">
                <History className="h-4 w-4" />
                View Round History
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Can start a round */}
      {result.success && result.canStart && !result.data && (
        <StartRoundCard
          hospitalId={result.hospitalId!}
          hospitalName={result.hospitalName}
          departments={result.departments || []}
          shiftType={result.shiftType || 'morning'}
        />
      )}

      {/* Round in progress or completed */}
      {result.success && result.data && (
        <RoundDepartmentList round={result.data as any} />
      )}
    </div>
  );
}
