"use client";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-xl border border-neutral-200/50 bg-neutral-100/20 dark:border-neutral-800/50 dark:bg-neutral-900/20 animate-pulse" />
    );
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="h-9 w-9 rounded-xl border border-neutral-200 bg-white/80 hover:bg-neutral-100/80 text-neutral-800 dark:border-neutral-800 dark:bg-neutral-950/40 dark:hover:bg-neutral-900/80 dark:text-neutral-200 transition-all duration-300 backdrop-blur-md cursor-pointer flex items-center justify-center shadow-sm hover:shadow-md"
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4.5 w-4.5 transition-transform duration-500 rotate-0 hover:rotate-45 text-amber-400" />
      ) : (
        <Moon className="h-4.5 w-4.5 transition-transform duration-500 rotate-0 hover:-rotate-12 text-indigo-500" />
      )}
    </button>
  );
}
