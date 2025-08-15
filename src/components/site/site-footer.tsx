"use client"

import Link from "next/link"

export function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="w-full border-t bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="leading-tight text-center sm:text-left">
          © Copyright <time aria-label="Rok">{year}</time> Tęcza.app
        </p>
        <nav className="flex items-center gap-4" aria-label="Stopka">
          <Link className="hover:underline" href="/#features">Funkcje</Link>
          <Link className="hover:underline" href="/#contribute">Współtwórz</Link>
        </nav>
      </div>
    </footer>
  )
}
