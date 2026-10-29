import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTodayRound, getTeamRoundCompliance, isEngineerRoundEnabled } from '@/lib/actions/engineer-rounds';
import { hasRole } from '@/lib/auth/rbac';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StartRoundCard } from '@/components/rounds/start-round-card';
import { RoundDepartmentList } from '@/components/rounds/round-department-list';
import { ManagerRoundsDashboard } from '@/components/rounds/manager-rounds-dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, AlertCircle, Coffee, Users, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function RoundsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = session.user as any;
  const enabled = await isEngineerRoundEnabled();

  if (!enabled) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
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

  const isManager = hasRole(user.roles || [], 'BIOMED_MGR', 'HOSP_ADMIN', 'ORG_ADMIN', 'SYS_ADMIN');

  const [result, complianceResult] = await Promise.all([
    getTodayRound(),
    isManager ? getTeamRoundCompliance() : Promise.resolve(null),
  ]);

  const hasOwnRound = Boolean(result.success && (result.data || result.canStart));
  const isManagerOnly = isManager && (!hasOwnRound || result.isManagerView);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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

      {/* CASE 1: Manager / Admin who does NOT have their own engineer profile */}
      {isManagerOnly && complianceResult?.success && complianceResult.data && (
        <ManagerRoundsDashboard
          compliance={complianceResult.data}
          hasOwnProfile={false}
        />
      )}

      {/* CASE 2: Manager / Admin who DOES have their own engineer profile (Tabs for My Round vs Team Monitor) */}
      {isManager && hasOwnRound && complianceResult?.success && complianceResult.data && (
        <Tabs defaultValue="team" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="team" className="gap-1.5">
              <Users className="h-4 w-4" />
              Team Rounds Today
            </TabsTrigger>
            <TabsTrigger value="mine" className="gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              My Daily Round
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="space-y-4">
            <ManagerRoundsDashboard
              compliance={complianceResult.data}
              hasOwnProfile={true}
            />
          </TabsContent>

          <TabsContent value="mine" className="space-y-4">
            {result.canStart && !result.data && (
              <StartRoundCard
                hospitalId={result.hospitalId!}
                hospitalName={result.hospitalName}
                departments={result.departments || []}
                shiftType={result.shiftType || 'morning'}
              />
            )}
            {result.data && (
              <RoundDepartmentList round={result.data as any} />
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* CASE 3: Standard Engineer (non-manager or fallback if compliance unavailable) */}
      {!isManagerOnly && !hasOwnRound && (
        <>
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
        </>
      )}

      {/* CASE 4: Standard Engineer starting or continuing their round */}
      {!isManager && hasOwnRound && (
        <>
          {result.canStart && !result.data && (
            <StartRoundCard
              hospitalId={result.hospitalId!}
              hospitalName={result.hospitalName}
              departments={result.departments || []}
              shiftType={result.shiftType || 'morning'}
            />
          )}

          {result.data && (
            <RoundDepartmentList round={result.data as any} />
          )}
        </>
      )}
    </div>
  );
}
