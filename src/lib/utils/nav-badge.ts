import { cva, type VariantProps } from 'class-variance-authority';

export type NavBadgeType = 'count' | 'dot' | 'status';
export type NavBadgePosition = 'trailing' | 'icon-corner' | 'inline';

export const navBadgeVariants = cva(
  'transition-all duration-200 select-none font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        primary: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        success: 'bg-emerald-600 text-white dark:bg-emerald-500',
        warning: 'bg-amber-500 text-white dark:bg-amber-600',
        danger: 'bg-destructive text-destructive-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border border-border bg-background text-foreground',
      },
      position: {
        trailing: 'ml-auto shrink-0',
        inline: 'shrink-0',
        'icon-corner': 'absolute -top-1 -right-1 z-10 pointer-events-none ring-2 ring-card',
      },
      type: {
        count: 'inline-flex items-center justify-center font-semibold text-center',
        status: 'inline-flex items-center justify-center font-medium uppercase tracking-wider',
        dot: 'rounded-full inline-block shrink-0',
      },
    },
    compoundVariants: [
      // Count badge sizing
      {
        type: 'count',
        position: 'trailing',
        className: 'min-w-[20px] h-5 px-1.5 rounded-full text-[11px] leading-none',
      },
      {
        type: 'count',
        position: 'inline',
        className: 'min-w-[18px] h-4.5 px-1.5 rounded-full text-[10px] leading-none',
      },
      {
        type: 'count',
        position: 'icon-corner',
        className: 'min-w-[18px] h-4.5 px-1 rounded-full text-[10px] leading-none shadow-xs font-bold',
      },
      // Status badge sizing
      {
        type: 'status',
        position: 'trailing',
        className: 'px-2 py-0.5 rounded-md text-[10px] max-w-[80px] truncate',
      },
      {
        type: 'status',
        position: 'inline',
        className: 'px-1.5 py-0.5 rounded text-[9px] max-w-[70px] truncate',
      },
      {
        type: 'status',
        position: 'icon-corner',
        className: 'px-1 py-0.5 rounded text-[8px] leading-none max-w-[50px] truncate',
      },
      // Dot badge sizing
      {
        type: 'dot',
        position: 'icon-corner',
        className: 'w-2.5 h-2.5',
      },
      {
        type: 'dot',
        position: 'trailing',
        className: 'w-2 h-2 ml-auto',
      },
      {
        type: 'dot',
        position: 'inline',
        className: 'w-2 h-2',
      },
    ],
    defaultVariants: {
      variant: 'default',
      position: 'trailing',
      type: 'count',
    },
  }
);

export type NavBadgeVariant = NonNullable<VariantProps<typeof navBadgeVariants>['variant']>;

export interface NavBadgeConfig {
  /**
   * Whether the badge is enabled and visible.
   * Default: true
   */
  enabled?: boolean;
  /**
   * Badge type:
   * - 'count': numerical count with maxCount formatting (e.g. 5, 99+)
   * - 'dot': compact circular indicator
   * - 'status': short text label (e.g. "NEW", "DUE")
   * Default: 'count'
   */
  type?: NavBadgeType;
  /**
   * Numerical count or text value for status badges.
   */
  value?: number | string | null;
  /**
   * Visual variant/color theme.
   * Default: 'default'
   */
  variant?: NavBadgeVariant;
  /**
   * Placement relative to the navigation item:
   * - 'trailing': at the right end of the item (ideal for expanded sidebars)
   * - 'icon-corner': anchored to the top-right of the icon (ideal for collapsed sidebars & mobile nav)
   * - 'inline': alongside the label
   * Default: 'trailing'
   */
  position?: NavBadgePosition;
  /**
   * Maximum count before formatting with "+" (e.g. 99 -> "99+").
   * Default: 99
   */
  maxCount?: number;
  /**
   * Whether to hide count badge when value is 0.
   * Default: true
   */
  hideWhenZero?: boolean;
  /**
   * Whether to animate with a pulse effect (great for urgent alerts or activity dots).
   * Default: false
   */
  pulse?: boolean;
  /**
   * Accessible description for screen readers (e.g. "5 unread notifications").
   */
  ariaLabel?: string;
  /**
   * Additional custom CSS classes.
   */
  className?: string;
}

export interface FormattedNavBadge {
  visible: boolean;
  display: string;
  isDot: boolean;
  accessibleDescription: string;
}

/**
 * Format and calculate visibility of badge data according to badge type and configuration.
 */
export function formatNavBadge(config: NavBadgeConfig): FormattedNavBadge {
  const {
    enabled = true,
    type = 'count',
    value,
    maxCount = 99,
    hideWhenZero = true,
    ariaLabel,
  } = config;

  if (!enabled) {
    return { visible: false, display: '', isDot: false, accessibleDescription: '' };
  }

  if (type === 'dot') {
    if (typeof value === 'number' && value === 0 && hideWhenZero) {
      return { visible: false, display: '', isDot: true, accessibleDescription: '' };
    }
    return {
      visible: true,
      display: '',
      isDot: true,
      accessibleDescription: ariaLabel || 'New activity indicator',
    };
  }

  if (type === 'status') {
    if (!value && value !== 0) {
      return { visible: false, display: '', isDot: false, accessibleDescription: '' };
    }
    const str = String(value);
    return {
      visible: true,
      display: str,
      isDot: false,
      accessibleDescription: ariaLabel || `Status: ${str}`,
    };
  }

  // Count type
  const numValue = typeof value === 'number' ? value : Number(value);
  if (isNaN(numValue)) {
    if (value === null || value === undefined || value === '') {
      return { visible: false, display: '', isDot: false, accessibleDescription: '' };
    }
    const str = String(value);
    return {
      visible: true,
      display: str,
      isDot: false,
      accessibleDescription: ariaLabel || `${str} items`,
    };
  }

  if (numValue === 0 && hideWhenZero) {
    return { visible: false, display: '', isDot: false, accessibleDescription: '' };
  }

  const display = numValue > maxCount ? `${maxCount}+` : String(numValue);
  const accessibleDescription =
    ariaLabel || (numValue > maxCount ? `More than ${maxCount} items` : `${numValue} items`);

  return {
    visible: true,
    display,
    isDot: false,
    accessibleDescription,
  };
}
