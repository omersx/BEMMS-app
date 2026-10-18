'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface TicketAutoRefreshProps {
  ticketId: string;
  initialUpdatedAt?: string | Date | null;
  initialStatusCode?: string;
  initialCommentCount?: number;
  initialAssignedEngineerUserId?: string | null;
  pollIntervalMs?: number;
}

/**
 * Live synchronization component for the ticket detail view.
 * 
 * Provides instantaneous updates without full page reload:
 * 1. Listens for window 'bemms:notification' events dispatched by NotificationBell (SSE & Push).
 * 2. Directly connects to SSE as a fallback stream for instant pushes.
 * 3. Fast-polls /api/tickets/[id]/live-sync (default 3.5s) when the tab is visible.
 * 4. Refreshes immediately when the user switches back to this browser tab.
 */
export function TicketAutoRefresh({
  ticketId,
  initialUpdatedAt,
  initialStatusCode,
  initialCommentCount = 0,
  initialAssignedEngineerUserId,
  pollIntervalMs = 3500,
}: TicketAutoRefreshProps) {
  const router = useRouter();

  const lastKnownRef = useRef({
    updatedAt: initialUpdatedAt ? new Date(initialUpdatedAt).toISOString() : '',
    statusCode: initialStatusCode || '',
    commentCount: initialCommentCount,
    assignedEngineerUserId: initialAssignedEngineerUserId || null,
  });

  const lastRefreshTimestampRef = useRef<number>(Date.now());
  const isRefreshingRef = useRef<boolean>(false);

  // Sync ref with server props whenever page re-renders
  useEffect(() => {
    lastKnownRef.current = {
      updatedAt: initialUpdatedAt ? new Date(initialUpdatedAt).toISOString() : '',
      statusCode: initialStatusCode || '',
      commentCount: initialCommentCount,
      assignedEngineerUserId: initialAssignedEngineerUserId || null,
    };
    isRefreshingRef.current = false;
  }, [initialUpdatedAt, initialStatusCode, initialCommentCount, initialAssignedEngineerUserId]);

  // Safe throttled refresh
  const triggerRefresh = () => {
    const now = Date.now();
    if (now - lastRefreshTimestampRef.current < 1500) {
      return;
    }
    lastRefreshTimestampRef.current = now;
    isRefreshingRef.current = true;
    router.refresh();
  };

  // 1. Listen for local notification events dispatched from NotificationBell
  useEffect(() => {
    const handleNotification = (event: Event) => {
      const customEvent = event as CustomEvent<any[]>;
      const notifications = customEvent.detail;
      if (!Array.isArray(notifications)) return;

      const isForThisTicket = notifications.some(
        (n) =>
          (n.relatedEntityType === 'service_ticket' && n.relatedEntityId === ticketId) ||
          (n.actionUrl && n.actionUrl.includes(`/tickets/${ticketId}`)) ||
          (n.data && n.data.ticketId === ticketId)
      );

      if (isForThisTicket) {
        triggerRefresh();
      }
    };

    window.addEventListener('bemms:notification', handleNotification);
    return () => {
      window.removeEventListener('bemms:notification', handleNotification);
    };
  }, [ticketId]);

  // 2. Resilient SSE direct listener
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/notifications/sse');

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'new_notifications' && Array.isArray(data.notifications)) {
              const matched = data.notifications.some(
                (n: any) =>
                  (n.relatedEntityType === 'service_ticket' && n.relatedEntityId === ticketId) ||
                  (n.actionUrl && n.actionUrl.includes(`/tickets/${ticketId}`))
              );
              if (matched) {
                triggerRefresh();
              }
            }
          } catch {
            // Ignore parse errors
          }
        };

        eventSource.onerror = () => {
          eventSource?.close();
          reconnectTimeout = setTimeout(connectSSE, 20000);
        };
      } catch {
        // Ignore SSE connection errors
      }
    };

    connectSSE();

    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [ticketId]);

  // 3. Fast live-sync polling (checks updatedAt, statusCode, commentCount)
  useEffect(() => {
    let isCancelled = false;

    const checkLiveSync = async () => {
      // Don't poll if document is hidden or refresh is pending
      if (document.hidden || isRefreshingRef.current) return;

      try {
        const res = await fetch(`/api/tickets/${ticketId}/live-sync`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (!res.ok || isCancelled) return;

        const data = await res.json();
        const current = lastKnownRef.current;

        const hasChanged =
          (data.updatedAt && current.updatedAt && data.updatedAt !== current.updatedAt) ||
          (data.statusCode && current.statusCode && data.statusCode !== current.statusCode) ||
          (typeof data.commentCount === 'number' && data.commentCount !== current.commentCount) ||
          (data.assignedEngineerUserId !== undefined &&
            data.assignedEngineerUserId !== current.assignedEngineerUserId);

        if (hasChanged) {
          lastKnownRef.current = {
            updatedAt: data.updatedAt || current.updatedAt,
            statusCode: data.statusCode || current.statusCode,
            commentCount: data.commentCount ?? current.commentCount,
            assignedEngineerUserId:
              data.assignedEngineerUserId !== undefined
                ? data.assignedEngineerUserId
                : current.assignedEngineerUserId,
          };
          triggerRefresh();
        }
      } catch {
        // Silently handle polling network blips
      }
    };

    const intervalId = setInterval(checkLiveSync, pollIntervalMs);

    // Refresh immediately when tab gains focus / becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkLiveSync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [ticketId, pollIntervalMs]);

  return null;
}
