'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { NotificationItem } from './notification-item';
import { getNotifications, markAsRead, markAllAsRead } from '@/lib/actions/notifications';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // SSE connection for real-time unread count
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connect = () => {
      eventSource = new EventSource('/api/notifications/sse');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'unread_count') {
            setUnreadCount(data.count);
          }
        } catch (e) {
          // Ignore parse errors
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        // Reconnect after 30 seconds
        setTimeout(connect, 30000);
      };
    };

    connect();

    return () => {
      eventSource?.close();
    };
  }, []);

  // Load notifications when popover opens
  const loadNotifications = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await getNotifications(10, 0);
      setItems(data);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, readAt: new Date() } : item
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setItems((prev) =>
      prev.map((item) => ({ ...item, readAt: item.readAt || new Date() }))
    );
    setUnreadCount(0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative min-h-[44px] min-w-[44px]">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center p-0 px-1 rounded-full text-[10px]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 gap-1"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => (
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
            </div>
          )}
        </div>

        <div className="border-t px-4 py-2">
          <Link
            href="/notifications"
            className="text-xs text-primary hover:underline"
            onClick={() => setOpen(false)}
          >
            View all notifications →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
