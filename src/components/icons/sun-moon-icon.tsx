'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion, type SVGMotionProps } from 'motion/react';

import { cn } from '@/lib/utils';

type SunMoonIconProps = SVGMotionProps<SVGSVGElement> & {
  isSun: boolean;
};

const rays =
  'M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.28 5.28l1.42 1.42M17.3 17.3l1.42 1.42M5.28 18.72l1.42-1.42M17.3 6.7l1.42-1.42';

export function SunMoonIcon({ isSun, className, ...props }: SunMoonIconProps) {
  const [isBooped, setIsBooped] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const duration = shouldReduceMotion ? 0 : 0.5;
  const starsVisible = !isSun && isBooped;
  const transition = {
    duration,
    ease: [0.4, 0, 0.2, 1] as const,
  };
  const sparkleTransition = (delay: number) => ({
    delay,
    duration: shouldReduceMotion ? 0 : undefined,
    type: shouldReduceMotion ? ('tween' as const) : ('spring' as const),
    stiffness: 300,
    damping: 10,
    opacity: {
      delay,
      duration: shouldReduceMotion ? 0 : 0.1,
    },
  });

  useEffect(() => {
    if (!isBooped) return;

    const timeoutId = window.setTimeout(() => setIsBooped(false), 150);

    return () => window.clearTimeout(timeoutId);
  }, [isBooped]);

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={cn('size-7 overflow-visible', className)}
      aria-hidden="true"
      initial={false}
      animate={{ scale: isSun ? 0.75 : 1 }}
      transition={transition}
      {...props}
      onPointerEnter={() => {
        if (!isSun) setIsBooped(true);
      }}
    >
      <motion.path
        d={rays}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        initial={false}
        animate={{
          opacity: isSun ? 1 : 0,
          pathLength: isSun ? 1 : 0,
          rotate: isSun ? 0 : -45,
          scale: isSun ? 1 : 0.5,
        }}
        style={{ transformOrigin: '12px 12px' }}
        transition={transition}
      />

      <motion.path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{
          opacity: isSun ? 0 : 1,
          rotate: isSun ? 45 : 0,
          scale: isSun ? 0.5 : 0.7,
        }}
        style={{ transformOrigin: '12px 12px' }}
        transition={transition}
      />

      <motion.path
        d="M14.3978 1.4875 12.9126 2.30104 14.3978 3.11458 15.21 4.60208 16.0222 3.11458 17.5074 2.30104 16.0222 1.4875 15.211 0Z"
        fill="currentColor"
        initial={false}
        animate={{
          opacity: starsVisible ? 1 : 0,
          rotate: starsVisible && !shouldReduceMotion ? 10 : 0,
          scale: starsVisible ? (shouldReduceMotion ? 1 : 1.4) : 0.6,
        }}
        style={{ transformOrigin: '15.21px 2.3px' }}
        transition={sparkleTransition(0)}
      />

      <motion.path
        d="M19.241 4.6875 20.1916 6.42708 21.9274 7.37917 20.1906 8.33125 19.24 10.0708 18.2905 8.33125 16.5537 7.37917 18.2905 6.42708Z"
        fill="currentColor"
        initial={false}
        animate={{
          opacity: starsVisible ? 1 : 0,
          rotate: starsVisible && !shouldReduceMotion ? -10 : 0,
          scale: starsVisible ? (shouldReduceMotion ? 1 : 1.4) : 0.6,
        }}
        style={{ transformOrigin: '19.24px 7.38px' }}
        transition={sparkleTransition(0.04)}
      />

      <motion.circle
        cx="12"
        cy="12"
        fill="currentColor"
        initial={false}
        animate={{ opacity: isSun ? 1 : 0, r: isSun ? 5 : 3 }}
        transition={transition}
      />
    </motion.svg>
  );
}
