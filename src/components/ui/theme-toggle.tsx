'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useReducedMotion } from 'motion/react';

import { SunMoonIcon } from '@/components/icons/sun-moon-icon';
import { cn } from '@/lib/utils';

type ThemeToggleProps = {
  className?: string;
};

const emptySubscribe = () => () => {};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [isBooped, setIsBooped] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const buttonClassName = cn(
    'flex h-9 w-9 items-center justify-center gap-2 rounded-md text-muted-fg transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:text-foreground dark:hover:bg-border',
    className,
  );
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (!isBooped) return;

    const timeoutId = window.setTimeout(() => setIsBooped(false), 1000);

    return () => window.clearTimeout(timeoutId);
  }, [isBooped]);

  if (!mounted) {
    return (
      <button type="button" disabled aria-label="Switch theme" className={cn(buttonClassName, 'invisible')}>
        <SunMoonIcon isSun={false} />
      </button>
    );
  }

  const label = `Switch to ${isDark ? 'light' : 'dark'} mode`;

  return (
    <button
      type="button"
      onClick={() => {
        setIsBooped(false);
        setTheme(isDark ? 'light' : 'dark');
      }}
      onPointerEnter={() => {
        if (!prefersReducedMotion) setIsBooped(true);
      }}
      className={buttonClassName}
      aria-label={label}
    >
      <SunMoonIcon isSun={isDark} isBooped={isBooped && !prefersReducedMotion} />
    </button>
  );
}
