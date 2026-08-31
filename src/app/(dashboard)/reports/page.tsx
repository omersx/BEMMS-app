import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Monitor, TicketCheck, Wrench, DollarSign, Users,
  History, ArrowRight,
} from 'lucide-react';

const reportTypes = [
  {
    title: 'Inventory Report',
    description: 'Devices by status, department, category, and manufacturer',
    href: '/reports/inventory',
    icon: Monitor,
    color: 'text-blue-500',
  },
  {
    title: 'Ticket Performance',
    description: 'Response times, priorities, backlog, and resolution rates',
    href: '/reports/tickets',
    icon: TicketCheck,
    color: 'text-orange-500',
  },
  {
    title: 'PM Compliance',
    description: 'Preventive maintenance completion rates and overdue items',
    href: '/reports/maintenance',
    icon: Wrench,
    color: 'text-green-500',
  },
  {
    title: 'Maintenance Costs',
    description: 'Parts, vendor services, and labor costs by device and department',
    href: '/reports/costs',
    icon: DollarSign,
    color: 'text-purple-500',
  },
  {
    title: 'Engineer Workload',
    description: 'Task distribution, resolution times, and PM completion',
    href: '/reports/workload',
    icon: Users,
    color: 'text-teal-500',
  },
];

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">
          Operational statistics and compliance reports
        </p>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="live" className="flex-1 md:flex-none min-h-[44px]">
            Live Statistics
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 md:flex-none min-h-[44px]">
            Report History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {reportTypes.map((report) => (
              <Link key={report.href} href={report.href} className="block">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${report.color}`}>
                          <report.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{report.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {report.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardContent className="py-12 text-center">
              <History className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">Report History</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                Generated report snapshots will appear here after you export a report.
              </p>
              <Link
                href="/reports/history"
                className="text-primary text-sm hover:underline mt-4 inline-block"
              >
                View all report history →
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
