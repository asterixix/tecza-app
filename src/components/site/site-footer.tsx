"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="w-full border-t bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="leading-tight text-center sm:text-left">
          © Copyright <time aria-label="Rok">{year}</time> Tęcza.app{" "}
          <Badge variant="outline" title="Wersja 0.1.5" color="purple">
            <Link
              className="hover:underline"
              href="https://github.com/asterixix/tecza-app"
            >
              Wersja Alpha
            </Link>
          </Badge>
        </p>
        <nav className="flex items-center gap-4" aria-label="Stopka">
          <Link className="hover:underline" href="/#features">
            Funkcje
          </Link>
          <Link className="hover:underline" href="/#contribute">
            Współtwórz
          </Link>
          <Link className="hover:underline" href="/tos">
            Regulamin
          </Link>
          <Link className="hover:underline" href="/pp">
            Prywatność
          </Link>
        </nav>
      </div>
    </footer>
  )
}
