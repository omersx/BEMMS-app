import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { hasRole } from '@/lib/auth/rbac';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Monitor,
  QrCode,
  TicketCheck,
  PlusCircle,
  AlertTriangle,
  Wrench,
  ClipboardList,
  Calendar,
  CheckSquare,
  BarChart3,
  Bell,
  Users,
  Building2,
  Building,
  ShieldCheck,
  ChevronRight,
  User,
} from 'lucide-react';

export default async function MorePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = session.user as {
    id: string;
    fullName?: string;
    email?: string;
    roles?: string[];
  };

  const roles = user.roles || [];
  const isAdmin = hasRole(roles, 'SYS_ADMIN', 'ORG_ADMIN', 'HOSP_ADMIN');
  const isBiomed = hasRole(roles, 'BIOMED_ENG', 'BIOMED_TECH', 'BIOMED_MGR');

  const sections = [
    {
      title: 'Equipment & Helpdesk',
      items: [
        {
          label: 'Device Inventory',
          description: 'Browse, search, and manage all biomedical equipment',
          href: '/devices',
          icon: Monitor,
          color: 'text-blue-500 bg-blue-50 dark:bg-blue-950',
        },
        {
          label: 'Scan QR Code',
          description: 'Quick scan device label with camera',
          href: '/scan',
          icon: QrCode,
          color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950',
        },
        {
          label: 'Helpdesk Tickets',
          description: 'View service tickets, fault reports, and status',
          href: '/tickets',
          icon: TicketCheck,
          color: 'text-orange-500 bg-orange-50 dark:bg-orange-950',
        },
        {
          label: 'Report a Problem',
          description: 'Submit an equipment issue or service request',
          href: '/tickets/create',
          icon: PlusCircle,
          color: 'text-red-500 bg-red-50 dark:bg-red-950',
        },
        ...(isBiomed || isAdmin
          ? [
              {
                label: 'Triage Queue',
                description: 'Review, prioritize, and assign new incoming tickets',
                href: '/tickets/triage',
                icon: AlertTriangle,
                color: 'text-amber-500 bg-amber-50 dark:bg-amber-950',
              },
            ]
          : []),
      ],
    },
    {
      title: 'Maintenance & Work Orders',
      items: [
        {
          label: 'Maintenance Overview',
          description: 'Corrective and preventive maintenance hub',
          href: '/maintenance',
          icon: Wrench,
          color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950',
        },
        {
          label: 'Work Orders / Tasks',
          description: 'Assigned maintenance tasks and due schedules',
          href: '/maintenance/tasks',
          icon: ClipboardList,
          color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950',
        },
        {
          label: 'PM Plans & Schedules',
          description: 'Recurring inspection and calibration schedules',
          href: '/maintenance/plans',
          icon: Calendar,
          color: 'text-violet-500 bg-violet-50 dark:bg-violet-950',
        },
        {
          label: 'Checklists',
          description: 'Standardized safety and inspection checklists',
          href: '/maintenance/checklists',
          icon: CheckSquare,
          color: 'text-teal-500 bg-teal-50 dark:bg-teal-950',
        },
      ],
    },
    {
      title: 'Analytics & Notifications',
      items: [
        {
          label: 'Reports & Compliance',
          description: 'Inventory, tickets, PM compliance, workload & cost reports',
          href: '/reports',
          icon: BarChart3,
          color: 'text-rose-500 bg-rose-50 dark:bg-rose-950',
        },
        {
          label: 'Notifications',
          description: 'Alerts, updates, and notification settings',
          href: '/notifications',
          icon: Bell,
          color: 'text-amber-500 bg-amber-50 dark:bg-amber-950',
        },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: 'System Administration',
            items: [
              {
                label: 'Users & Roles',
                description: 'Manage staff, engineers, and permissions',
                href: '/admin/users',
                icon: Users,
                color: 'text-purple-500 bg-purple-50 dark:bg-purple-950',
              },
              {
                label: 'Hospitals',
                description: 'Manage hospital facilities and campuses',
                href: '/admin/hospitals',
                icon: Building2,
                color: 'text-blue-500 bg-blue-50 dark:bg-blue-950',
              },
              {
                label: 'Departments',
                description: 'Manage hospital departments and units',
                href: '/admin/departments',
                icon: Building,
                color: 'text-sky-500 bg-sky-50 dark:bg-sky-950',
              },
              {
                label: 'Organizations',
                description: 'Manage multi-tenant health system organizations',
                href: '/admin/organizations',
                icon: ShieldCheck,
                color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950',
              },
              {
                label: 'Audit Logs',
                description: 'Electronic signatures and traceability logs',
                href: '/admin/audit-logs',
                icon: ClipboardList,
                color: 'text-stone-500 bg-stone-50 dark:bg-stone-950',
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-8">
      {/* User Card */}
      <Card className="border shadow-sm">
        <CardContent className="p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
            {user.fullName?.charAt(0) || <User className="w-6 h-6" />}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <h2 className="font-semibold text-base truncate">{user.fullName || 'User'}</h2>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {roles.map((role) => (
                <Badge key={role} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {role.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.title} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            {section.title}
          </h3>
          <div className="bg-card rounded-xl border divide-y overflow-hidden shadow-sm">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-muted/50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-lg shrink-0 ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm leading-snug">{item.label}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
