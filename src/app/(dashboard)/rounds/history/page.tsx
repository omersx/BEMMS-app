import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  getRoundHistory, getRoundCalendarData, getTeamRoundCompliance, isEngineerRoundEnabled,
} from '@/lib/actions/engineer-rounds';
import { hasRole } from '@/lib/auth/rbac';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoundHistoryClient } from '@/components/rounds/round-history-client';
import { ArrowLeft, AlertCircle, Download } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function RoundHistoryPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = session.user as any;
  const enabled = await isEngineerRoundEnabled();

  if (!enabled) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader title="Round History" />
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Feature not enabled</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isManager = hasRole(user.roles || [], 'BIOMED_MGR', 'HOSP_ADMIN', 'ORG_ADMIN', 'SYS_ADMIN');
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Fetch initial data
  const [historyResult, calendarResult, complianceResult] = await Promise.all([
    getRoundHistory({ pageSize: 20 }),
    getRoundCalendarData({ engineerId: user.id, month: currentMonth, year: currentYear }),
    isManager ? getTeamRoundCompliance() : Promise.resolve(null),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Round History" description="View past rounds and compliance">
        <div className="flex items-center gap-2">
          <a
            href="/api/admin/data/export?entities=rounds&format=xlsx"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </a>
          <Link href="/rounds">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Today
            </Button>
          </Link>
        </div>
      </PageHeader>

      <RoundHistoryClient
        initialHistory={historyResult.success ? historyResult.data || [] : []}
        initialCalendar={calendarResult.success ? calendarResult.data : null}
        initialCompliance={complianceResult?.success ? complianceResult.data : null}
        isManager={isManager}
        currentUserId={user.id}
        pagination={historyResult.success ? (historyResult as any).pagination : null}
      />
    </div>
  );
}
