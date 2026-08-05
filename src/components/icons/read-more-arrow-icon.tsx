'use client';

import { motion } from 'motion/react';

import { cn } from '@/lib/utils';
import { ArrowRightIcon } from './arrow-right-icon';

type ReadMoreArrowIconProps = {
  isAnimated?: boolean;
  className?: string;
};

const animationDuration = 2;
const chevronDelays = [0, animationDuration / 3, (animationDuration * 2) / 3];

export function ReadMoreArrowIcon({ isAnimated = false, className }: ReadMoreArrowIconProps) {
  return (
    <span className={cn('relative block h-5 w-11 shrink-0 overflow-visible', className)} aria-hidden="true">
      <ArrowRightIcon className="absolute top-0 left-0 size-5" />

      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 24"
        fill="none"
        className="absolute top-px left-3 h-5 w-8 overflow-visible"
      >
        {chevronDelays.map((delay) => (
          <motion.path
            key={delay}
            d="M2.884 6.116a1.25 1.25 0 0 0-1.768 1.768L5.232 12l-4.116 4.116a1.25 1.25 0 0 0 1.768 1.768l5-5a1.25 1.25 0 0 0 0-1.768z"
            fill="currentColor"
            initial={false}
            animate={{
              x: isAnimated ? 28 : 0,
              opacity: isAnimated ? [0, 0.9, 0.65, 0] : 0,
            }}
            transition={
              isAnimated
                ? {
                    x: {
                      duration: animationDuration,
                      ease: 'linear',
                      delay,
                      repeat: Infinity,
                      repeatType: 'loop',
                    },
                    opacity: {
                      duration: animationDuration,
                      ease: 'linear',
                      times: [0, 0.12, 0.7, 1],
                      delay,
                      repeat: Infinity,
                      repeatType: 'loop',
                    },
                  }
                : { duration: 0 }
            }
          />
        ))}
      </svg>
    </span>
  );
}
