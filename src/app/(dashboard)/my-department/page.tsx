import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { devices, departments, userAccessScopes, serviceTickets, hospitals } from '@/lib/db/schema';
import { eq, and, inArray, ne, not, desc, sql } from 'drizzle-orm';
import { PageHeader } from '@/components/shared/page-header';
import { MyDepartmentView } from '@/components/departments/my-department-view';

export const dynamic = 'force-dynamic';

export default async function MyDepartmentPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = session.user as {
    id: string;
    organizationId: string | null;
    roles: string[];
  };

  const orgId = user.organizationId;
  if (!orgId) redirect('/dashboard');

  // Get user's department scopes
  const scopes = await db.query.userAccessScopes.findMany({
    where: eq(userAccessScopes.userId, user.id),
  });

  const deptIds = scopes
    .map((s) => s.departmentId)
    .filter(Boolean) as string[];

  // If user has no department scopes, try to find their department from the first scope
  // or redirect to dashboard
  if (deptIds.length === 0) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <PageHeader
          title="My Department"
          description="Your department equipment and status"
        />
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">
            You are not currently assigned to a department.
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Contact your administrator to assign you to a department.
          </p>
        </div>
      </div>
    );
  }

  // Get department info
  const dept = await db.query.departments.findFirst({
    where: eq(departments.id, deptIds[0]),
    with: {
      hospital: true,
    },
  });

  // Get department devices with related data
  const deptDevices = await db.query.devices.findMany({
    where: and(
      eq(devices.organizationId, orgId),
      inArray(devices.departmentId, deptIds)
    ),
    with: {
      department: true,
      location: true,
      deviceCategory: true,
      manufacturer: true,
    },
    orderBy: [desc(devices.currentStatusCode), desc(devices.updatedAt)],
  });

  // Get active tickets for department devices
  const deviceIds = deptDevices.map((d) => d.id);
  let activeTickets: any[] = [];
  if (deviceIds.length > 0) {
    activeTickets = await db.query.serviceTickets.findMany({
      where: and(
        eq(serviceTickets.organizationId, orgId),
        inArray(serviceTickets.deviceId, deviceIds),
        not(
          inArray(serviceTickets.statusCode, [
            'resolved',
            'closed',
            'cancelled',
          ])
        )
      ),
      columns: {
        id: true,
        ticketNumber: true,
        title: true,
        statusCode: true,
        deviceId: true,
      },
    });
  }

  // Compute summary stats
  const stats = {
    total: deptDevices.length,
    operational: deptDevices.filter(
      (d) => d.currentStatusCode === 'operational'
    ).length,
    underMaintenance: deptDevices.filter((d) =>
      [
        'under_repair',
        'under_maintenance',
        'waiting_for_parts',
        'under_investigation',
      ].includes(d.currentStatusCode)
    ).length,
    outOfService: deptDevices.filter((d) =>
      ['out_of_service', 'decommissioned'].includes(d.currentStatusCode)
    ).length,
  };

  // Build ticket map keyed by deviceId
  const ticketsByDevice: Record<string, typeof activeTickets> = {};
  activeTickets.forEach((t) => {
    if (t.deviceId) {
      if (!ticketsByDevice[t.deviceId]) ticketsByDevice[t.deviceId] = [];
      ticketsByDevice[t.deviceId].push(t);
    }
  });

  return (
    <MyDepartmentView
      department={{
        name: dept?.name || 'My Department',
        hospitalName: (dept as any)?.hospital?.name || '',
      }}
      devices={deptDevices.map((d) => ({
        id: d.id,
        name: d.name,
        assetNumber: d.assetNumber,
        currentStatusCode: d.currentStatusCode,
        locationName:
          (d as any).location?.name || d.exactLocationDescription || '',
        categoryName: (d as any).deviceCategory?.name || '',
        manufacturerName: (d as any).manufacturer?.name || '',
        activeTickets: ticketsByDevice[d.id] || [],
      }))}
      stats={stats}
    />
  );
}
