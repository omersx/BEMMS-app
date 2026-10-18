'use client';

import * as React from 'react';
import { useNavCounts } from '@/components/providers/nav-counts-provider';
import { NavBadge } from '@/components/layout/nav-badge';

export function MoreItemBadge({ badgeKey }: { badgeKey?: string }) {
  const { resolveBadge } = useNavCounts();
  if (!badgeKey) return null;

  const badge = resolveBadge(badgeKey, undefined, { isCollapsed: false });
  if (!badge) return null;

  return <NavBadge {...badge} position="inline" className="ml-auto mr-2" />;
}
