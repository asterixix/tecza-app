"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export function UserFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="w-full border-t bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="leading-tight text-center sm:text-left">
          © Copyright <time aria-label="Rok">{year}</time> Tęcza.app — Dziękujemy, że jesteś z nami. <Badge variant="outline" title="Alpha" aria-description="wersja 0.1.1" color="purple">Wersja Alpha</Badge>
        </p>
        <nav className="flex items-center gap-4" aria-label="Stopka">
          <Link className="hover:underline" href="/s">Ustawienia</Link>
          <Link className="hover:underline" href="/tos">Regulamin</Link>
          <Link className="hover:underline" href="/pp">Prywatność</Link>
        </nav>
      </div>
    </footer>
  )
}
