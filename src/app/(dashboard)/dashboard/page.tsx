import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Monitor, TicketCheck, Wrench, AlertTriangle, Plus } from 'lucide-react'

export default function DashboardPage() {
  const user = { name: 'Dr. Smith', roles: ['Admin', 'Clinical Engineer'] }

  const stats = [
    { title: 'Total Devices', value: '0', icon: Monitor, color: 'text-blue-500' },
    { title: 'Open Tickets', value: '0', icon: TicketCheck, color: 'text-orange-500' },
    { title: 'Maintenance Due', value: '0', icon: Wrench, color: 'text-yellow-500' },
    { title: 'Out of Service', value: '0', icon: AlertTriangle, color: 'text-red-500' },
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name}</h1>
        <p className="text-muted-foreground mt-1">
          Role: {user.roles.join(', ')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
          <Button variant="outline">
            <Monitor className="mr-2 h-4 w-4" />
            Add Device
          </Button>
        </div>
      </div>
    </div>
  )
}