'use client';

import * as React from 'react';
import { getNavBadgeCounts, type NavBadgeCounts } from '@/lib/actions/nav-counts';
import { type NavBadgeConfig } from '@/components/layout/nav-badge';

export interface NavCountsContextValue {
  counts: NavBadgeCounts;
  isLoading: boolean;
  refreshCounts: () => Promise<void>;
  /**
   * Helper to resolve a complete NavBadgeConfig from a key and/or custom config.
   */
  resolveBadge: (
    badgeKey?: string,
    customConfig?: Partial<NavBadgeConfig>,
    options?: { isCollapsed?: boolean }
  ) => NavBadgeConfig | null;
}

const defaultCounts: NavBadgeCounts = {
  notifications: 0,
  triage: 0,
  tickets: 0,
  maintenance: 0,
  workOrders: 0,
  pmPlans: 0,
  hasMaintenanceDue: false,
};

const NavCountsContext = React.createContext<NavCountsContextValue>({
  counts: defaultCounts,
  isLoading: false,
  refreshCounts: async () => {},
  resolveBadge: () => null,
});

export function NavCountsProvider({
  children,
  initialCounts,
}: {
  children: React.ReactNode;
  initialCounts?: NavBadgeCounts;
}) {
  const [counts, setCounts] = React.useState<NavBadgeCounts>(initialCounts || defaultCounts);
  const [isLoading, setIsLoading] = React.useState(false);

  const refreshCounts = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const newCounts = await getNavBadgeCounts();
      setCounts(newCounts);
    } catch (err) {
      console.error('[NavCountsProvider] Failed to refresh badge counts:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and automatic refresh hooks
  React.useEffect(() => {
    refreshCounts();

    // 1. Listen for global notification events from SSE or Service Worker
    const handleNotificationEvent = () => {
      refreshCounts();
    };

    window.addEventListener('bemms:notification', handleNotificationEvent);

    // 2. Refresh on window focus / visibilitychange
    const handleVisibility = () => {
      if (!document.hidden) {
        refreshCounts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // 3. Periodic polling every 30 seconds
    const interval = setInterval(() => {
      if (!document.hidden) {
        refreshCounts();
      }
    }, 30000);

    return () => {
      window.removeEventListener('bemms:notification', handleNotificationEvent);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [refreshCounts]);

  // Helper to resolve badge configuration for any navbar item
  const resolveBadge = React.useCallback(
    (
      badgeKey?: string,
      customConfig?: Partial<NavBadgeConfig>,
      options?: { isCollapsed?: boolean }
    ): NavBadgeConfig | null => {
      const isCollapsed = options?.isCollapsed ?? false;

      // If explicitly disabled, return null
      if (customConfig && customConfig.enabled === false) {
        return null;
      }

      let baseConfig: NavBadgeConfig | null = null;

      switch (badgeKey) {
        case 'notifications':
          baseConfig = {
            enabled: counts.notifications > 0,
            type: 'count',
            value: counts.notifications,
            variant: 'primary',
            position: isCollapsed ? 'icon-corner' : 'trailing',
            hideWhenZero: true,
            maxCount: 99,
            ariaLabel: `${counts.notifications} unread notifications`,
          };
          break;

        case 'triage':
          baseConfig = {
            enabled: counts.triage > 0,
            type: 'count',
            value: counts.triage,
            variant: 'danger',
            position: isCollapsed ? 'icon-corner' : 'trailing',
            hideWhenZero: true,
            maxCount: 99,
            pulse: counts.triage > 0,
            ariaLabel: `${counts.triage} tickets pending triage`,
          };
          break;

        case 'tickets':
          baseConfig = {
            enabled: counts.tickets > 0,
            type: 'count',
            value: counts.tickets,
            variant: 'secondary',
            position: isCollapsed ? 'icon-corner' : 'trailing',
            hideWhenZero: true,
            maxCount: 99,
            ariaLabel: `${counts.tickets} active tickets`,
          };
          break;

        case 'maintenance':
          baseConfig = {
            enabled: counts.hasMaintenanceDue,
            type: 'dot',
            variant: counts.pmPlans > 0 ? 'warning' : 'default',
            position: isCollapsed ? 'icon-corner' : 'trailing',
            pulse: counts.pmPlans > 0,
            ariaLabel: 'Maintenance items due or scheduled',
          };
          break;

        case 'workOrders':
          baseConfig = {
            enabled: counts.workOrders > 0,
            type: 'count',
            value: counts.workOrders,
            variant: 'secondary',
            position: isCollapsed ? 'icon-corner' : 'trailing',
            hideWhenZero: true,
            maxCount: 99,
            ariaLabel: `${counts.workOrders} active work orders`,
          };
          break;

        case 'pmPlans':
          baseConfig = {
            enabled: counts.pmPlans > 0,
            type: counts.pmPlans > 0 ? 'count' : 'dot',
            value: counts.pmPlans,
            variant: 'warning',
            position: isCollapsed ? 'icon-corner' : 'trailing',
            hideWhenZero: true,
            maxCount: 99,
            ariaLabel: `${counts.pmPlans} preventive maintenance items due`,
          };
          break;

        default:
          if (!customConfig) return null;
          baseConfig = {
            enabled: true,
            type: customConfig.type || 'count',
            value: customConfig.value,
            variant: customConfig.variant || 'default',
            position: isCollapsed ? 'icon-corner' : (customConfig.position || 'trailing'),
            hideWhenZero: customConfig.hideWhenZero ?? true,
            maxCount: customConfig.maxCount ?? 99,
          };
          break;
      }

      if (!baseConfig && !customConfig) return null;

      // Merge customConfig over baseConfig
      const finalConfig: NavBadgeConfig = {
        ...(baseConfig || {}),
        ...(customConfig || {}),
        position: isCollapsed ? 'icon-corner' : (customConfig?.position || baseConfig?.position || 'trailing'),
      };

      return finalConfig;
    },
    [counts]
  );

  return (
    <NavCountsContext.Provider
      value={{
        counts,
        isLoading,
        refreshCounts,
        resolveBadge,
      }}
    >
      {children}
    </NavCountsContext.Provider>
  );
}

export function useNavCounts() {
  const context = React.useContext(NavCountsContext);
  if (!context) {
    throw new Error('useNavCounts must be used within a NavCountsProvider');
  }
  return context;
}
