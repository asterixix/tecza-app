"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    // Render a static, accessible placeholder to avoid SSR/CSR mismatches
    return (
      <Button
        size="icon"
        variant="ghost"
        aria-label="Przełącz motyw"
        suppressHydrationWarning
      >
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"
  const label = isDark ? "Włącz jasny motyw" : "Włącz ciemny motyw"

  return (
    <Button
      size="icon"
      variant="ghost"
      aria-label={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      suppressHydrationWarning
    >
      <Sun className="h-5 w-5 hidden dark:block" />
      <Moon className="h-5 w-5 block dark:hidden" />
    </Button>
  )
}
