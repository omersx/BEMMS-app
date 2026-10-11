import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getEngineersTeam } from '@/lib/actions/engineers';
import { PageHeader } from '@/components/shared/page-header';
import { StaffEngineerTeamView } from '@/components/team/staff-engineer-team-view';

export const dynamic = 'force-dynamic';

export default async function EngineeringTeamPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const teamRes = await getEngineersTeam();
  const members = teamRes.data || [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Our Engineering Team"
        description="Biomedical engineers available to support your department"
      />
      <StaffEngineerTeamView engineers={members} />
    </div>
  );
}
