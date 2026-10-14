'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { SparkleIcon } from '@/components/icons/sparkles-icon';

type Sparkle = {
  id: number;
  createdAt: number;
  x: number;
  y: number;
  size: number;
};

export function SprinkledText({ children }: { children: ReactNode }) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timeout: number | undefined;
    let nextId = 0;

    function scheduleSparkle() {
      timeout = window.setTimeout(
        () => {
          if (media.matches) return;

          const createdAt = performance.now();
          const sparkle: Sparkle = {
            id: nextId++,
            createdAt,
            x: Math.random() * 100,
            y: 20 + Math.random() * 60,
            size: 10 + Math.random() * 8,
          };

          // Allow the theme's 1.6s animation to finish before pruning missed animation-end events.
          setSparkles((current) => [...current.filter((item) => createdAt - item.createdAt < 1700), sparkle]);
          scheduleSparkle();
        },
        100 + Math.floor(Math.random() * 800),
      );
    }

    function onMotionChange() {
      window.clearTimeout(timeout);
      if (media.matches) {
        setSparkles([]);
      } else {
        scheduleSparkle();
      }
    }

    if (!media.matches) scheduleSparkle();
    media.addEventListener('change', onMotionChange);

    return () => {
      window.clearTimeout(timeout);
      media.removeEventListener('change', onMotionChange);
    };
  }, []);

  return (
    <span className="relative isolate inline-block max-w-full align-baseline">
      <span className="pointer-events-none absolute inset-0 motion-reduce:hidden" aria-hidden="true">
        {sparkles.map((sparkle) => (
          <span
            key={sparkle.id}
            className="absolute block text-accent opacity-0 motion-safe:animate-sparkle"
            style={{
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
            }}
            onAnimationEnd={(event) => {
              if (event.target !== event.currentTarget) return;
              setSparkles((current) => current.filter((item) => item.id !== sparkle.id));
            }}
          >
            <SparkleIcon
              className="block motion-safe:animate-spin motion-safe:[animation-duration:2s]"
              style={{ width: sparkle.size, height: sparkle.size }}
            />
          </span>
        ))}
      </span>
      <span className="relative z-10">{children}</span>
    </span>
  );
}
