'use client';

import { useEffect, useState, type ComponentPropsWithoutRef } from 'react';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

type SparklesIconProps = ComponentPropsWithoutRef<'svg'>;

const sparkleAnimations = [
  {
    animate: { scale: [1, 1.4, 1], rotate: [0, 90] },
    duration: 0.6,
    delay: 0,
  },
  {
    animate: { scale: [1, 1.25, 1], rotate: [0, 90] },
    duration: 0.5,
    delay: 0.3,
  },
  {
    animate: { scale: [1, 1.35, 1], rotate: [0, -90] },
    duration: 0.65,
    delay: 0.2,
  },
];
const boopResetDelay = Math.max(...sparkleAnimations.map(({ delay, duration }) => delay + duration)) * 1000;

function getSparkleTransition(delay: number, duration: number) {
  return {
    scale: {
      duration,
      ease: 'linear' as const,
      times: [0, 0.25, 0.75, 1],
      delay,
    },
    rotate: {
      duration,
      ease: 'linear' as const,
      delay,
    },
  };
}

export function SparklesIcon({ className, onPointerEnter, ...props }: SparklesIconProps) {
  const [isBooped, setIsBooped] = useState(false);

  useEffect(() => {
    if (!isBooped) return;

    const timeoutId = window.setTimeout(() => setIsBooped(false), boopResetDelay);

    return () => window.clearTimeout(timeoutId);
  }, [isBooped]);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('size-6', className)}
      aria-hidden="true"
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        setIsBooped(true);
      }}
      {...props}
    >
      <motion.path
        fillRule="evenodd"
        d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Z"
        clipRule="evenodd"
        initial={false}
        animate={isBooped ? sparkleAnimations[0].animate : { scale: 1, rotate: 0 }}
        style={{ transformOrigin: '9px 12px' }}
        transition={
          isBooped ? getSparkleTransition(sparkleAnimations[0].delay, sparkleAnimations[0].duration) : { duration: 0 }
        }
      />
      <motion.path
        fillRule="evenodd"
        d="M18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z"
        clipRule="evenodd"
        initial={false}
        animate={isBooped ? sparkleAnimations[1].animate : { scale: 1, rotate: 0 }}
        style={{ transformOrigin: '18px 6px' }}
        transition={
          isBooped ? getSparkleTransition(sparkleAnimations[1].delay, sparkleAnimations[1].duration) : { duration: 0 }
        }
      />
      <motion.path
        fillRule="evenodd"
        d="M16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z"
        clipRule="evenodd"
        initial={false}
        animate={isBooped ? sparkleAnimations[2].animate : { scale: 1, rotate: 0 }}
        style={{ transformOrigin: '16.5px 18.75px' }}
        transition={
          isBooped ? getSparkleTransition(sparkleAnimations[2].delay, sparkleAnimations[2].duration) : { duration: 0 }
        }
      />
    </svg>
  );
}
