"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "./logo"
import { ThemeToggle } from "./theme-toggle"

const nav = [
  { href: "#about", label: "O aplikacji" },
  { href: "#feed", label: "Publiczny feed" },
  { href: "#features", label: "Funkcje" },
  { href: "/communities", label: "Społeczności" },
  { href: "#contribute", label: "Współtwórz" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto max-w-6xl px-4 md:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <nav className="hidden md:flex items-center gap-6" aria-label="Główna nawigacja">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-0.5">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm">
            <Link href="/login" aria-label="Zaloguj się do Tęcza.app">Zaloguj</Link>
          </Button>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Otwórz menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <div className="py-4">
                  <Logo />
                </div>
                <nav className="grid gap-4" aria-label="Menu mobilne">
                  {nav.map((item) => (
                    <Link key={item.href} href={item.href} className="text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-1.5">
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-6">
                  <Button asChild className="w-full">
                    <Link href="/login">Zaloguj</Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
