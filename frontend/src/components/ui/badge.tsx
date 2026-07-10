import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20",
        secondary:
          "border-border-default/50 bg-bg-secondary text-text-secondary",
        destructive:
          "border-transparent bg-danger/10 text-danger",
        outline: "border-border-default text-text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
