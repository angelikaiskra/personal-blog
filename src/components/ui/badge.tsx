import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border border-black shadow-brutalist-sm px-2 py-0.5 font-semibold font-sans whitespace-nowrap transition-colors ease-out focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      color: {
        default: 'bg-[#F3F3F3] hover:bg-[#DADADA]',
      },
      hoverColor: {
        gray: 'hover:bg-[#F3F3F3]'
      }
    },
    defaultVariants: {
      color: "default",
    },
  }
)

type BadgeProps<T extends React.ElementType = 'span'> = {
  as?: T;
} & VariantProps<typeof badgeVariants> &
  Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'color' | 'hoverColor'>;

function Badge<T extends React.ElementType = 'span'>({
  className,
  as,
  color,
  hoverColor,
  children,
  ...props
}: BadgeProps<T>) {
  const Component = as ?? 'span';

  return (
    <Component
      className={cn(badgeVariants({ color, hoverColor, className }))}
      {...props}
    >
      {children}
    </Component>
  )
}

export { Badge, badgeVariants }
