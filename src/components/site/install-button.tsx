"use client"

import { useEffect, useState } from "react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice?: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallButton() {
  const [deferredEvt, setDeferredEvt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    const onBIP = (e: Event) => {
      // Prevent the mini-infobar on mobile
      e.preventDefault?.()
      setDeferredEvt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener("beforeinstallprompt", onBIP)
    return () => window.removeEventListener("beforeinstallprompt", onBIP)
  }, [])

  if (!visible || !deferredEvt) return null

  return (
    <div className="mx-auto my-4 max-w-xl rounded-md border bg-card text-card-foreground p-3 text-sm shadow-sm flex items-center justify-between gap-3">
      <div>
        <p className="font-medium">Zainstaluj aplikację</p>
        <p className="text-muted-foreground">
          Dodaj Tęcza.app jako aplikację PWA.
        </p>
      </div>
      <button
        type="button"
        aria-label="Zainstaluj aplikację"
        className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
        disabled={installing}
        onClick={async () => {
          try {
            setInstalling(true)
            await deferredEvt.prompt()
            await deferredEvt.userChoice?.catch(() => undefined)
          } finally {
            setInstalling(false)
            // Hide after interaction to avoid repeated prompts
            setVisible(false)
            setDeferredEvt(null)
          }
        }}
      >
        Zainstaluj
      </button>
    </div>
  )
}
