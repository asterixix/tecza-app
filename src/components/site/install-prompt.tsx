"use client"

import { useEffect, useMemo, useState } from "react"

type NavigatorStandalone = Navigator & {
  standalone?: boolean
  maxTouchPoints?: number
}

function isIosSafari() {
  if (typeof window === "undefined") return false
  const ua = window.navigator.userAgent || ""
  const nav = navigator as NavigatorStandalone
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && (nav.maxTouchPoints ?? 0) > 1)
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua)
  return isIOS && isSafari
}

function isStandalone() {
  if (typeof window === "undefined") return false
  const nav = navigator as NavigatorStandalone
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    nav.standalone === true
  )
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false)

  const shouldShow = useMemo(() => {
    return !isStandalone() && isIosSafari()
  }, [])

  useEffect(() => {
    if (shouldShow) setVisible(true)
  }, [shouldShow])

  if (!visible) return null

  return (
    <div
      role="note"
      aria-live="polite"
      className="mx-auto my-4 max-w-xl rounded-md border bg-card text-card-foreground p-3 text-sm shadow-sm"
    >
      <p className="mb-1 font-medium">Dodaj aplikację na ekran główny</p>
      <p>
        Na iOS otwórz menu udostępniania i wybierz „Dodaj do ekranu
        początkowego”, aby zainstalować Tęcza.app.
      </p>
    </div>
  )
}
