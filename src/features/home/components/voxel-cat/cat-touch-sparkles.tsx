'use client';

import { createPortal } from 'react-dom';

import { SparkleIcon } from '@/components/icons/sparkles-icon';
import type { CatTouchTarget } from './cat-pointer-input';

const sparkles = [
  { x: 0, y: 0, size: 22, delay: 0 },
  { x: -20, y: -15, size: 14, delay: 0.2 },
  { x: 19, y: -18, size: 18, delay: 0.4 },
  { x: -15, y: 19, size: 16, delay: 0.6 },
  { x: 22, y: 15, size: 12, delay: 0.8 },
];

export function CatTouchSparkles({ target }: { target: CatTouchTarget | null }) {
  if (!target) return null;

  return createPortal(
    <div
      key={target.id}
      className="pointer-events-none absolute z-50 text-accent motion-reduce:hidden"
      style={{ left: target.pageX, top: target.pageY }}
      aria-hidden="true"
    >
      {sparkles.map((sparkle, index) => (
        <span
          key={index}
          className="absolute block opacity-0 motion-safe:animate-sparkle"
          style={{
            left: sparkle.x,
            top: sparkle.y,
            animationDelay: `${sparkle.delay}s`,
            animationDuration: '1s',
            animationIterationCount: 'infinite',
          }}
        >
          <SparkleIcon style={{ width: sparkle.size, height: sparkle.size }} />
        </span>
      ))}
    </div>,
    document.body,
  );
}
