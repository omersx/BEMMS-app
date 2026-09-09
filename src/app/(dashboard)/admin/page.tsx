import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { Building2, Hospital, Users, Shield } from "lucide-react";

export default function AdminDashboardPage() {
  const stats = [
    { title: "Health System", value: "1", icon: Building2 },
    { title: "Hospital Campuses", value: "1", icon: Hospital },
    { title: "Total Roles", value: "6", icon: Shield },
    { title: "Total Users", value: "1", icon: Users },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" description="Overview of the BEMMS platform">
        <Button asChild>
          <Link href="/admin/general">General Settings</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/hospitals/new">Add Hospital</Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
             <Button variant="ghost" className="justify-start" asChild>
                <Link href="/admin/users/invite">Invite User</Link>
             </Button>
             <Button variant="ghost" className="justify-start" asChild>
                <Link href="/admin/roles/new">Create Role</Link>
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
