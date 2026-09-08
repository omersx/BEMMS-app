'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NotificationItem } from '@/components/notifications/notification-item';
import { markAsRead, markAllAsRead } from '@/lib/actions/notifications';
import { Bell, CheckCheck, Filter } from 'lucide-react';

export function NotificationList({ initialItems }: { initialItems: any[] }) {
  const [items, setItems] = useState<any[]>(initialItems);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, readAt: new Date() } : item
      )
    );
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setItems((prev) =>
      prev.map((item) => ({ ...item, readAt: item.readAt || new Date() }))
    );
  };

  const filteredItems = filterUnreadOnly
    ? items.filter((item) => !item.readAt)
    : items;

  const unreadCount = items.filter((item) => !item.readAt).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <Button
            variant={filterUnreadOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
            className="text-xs h-8 min-h-[36px]"
          >
            <Filter className="h-3.5 w-3.5 mr-1" />
            {filterUnreadOnly ? 'Showing Unread' : 'All Notifications'}
          </Button>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} unread
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            className="text-xs h-8 min-h-[36px] gap-1"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="font-medium text-base">No notifications</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {filterUnreadOnly
                ? 'You have caught up with all unread notifications.'
                : 'You do not have any notifications yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-2 sm:p-4 divide-y">
            {filteredItems.map((item) => (
              <NotificationItem
                key={item.id}
                id={item.id}
                notificationType={item.notificationType}
                title={item.title}
                body={item.body}
                actionUrl={item.actionUrl}
                readAt={item.readAt}
                createdAt={item.createdAt}
                onMarkRead={handleMarkRead}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
