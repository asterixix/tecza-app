/* Nie znaleziono strony */

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Home, ArrowLeft, Bug, Copy, Info } from "lucide-react"

export default function NotFound() {
  const pathname = usePathname()
  const [copied, setCopied] = useState(false)
  const [err, setErr] = useState<string | undefined>(undefined)

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      setErr(params.get("error") || undefined)
    } catch {}
  }, [])

  const details = useMemo(() => ({
    route: "not-found",
    pathname,
    referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    timestamp: new Date().toISOString(),
    error: err,
  }), [pathname, err])

  async function copyDetails() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(details, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="mx-auto max-w-2xl px-4 md:px-6 py-12 md:py-16">
      <div className="mb-4"><Badge variant="secondary" aria-label="Kod błędu">404 • Nie znaleziono</Badge></div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Nie znaleziono strony</h1>
      <p className="mt-2 text-muted-foreground">
        Adres może być nieprawidłowy lub zasób został przeniesiony.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/" aria-label="Wróć na stronę główną">
            <Home className="size-4" /> Strona główna
          </Link>
        </Button>
        <Button variant="outline" onClick={() => history.back()} aria-label="Wróć do poprzedniej strony">
          <ArrowLeft className="size-4" /> Wróć
        </Button>
        <Button asChild variant="secondary" aria-label="Zgłoś problem w GitHub">
          <a href="https://github.com/asterixix/tecza-app/issues/new" target="_blank" rel="noreferrer">
            <Bug className="size-4" /> Zgłoś problem
          </a>
        </Button>
        <Button variant="ghost" onClick={copyDetails} aria-label="Skopiuj dane diagnostyczne">
          <Copy className="size-4" /> {copied ? "Skopiowano" : "Kopiuj szczegóły"}
        </Button>
      </div>

      <Card className="mt-8" aria-label="Szczegóły debugowania">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm font-medium"><Info className="size-4" /> Szczegóły debugowania</div>
          <pre className="mt-3 max-h-[320px] overflow-auto rounded-md bg-muted/60 p-3 text-xs leading-relaxed"><code>{JSON.stringify(details, null, 2)}</code></pre>
        </CardContent>
      </Card>
    </div>
  )
}
