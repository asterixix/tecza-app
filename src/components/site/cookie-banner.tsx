"use client"

import { useEffect, useState } from "react"

type ConsentValue = "all" | "necessary"

function getConsent(): ConsentValue | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(?:^|; )tecza_consent=([^;]+)/)
  return match ? (decodeURIComponent(match[1]) as ConsentValue) : null
}

function setConsent(value: ConsentValue) {
  if (typeof document === "undefined") return
  const days = 180
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `tecza_consent=${encodeURIComponent(value)}; Expires=${expires}; Path=/; SameSite=Lax`
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show banner if no consent cookie
    setVisible(getConsent() === null)
  }, [])

  if (!visible) return null

  const acceptAll = () => {
    setConsent("all")
    setVisible(false)
  }

  const acceptNecessary = () => {
    setConsent("necessary")
    setVisible(false)
  }

  const rejectAndClose = () => {
    // No consent stored; attempt to close the tab, then fallback to about:blank
    try {
      window.close()
    } catch {
      // ignore
    }
    // If the window did not close (most cases), navigate away
    try {
      window.location.replace("about:blank")
    } catch {
      // ignore
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Zgoda na pliki cookie"
      className="fixed inset-x-0 bottom-0 z-[100] border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <p className="text-sm text-muted-foreground">
          Używamy plików cookie. Niezbędne służą do działania i bezpieczeństwa aplikacji. Inne (np.
          funkcjonalne/analityczne) używamy wyłącznie za Twoją zgodą. Zobacz naszą {" "}
          <a className="underline" href="/pp">Politykę prywatności</a>.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={acceptNecessary}
            className="px-3 py-1.5 rounded-md border text-xs"
          >
            Tylko niezbędne
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs"
          >
            Akceptuj wszystkie
          </button>
          <button
            type="button"
            onClick={rejectAndClose}
            className="px-3 py-1.5 rounded-md border text-xs"
          >
            Nie wyrażam zgody — zamknij
          </button>
        </div>
      </div>
    </div>
  )
}
