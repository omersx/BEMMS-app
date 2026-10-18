'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Auto-refreshes the tickets list view when new ticket notifications arrive,
 * or periodically when the tab is visible.
 */
export function TicketListAutoRefresh({ pollIntervalMs = 10000 }: { pollIntervalMs?: number }) {
  const router = useRouter();
  const lastRefreshRef = useRef(Date.now());

  const triggerRefresh = () => {
    const now = Date.now();
    if (now - lastRefreshRef.current < 3000) return;
    lastRefreshRef.current = now;
    router.refresh();
  };

  useEffect(() => {
    // 1. Listen for global notification event from NotificationBell
    const handleNotification = (event: Event) => {
      const customEvent = event as CustomEvent<any[]>;
      const notifs = customEvent.detail;
      if (!Array.isArray(notifs)) return;

      const hasTicketEvent = notifs.some(
        (n) =>
          n.relatedEntityType === 'service_ticket' ||
          (n.notificationType && n.notificationType.startsWith('ticket_'))
      );

      if (hasTicketEvent) {
        triggerRefresh();
      }
    };

    window.addEventListener('bemms:notification', handleNotification);

    // 2. Periodic refresh when tab is visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        triggerRefresh();
      }
    }, pollIntervalMs);

    return () => {
      window.removeEventListener('bemms:notification', handleNotification);
      clearInterval(interval);
    };
  }, [router, pollIntervalMs]);

  return null;
}
