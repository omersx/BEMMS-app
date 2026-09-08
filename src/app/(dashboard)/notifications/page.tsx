import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getNotifications, getUnreadCount } from '@/lib/actions/notifications';
import { NotificationPreferences } from '@/components/notifications/notification-preferences';
import { NotificationList } from './notification-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Sliders } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const [initialNotifications, unreadCount] = await Promise.all([
    getNotifications(50, 0),
    getUnreadCount(),
  ]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Stay updated on your equipment, tickets, and maintenance tasks.
          </p>
        </div>
      </div>

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Inbox
            {unreadCount > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-semibold">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-6">
          <NotificationList initialItems={initialNotifications} />
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}
