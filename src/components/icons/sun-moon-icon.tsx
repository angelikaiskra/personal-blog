'use client';

import { motion, type SVGMotionProps } from 'motion/react';

import { cn } from '@/lib/utils';

type SunMoonIconProps = SVGMotionProps<SVGSVGElement> & {
  isSun: boolean;
  isBooped?: boolean;
};

export function SunMoonIcon({ isSun, isBooped = false, className, ...props }: SunMoonIconProps) {
  const starsVisible = !isSun && isBooped;
  const transition = {
    duration: 0.5,
    ease: [0.4, 0, 0.2, 1] as const,
  };
  const sparkleTransition = {
    opacity: {
      duration: 0.1,
    },
    scale: {
      duration: 1,
      ease: 'linear' as const,
      times: [0, 0.25, 0.75, 1],
    },
    rotate: {
      duration: 1,
      ease: 'linear' as const,
    },
  };

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
    >
      <motion.g
        initial={false}
        animate={{ rotate: isSun && isBooped ? 180 : 0 }}
        style={{ transformOrigin: '12px 12px' }}
        transition={isSun && isBooped ? { duration: 1, ease: 'easeInOut', repeat: Infinity } : { duration: 0 }}
      >
        <motion.path
          d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.28 5.28l1.42 1.42M17.3 17.3l1.42 1.42M5.28 18.72l1.42-1.42M17.3 6.7l1.42-1.42"
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
      </motion.g>

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

      <g transform="translate(4 0), scale(0.9)">
        <motion.path
          d="M13.4925 3.935C13.5104 3.88087 13.545 3.83376 13.5912 3.80037C13.6374 3.76698 13.693 3.74901 13.75 3.74901C13.807 3.74901 13.8626 3.76698 13.9088 3.80037C13.9551 3.83376 13.9896 3.88087 14.0075 3.935L14.4913 5.3875C14.7075 6.035 15.215 6.5425 15.8625 6.75875L17.315 7.2425C17.3691 7.26042 17.4162 7.29495 17.4496 7.34118C17.483 7.3874 17.501 7.44298 17.501 7.5C17.501 7.55702 17.483 7.61259 17.4496 7.65882C17.4162 7.70504 17.3691 7.73957 17.315 7.7575L15.8625 8.24125C15.543 8.3473 15.2526 8.52648 15.0146 8.76455C14.7765 9.00261 14.5973 9.29297 14.4913 9.6125L14.0075 11.065C13.9896 11.1191 13.9551 11.1662 13.9088 11.1996C13.8626 11.233 13.807 11.251 13.75 11.251C13.693 11.251 13.6374 11.233 13.5912 11.1996C13.545 11.1662 13.5104 11.1191 13.4925 11.065L13.0088 9.6125C12.9027 9.29297 12.7235 9.00261 12.4855 8.76455C12.2474 8.52648 11.957 8.3473 11.6375 8.24125L10.185 7.7575C10.1309 7.73957 10.0838 7.70504 10.0504 7.65882C10.017 7.61259 9.99902 7.55702 9.99902 7.5C9.99902 7.44298 10.017 7.3874 10.0504 7.34118C10.0838 7.29495 10.1309 7.26042 10.185 7.2425L11.6375 6.75875C11.957 6.6527 12.2474 6.47351 12.4855 6.23545C12.7235 5.99739 12.9027 5.70703 13.0088 5.3875L13.4925 3.935Z"
          fill="currentColor"
          initial={false}
          animate={{
            opacity: starsVisible ? 1 : 0,
            rotate: starsVisible ? [0, 180] : 0,
            scale: starsVisible ? [0, 1, 1, 0] : 0,
          }}
          style={{ transformOrigin: '13.75px 7.5px' }}
          transition={starsVisible ? sparkleTransition : { duration: 0 }}
        />

        <motion.path
          d="M17.3288 0.123747C17.3411 0.0881554 17.3642 0.0572924 17.3949 0.0354495C17.4256 0.0136066 17.4623 0.0018692 17.5 0.0018692C17.5377 0.0018692 17.5744 0.0136066 17.6051 0.0354495C17.6358 0.0572924 17.6589 0.0881554 17.6713 0.123747L17.9938 1.09125C18.1375 1.52375 18.4763 1.8625 18.9088 2.00625L19.8763 2.32875C19.9118 2.34109 19.9427 2.36421 19.9646 2.3949C19.9864 2.42559 19.9981 2.46233 19.9981 2.5C19.9981 2.53767 19.9864 2.5744 19.9646 2.60509C19.9427 2.63578 19.9118 2.65891 19.8763 2.67125L18.9088 2.99375C18.6958 3.065 18.5023 3.18473 18.3435 3.34352C18.1847 3.5023 18.065 3.6958 17.9938 3.90875L17.6713 4.87625C17.6589 4.91184 17.6358 4.9427 17.6051 4.96455C17.5744 4.98639 17.5377 4.99813 17.5 4.99813C17.4623 4.99813 17.4256 4.98639 17.3949 4.96455C17.3642 4.9427 17.3411 4.91184 17.3288 4.87625L17.0063 3.90875C16.935 3.6958 16.8153 3.5023 16.6565 3.34352C16.4977 3.18473 16.3042 3.065 16.0913 2.99375L15.1238 2.67125C15.0882 2.65891 15.0573 2.63578 15.0355 2.60509C15.0136 2.5744 15.0019 2.53767 15.0019 2.5C15.0019 2.46233 15.0136 2.42559 15.0355 2.3949C15.0573 2.36421 15.0882 2.34109 15.1238 2.32875L16.0913 2.00625C16.5238 1.8625 16.8625 1.52375 17.0063 1.09125L17.3288 0.123747Z"
          fill="currentColor"
          initial={false}
          animate={{
            opacity: starsVisible ? 1 : 0,
            rotate: starsVisible ? [0, 180] : 0,
            scale: starsVisible ? [0, 1, 1, 0] : 0,
          }}
          style={{ transformOrigin: '17.5px 2.5px' }}
          transition={starsVisible ? sparkleTransition : { duration: 0 }}
        />
      </g>

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
