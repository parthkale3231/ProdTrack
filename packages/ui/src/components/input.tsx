import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-neutral-200 bg-white/50 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950/50 dark:text-white dark:placeholder:text-neutral-500 dark:focus-visible:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200",
        className
      )}
      {...props}
    />
  )
}

export { Input }
