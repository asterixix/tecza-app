/* Strona błędu */

"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Home, ArrowLeft, Bug, Copy, AlertTriangle } from "lucide-react"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname()
  const [copied, setCopied] = useState(false)

  const details = useMemo(() => ({
    route: "error",
    pathname,
    message: error?.message,
    digest: error?.digest,
    referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    timestamp: new Date().toISOString(),
  }), [error?.digest, error?.message, pathname])

  const issueUrl = useMemo(() => {
    const title = encodeURIComponent(`Błąd: ${error?.message || "Application error"}`)
    const body = encodeURIComponent(`## Opis\n\nCo robiłeś/aś?\n\n## Szczegóły\n\n\`\`\`json\n${JSON.stringify(details, null, 2)}\n\`\`\`\n`)
    return `https://github.com/asterixix/tecza-app/issues/new?title=${title}&body=${body}`
  }, [details, error?.message])

  async function copyDetails() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(details, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="mx-auto max-w-2xl px-4 md:px-6 py-12 md:py-16">
      <div className="mb-4"><Badge variant="destructive" aria-label="Kod błędu">Błąd aplikacji</Badge></div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Coś poszło nie tak</h1>
      <p className="mt-2 text-muted-foreground">Spróbuj odświeżyć stronę lub wrócić do poprzedniej.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/" aria-label="Wróć na stronę główną">
            <Home className="size-4" /> Strona główna
          </Link>
        </Button>
        <Button variant="outline" onClick={() => history.back()} aria-label="Wróć do poprzedniej strony">
          <ArrowLeft className="size-4" /> Wróć
        </Button>
        <Button variant="secondary" onClick={() => reset()} aria-label="Spróbuj ponownie">
          <AlertTriangle className="size-4" /> Spróbuj ponownie
        </Button>
        <Button asChild variant="secondary" aria-label="Zgłoś problem w GitHub">
          <a href={issueUrl} target="_blank" rel="noreferrer">
            <Bug className="size-4" /> Zgłoś problem
          </a>
        </Button>
        <Button variant="ghost" onClick={copyDetails} aria-label="Skopiuj dane diagnostyczne">
          <Copy className="size-4" /> {copied ? "Skopiowano" : "Kopiuj szczegóły"}
        </Button>
      </div>

      <Card className="mt-8" aria-label="Szczegóły błędu">
        <CardContent className="p-4">
          <pre className="max-h-[320px] overflow-auto rounded-md bg-muted/60 p-3 text-xs leading-relaxed"><code>{JSON.stringify(details, null, 2)}</code></pre>
        </CardContent>
      </Card>
    </div>
  )
}
