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
    'text-muted-fg dark:text-foreground hover:text-foreground hover:bg-muted flex h-9 items-center justify-center gap-2 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current w-9 dark:hover:bg-border',
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
