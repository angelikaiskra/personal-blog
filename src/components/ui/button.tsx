import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button relative isolate inline-flex shrink-0 items-center justify-center overflow-visible rounded-lg border border-transparent w-fit font-heading font-bold whitespace-nowrap outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 before:absolute before:z-30 before:h-full before:w-full before:rounded-lg before:content-[''] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6",
  {
    variants: {
      variant: {
        default:
          "text-primary-fg transition-transform duration-150 ease-out hover:translate-y-px active:translate-y-[4px] active:duration-75 before:bg-primary before:transition-transform before:duration-150 before:ease-out hover:before:translate-y-[1px] active:before:translate-y-[4px] active:before:duration-75",
        // outline:
        //   "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        // secondary:
        //   "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        // ghost:
        //   "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        // destructive:
        //   "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
      },
      size: {
        default:
          "h-10 gap-3 px-6.5",
        // icon: "size-8",
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
      <span className="pointer-events-none absolute top-2 z-10 h-full w-[calc(100%-2px)] rounded-lg bg-foreground transition-transform duration-150 ease-out group-hover/button:translate-y-[-1px] group-active/button:translate-y-[-4px] group-active/button:duration-75" />
      <span className="pointer-events-none absolute top-1 z-20 h-full w-full rounded-lg bg-[oklch(0.5308_0.0848_79.55)] transition-transform duration-150 ease-out group-active/button:duration-75" />

      <span className="relative z-40 transition-transform duration-150 ease-out group-hover/button:translate-y-[1px] group-active/button:translate-y-[4px]">
        {children}
      </span>

      {icon && (
        <span
          data-icon="inline-end"
          className="relative z-40 transition-transform duration-150 ease-out group-hover/button:translate-y-[1px] group-active/button:translate-y-[4px]"
        >
          {icon}
        </span>
      )}
    </button>
  )
}

export { Button, buttonVariants }
