"use client"

import { useEffect, useState } from "react"

export function SiteFooter() {
  const [year, setYear] = useState<string>("2025")
  useEffect(() => {
    setYear(String(new Date().getFullYear()))
  }, [])
  return (
    <footer className="w-full border-t bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="leading-tight text-center sm:text-left">
          © <time aria-label="Rok">{year}</time> Tęcza.app — Wspólnota LGBTQ w Polsce. Wszelkie prawa zastrzeżone.
        </p>
        <nav className="flex items-center gap-4" aria-label="Stopka">
          <a className="hover:underline" href="#features">Funkcje</a>
          <a className="hover:underline" href="#contribute">Współtwórz</a>
          <a className="hover:underline" href="#feed">Publiczny feed</a>
        </nav>
      </div>
    </footer>
  )
}
