'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, TicketCheck, Wrench, Monitor, AlertTriangle } from 'lucide-react';
import {
  playNotificationSound,
  playUrgentNotificationSound,
  unlockAudio,
  showNativeNotification,
  requestNativeNotificationPermission,
} from '@/lib/utils/sound';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { NavBadge } from '@/components/layout/nav-badge';
import { NotificationItem } from './notification-item';
import { getNotifications, markAsRead, markAllAsRead } from '@/lib/actions/notifications';

// ── Toast Component ──────────────────────────────────────────────────────────────

function NotificationToast({
  notification,
  onDismiss,
}: {
  notification: { title: string; body: string; actionUrl?: string; notificationType?: string };
  onDismiss: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getIcon = () => {
    const type = notification.notificationType || '';
    if (type.startsWith('ticket_')) return <TicketCheck className="h-5 w-5 text-blue-500" />;
    if (type.startsWith('pm_') || type.startsWith('task_')) return <Wrench className="h-5 w-5 text-purple-500" />;
    if (type.startsWith('device_')) return <Monitor className="h-5 w-5 text-green-500" />;
    if (type === 'sla_warning') return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    return <Bell className="h-5 w-5 text-primary" />;
  };

  const isCritical = notification.title.includes('🚨') || notification.title.includes('URGENT');

  return (
    <div
      className={`fixed top-4 right-4 z-[100] max-w-sm w-full animate-in slide-in-from-top-2 fade-in duration-300 cursor-pointer ${
        isCritical
          ? 'bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-800'
          : 'bg-card border'
      } rounded-lg shadow-lg p-4`}
      onClick={() => {
        if (notification.actionUrl) {
          router.push(notification.actionUrl);
        }
        onDismiss();
      }}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-tight ${isCritical ? 'text-red-800 dark:text-red-200' : ''}`}>
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.body}
          </p>
          {notification.actionUrl && (
            <p className="text-xs text-primary mt-1.5 font-medium">
              Tap to view →
            </p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="shrink-0 text-muted-foreground hover:text-foreground text-xs p-1"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ── Main Notification Bell ───────────────────────────────────────────────────────

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    title: string; body: string; actionUrl?: string; notificationType?: string;
  } | null>(null);
  const toastQueueRef = useRef<Array<typeof toast>>([]);
  const showingToastRef = useRef(false);

  // Show next toast from queue
  const showNextToast = useCallback(() => {
    if (toastQueueRef.current.length === 0) {
      showingToastRef.current = false;
      return;
    }
    showingToastRef.current = true;
    const next = toastQueueRef.current.shift()!;
    setToast(next);
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
    // Small delay before showing next queued toast
    setTimeout(showNextToast, 300);
  }, [showNextToast]);

  const queueToast = useCallback((notif: NonNullable<typeof toast>) => {
    toastQueueRef.current.push(notif);
    if (!showingToastRef.current) {
      showNextToast();
    }
  }, [showNextToast]);

  // Unlock Web Audio API & request native notification permission on first user interaction for desktop & mobile
  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockAudio();
      requestNativeNotificationPermission().catch(() => {});
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // SSE connection for real-time unread count + new notification events
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

          // Real-time toast for new notifications
          if (data.type === 'new_notifications' && Array.isArray(data.notifications)) {
            let hasCritical = false;
            data.notifications.forEach((notif: any) => {
              const isItemCritical = notif.title?.includes('🚨') || notif.title?.includes('URGENT');
              if (isItemCritical) {
                hasCritical = true;
              }
              queueToast({
                title: notif.title,
                body: notif.body,
                actionUrl: notif.actionUrl || undefined,
                notificationType: notif.notificationType,
              });
              // Show native OS notification (desktop notification center / mobile notification drawer)
              showNativeNotification({
                title: notif.title,
                body: notif.body,
                actionUrl: notif.actionUrl || undefined,
                isCritical: isItemCritical,
              }).catch(() => {});
            });

            // Play notification sound (urgent alarm for critical, chime for normal)
            if (data.notifications.length > 0) {
              if (hasCritical) {
                playUrgentNotificationSound();
              } else {
                playNotificationSound();
              }
            }

            // Dispatch global event for live page sync (ticket detail, tickets list, etc.)
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('bemms:notification', { detail: data.notifications })
              );
            }
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

    // Also listen for service worker push messages for instant toast
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_RECEIVED') {
        const notif = event.data.notification;
        if (notif) {
          queueToast({
            title: notif.title,
            body: notif.body,
            actionUrl: notif.url || undefined,
            notificationType: notif.data?.type,
          });
          // Bump unread count immediately
          setUnreadCount((prev) => prev + 1);

          // Play notification sound for push-received notifications
          const isCritical =
            notif.data?.priority === 'p1_critical' ||
            notif.data?.impact === 'patient_care_affected' ||
            notif.title?.includes('🚨') ||
            notif.title?.includes('URGENT');
          if (isCritical) {
            playUrgentNotificationSound();
          } else {
            playNotificationSound();
          }

          // Show native OS notification if not in background
          showNativeNotification({
            title: notif.title,
            body: notif.body,
            actionUrl: notif.url || undefined,
            isCritical,
          }).catch(() => {});

          // Dispatch global event for live page sync
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('bemms:notification', { detail: [notif] })
            );
          }
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    return () => {
      eventSource?.close();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, [queueToast]);

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
    <>
      {/* Toast Notification */}
      {toast && (
        <NotificationToast notification={toast} onDismiss={dismissToast} />
      )}

      {/* Bell Button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative min-h-[44px] min-w-[44px]">
            <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-pulse' : ''}`} />
            <NavBadge
              type="count"
              value={unreadCount}
              variant="default"
              position="icon-corner"
              maxCount={99}
              hideWhenZero={true}
              ariaLabel={`${unreadCount} unread notifications`}
            />
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
    </>
  );
}
