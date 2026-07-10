import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.96]",
  {
    variants: {
      variant: {
        default:
          "bg-accent-primary text-white hover:bg-accent-primary-hover border border-accent-primary/20 shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] dark:shadow-[0_1.5px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]",
        destructive:
          "bg-danger text-white hover:bg-danger/90 border border-danger/20 shadow-xs",
        outline:
          "border border-border-default bg-bg-primary hover:bg-bg-hover text-text-primary shadow-xs hover:border-border-default/80",
        secondary:
          "bg-bg-secondary border border-border-default/60 text-text-primary hover:bg-bg-hover shadow-xs",
        ghost: "hover:bg-bg-hover hover:text-text-primary text-text-secondary",
        link: "text-accent-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9.5 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-[11px]",
        lg: "h-11 rounded-2xl px-8",
        icon: "h-9 w-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
