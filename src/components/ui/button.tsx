import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button relative mb-2 isolate inline-flex shrink-0 items-center justify-center overflow-visible rounded-lg border border-transparent w-fit font-heading font-bold whitespace-nowrap outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6 transition-transform duration-150 ease-out hover:translate-y-px active:translate-y-[4px] active:duration-75",
  {
    variants: {
      variant: {
        default:
          "[&>.base]:bg-primary text-primary-fg hover:[&>.base]:bg-primary-hover [&>.darker]:bg-[#86662D]",
        secondary: "[&>.base]:bg-secondary hover:[&>.base]:bg-[#383D51] text-secondary-fg [&>.base]:border-2 [&>.base]:border-black [&>.darker]:bg-[#131520] [&>.darkest]:bg-black"
      },
      size: {
        default:
          "h-10 gap-3 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  fullWidth = false,
  icon,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    icon?: React.ReactNode;
    fullWidth?: boolean;
  }) {

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }), { "w-full": fullWidth })}
      {...props}
    >
      <span className="darkest pointer-events-none absolute top-2 z-10 h-full w-full rounded-lg bg-foreground transition-transform duration-150 ease-out group-hover/button:-translate-y-px group-active/button:-translate-y-1 group-active/button:duration-75" />

      <span className="darker pointer-events-none absolute top-1 z-20 h-full w-full rounded-lg transition-transform duration-150 ease-out group-active/button:-translate-y-0.75 group-active/button:duration-75" />

      <span className="base absolute z-30 h-full w-full rounded-lg content-[''] transition-all duration-150 ease-out group-hover/button:translate-y-px group-active/button:translate-y-px group-active/button:duration-75" />

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
  )
}

export { Button, buttonVariants }
