import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 select-none",
        className
      )}
      {...props}
    />
  )
}

export { Label }
