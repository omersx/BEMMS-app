'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  navBadgeVariants,
  formatNavBadge,
  type NavBadgeConfig,
  type NavBadgeType,
  type NavBadgeVariant,
  type NavBadgePosition,
  type FormattedNavBadge,
} from '@/lib/utils/nav-badge';

export {
  navBadgeVariants,
  formatNavBadge,
  type NavBadgeConfig,
  type NavBadgeType,
  type NavBadgeVariant,
  type NavBadgePosition,
  type FormattedNavBadge,
};

export interface NavBadgeProps extends NavBadgeConfig {
  children?: React.ReactNode;
}

export function NavBadge({
  enabled = true,
  type = 'count',
  value,
  variant = 'default',
  position = 'trailing',
  maxCount = 99,
  hideWhenZero = true,
  pulse = false,
  ariaLabel,
  className,
}: NavBadgeProps) {
  const formatted = formatNavBadge({
    enabled,
    type,
    value,
    maxCount,
    hideWhenZero,
    ariaLabel,
  });

  if (!formatted.visible) {
    return null;
  }

  return (
    <span
      className={cn(
        navBadgeVariants({ variant, position, type }),
        pulse && 'animate-pulse',
        className
      )}
      role="status"
      aria-label={formatted.accessibleDescription}
    >
      <span aria-hidden="true" className={formatted.isDot ? 'sr-only' : undefined}>
        {formatted.display}
      </span>
      {formatted.accessibleDescription && (
        <span className="sr-only">{formatted.accessibleDescription}</span>
      )}
    </span>
  );
}
