import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button focus-visible:ring-ring/50 relative isolate mb-2 inline-flex w-fit shrink-0 items-center justify-center overflow-visible rounded-lg border border-transparent font-heading font-bold whitespace-nowrap transition-transform duration-150 ease-out outline-none select-none hover:translate-y-px focus-visible:ring-3 active:translate-y-[4px] active:duration-75 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          'text-primary-fg [&>.base]:bg-primary hover:[&>.base]:bg-primary-hover [&>.darker]:bg-[#86662D] dark:[&>.darker]:bg-black dark:[&>.darkest]:bg-[#494042]',
        secondary:
          'text-secondary-fg [&>.base]:border-2 [&>.base]:border-black [&>.base]:bg-secondary hover:[&>.base]:bg-[#383D51] dark:[&>.base]:border-secondary [&>.darker]:bg-[#131520] dark:[&>.darker]:bg-black [&>.darkest]:bg-black dark:[&>.darkest]:bg-[#2A2D3B]',
      },
      size: {
        default: 'h-11 gap-3 px-6 sm:h-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  fullWidth = false,
  icon,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    icon?: React.ReactNode;
    fullWidth?: boolean;
  }) {
  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }), { 'w-full': fullWidth })}
      {...props}
    >
      <span className="darkest pointer-events-none absolute top-2 z-10 h-full w-full rounded-lg bg-foreground transition-transform duration-150 ease-out group-hover/button:-translate-y-px group-active/button:-translate-y-1 group-active/button:duration-75" />

      <span className="darker pointer-events-none absolute top-1 z-20 h-full w-full rounded-lg transition-transform duration-150 ease-out group-active/button:-translate-y-0.75 group-active/button:duration-75" />

      <span className="base absolute z-30 h-full w-full rounded-lg transition-all duration-150 ease-out content-[''] group-hover/button:translate-y-px group-active/button:translate-y-px group-active/button:duration-75" />

      <span className="relative z-40 transition-transform duration-150 ease-out group-hover/button:translate-y-px group-active/button:translate-y-px group-active/button:scale-y-95">
        {children}
      </span>

      {icon && (
        <span
          data-icon="inline-end"
          className="relative z-40 transition-transform duration-150 ease-out group-hover/button:translate-y-px group-active/button:translate-y-px group-active/button:scale-y-95"
        >
          {icon}
        </span>
      )}
    </button>
  );
}

export { Button, buttonVariants };
