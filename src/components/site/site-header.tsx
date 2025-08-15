"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Menu, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Logo } from "./logo"
import { ThemeToggle } from "./theme-toggle"

const nav = [
  { href: "/#about", label: "O aplikacji" },
  { href: "/#features", label: "Funkcje" },
  { href: "/#contribute", label: "Współtwórz" },
]

export function SiteHeader() {
  // Simple pagination for long navs on small screens
  const pageSize = 5
  const pages = useMemo(() => {
    const chunks: typeof nav[] = []
    for (let i = 0; i < nav.length; i += pageSize) {
      chunks.push(nav.slice(i, i + pageSize))
    }
    return chunks
  }, [])
  const [page, setPage] = useState(0)
  const hasMultiplePages = pages.length > 1
  const current = pages[page] ?? nav

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
            <Link href="/login" aria-label="Zaloguj się do Tęcza.app">Zaloguj się</Link>
          </Button>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Otwórz menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[88vw] sm:w-80">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="py-4 px-4">
                  <Logo />
                </div>
                <ScrollArea className="max-h-[65dvh]">
                  <nav className="grid gap-1 px-4 pb-2" aria-label="Menu mobilne">
                    {current.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-md px-2 py-2 text-base font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </ScrollArea>

                {hasMultiplePages && (
                  <div className="flex items-center justify-between gap-3 px-4 py-2">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Poprzednia strona menu"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="size-5" />
                    </Button>
                    <div className="flex items-center gap-1" aria-label={`Strona ${page + 1} z ${pages.length}`}>
                      {pages.map((_, i) => (
                        <span
                          key={i}
                          className={
                            "h-2 w-2 rounded-full border " + (i === page ? "bg-foreground" : "bg-muted")
                          }
                          aria-current={i === page ? "page" : undefined}
                        />
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Następna strona menu"
                      onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))}
                      disabled={page === pages.length - 1}
                    >
                      <ChevronRight className="size-5" />
                    </Button>
                  </div>
                )}

                <div className="mt-4 px-4 pb-4">
                  <Button asChild className="w-full">
                    <Link href="/login">Zaloguj się</Link>
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
