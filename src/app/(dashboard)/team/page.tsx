import { requireAuth } from '@/lib/auth/rbac';
import { getEngineersTeam, getDepartmentCoverageMatrix } from '@/lib/actions/engineers';
import { TeamPageClient } from '@/components/team/team-page-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Engineering Team & Duty Schedule | BEMMS',
  description: 'Hospital biomedical engineering roster, on-call schedules, and department coverage.',
};

export default async function TeamPage() {
  await requireAuth();

  const [teamRes, coverageRes] = await Promise.all([
    getEngineersTeam(),
    getDepartmentCoverageMatrix(),
  ]);

  const members = teamRes.data || [];
  const stats = teamRes.stats || {
    totalEngineers: members.length,
    onDutyToday: members.filter((m) => m.dutyStatus === 'on_duty').length,
    onCallToday: members.filter((m) => m.dutyStatus === 'on_call').length,
    inMaintenanceToday: members.filter((m) => m.dutyStatus === 'in_maintenance').length,
    offDutyToday: members.filter((m) => m.dutyStatus === 'off_duty').length,
    totalActiveWorkOrders: 0,
  };
  const coverage = coverageRes.departments || [];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <TeamPageClient
        initialMembers={members}
        stats={stats}
        coverage={coverage}
      />
    </div>
  );
}
