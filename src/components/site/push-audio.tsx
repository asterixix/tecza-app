"use client"

import { useEffect, useMemo } from "react"
import { setupClientAudioBridge } from "@/lib/push"

export function PushAudio() {
  const audio = useMemo(() => {
    if (typeof window === "undefined") return null
    try {
      const a = new Audio("/audio/tecza_powiadomienie.mp3")
      a.volume = 0.7
      return a
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (!audio) return
    const cleanup = setupClientAudioBridge(() => {
      try {
        audio.currentTime = 0
        void audio.play()
      } catch {
        // ignore
      }
    })
    return cleanup
  }, [audio])

  return null
}
