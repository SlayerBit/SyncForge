import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-border-default bg-bg-primary/50 px-3 py-2 text-xs text-text-primary shadow-xs placeholder:text-text-tertiary/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary-subtle focus-visible:border-accent-primary focus-visible:bg-bg-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
