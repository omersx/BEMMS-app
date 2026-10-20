import { describe, it, expect } from 'vitest';
import {
  navBadgeVariants,
  formatNavBadge,
} from '@/lib/utils/nav-badge';

describe('NavBadge system', () => {
  describe('navBadgeVariants formatting & class generation', () => {
    it('generates standard count badge classes with default options', () => {
      const classes = navBadgeVariants({
        variant: 'default',
        type: 'count',
        position: 'trailing',
      });
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('ml-auto');
      expect(classes).toContain('rounded-full');
    });

    it('generates icon-corner position classes for collapsed sidebars and mobile tabs', () => {
      const classes = navBadgeVariants({
        variant: 'danger',
        type: 'count',
        position: 'icon-corner',
      });
      expect(classes).toContain('absolute');
      expect(classes).toContain('-top-1');
      expect(classes).toContain('-right-1');
      expect(classes).toContain('bg-destructive');
    });

    it('generates dot badge classes for maintenance indicators', () => {
      const classes = navBadgeVariants({
        variant: 'warning',
        type: 'dot',
        position: 'icon-corner',
      });
      expect(classes).toContain('rounded-full');
      expect(classes).toContain('w-2.5');
      expect(classes).toContain('h-2.5');
      expect(classes).toContain('bg-amber-500');
    });

    it('generates status badge classes for custom status text', () => {
      const classes = navBadgeVariants({
        variant: 'success',
        type: 'status',
        position: 'trailing',
      });
      expect(classes).toContain('bg-emerald-600');
      expect(classes).toContain('uppercase');
      expect(classes).toContain('truncate');
    });
  });

  describe('formatNavBadge logic', () => {
    it('hides count badge when value is 0 and hideWhenZero is true', () => {
      const result = formatNavBadge({
        type: 'count',
        value: 0,
        hideWhenZero: true,
      });
      expect(result.visible).toBe(false);
    });

    it('displays count badge when value is 0 and hideWhenZero is false', () => {
      const result = formatNavBadge({
        type: 'count',
        value: 0,
        hideWhenZero: false,
      });
      expect(result.visible).toBe(true);
      expect(result.display).toBe('0');
    });

    it('displays normal count under maxCount', () => {
      const result = formatNavBadge({
        type: 'count',
        value: 12,
        maxCount: 99,
      });
      expect(result.visible).toBe(true);
      expect(result.display).toBe('12');
      expect(result.accessibleDescription).toBe('12 items');
    });

    it('formats counts exceeding maxCount with a plus suffix', () => {
      const result = formatNavBadge({
        type: 'count',
        value: 150,
        maxCount: 99,
      });
      expect(result.visible).toBe(true);
      expect(result.display).toBe('99+');
      expect(result.accessibleDescription).toBe('More than 99 items');
    });

    it('formats custom maxCount correctly (e.g. maxCount: 9)', () => {
      const result = formatNavBadge({
        type: 'count',
        value: 15,
        maxCount: 9,
      });
      expect(result.visible).toBe(true);
      expect(result.display).toBe('9+');
    });

    it('uses custom aria-label when provided for accessibility', () => {
      const result = formatNavBadge({
        type: 'count',
        value: 5,
        ariaLabel: '5 unread notifications',
      });
      expect(result.accessibleDescription).toBe('5 unread notifications');
    });

    it('supports dot indicator without numerical value', () => {
      const result = formatNavBadge({
        type: 'dot',
        ariaLabel: 'Maintenance due',
      });
      expect(result.visible).toBe(true);
      expect(result.isDot).toBe(true);
      expect(result.accessibleDescription).toBe('Maintenance due');
    });

    it('supports status labels with proper text formatting', () => {
      const result = formatNavBadge({
        type: 'status',
        value: 'New',
        ariaLabel: 'New feature',
      });
      expect(result.visible).toBe(true);
      expect(result.display).toBe('New');
      expect(result.accessibleDescription).toBe('New feature');
    });

    it('hides badge when enabled is explicitly false', () => {
      const result = formatNavBadge({
        enabled: false,
        type: 'count',
        value: 10,
      });
      expect(result.visible).toBe(false);
    });
  });
});
