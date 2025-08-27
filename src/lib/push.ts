/* Push notifications helper: permission, subscribe, unsubscribe, and VAPID utils */
"use client"

import { getSupabase } from "@/lib/supabase-browser"

// Convert a base64 (URL-safe) string to a Uint8Array for PushManager
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i)
    outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export type PushSubscribeResult =
  | { ok: true; permission: NotificationPermission; endpoint: string }
  | { ok: false; reason: string }

export async function ensureServiceWorkerReady(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined") return null
  if (!("serviceWorker" in navigator)) return null
  try {
    // next-pwa auto-registers if enabled in production builds
    const reg = await navigator.serviceWorker.ready
    return reg
  } catch {
    return null
  }
}

export async function subscribeToPush(): Promise<PushSubscribeResult> {
  if (typeof window === "undefined") return { ok: false, reason: "no-window" }

  if (!("Notification" in window))
    return { ok: false, reason: "Notifications API unsupported" }

  // Ask permission first
  const permission = await Notification.requestPermission()
  if (permission !== "granted")
    return { ok: false, reason: `Permission: ${permission}` }

  const reg = await ensureServiceWorkerReady()
  if (!reg) return { ok: false, reason: "Service Worker not ready" }

  if (!("pushManager" in reg))
    return { ok: false, reason: "PushManager unsupported" }

  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapid || vapid.trim().length < 20)
    return { ok: false, reason: "Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY" }

  try {
    // Reuse existing subscription if present
    const existing = await reg.pushManager.getSubscription()
    const sub =
      existing ||
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      }))

    // Persist subscription in DB
    const supabase = getSupabase()
    if (supabase) {
      const me = (await supabase.auth.getUser()).data.user
      if (me) {
        await supabase.from("notification_settings").upsert({
          user_id: me.id,
          push_enabled: true,
          push_subscription: sub.toJSON(),
        })
      }
    }

    return { ok: true, permission, endpoint: sub.endpoint }
  } catch (e: unknown) {
    const reason = e instanceof Error ? e.message : "subscribe failed"
    return { ok: false, reason }
  }
}

export async function unsubscribeFromPush(): Promise<{
  ok: boolean
  reason?: string
}> {
  const reg = await ensureServiceWorkerReady()
  if (!reg) return { ok: false, reason: "Service Worker not ready" }
  try {
    const sub = await reg.pushManager.getSubscription()
    if (sub) await sub.unsubscribe()
    const supabase = getSupabase()
    if (supabase) {
      const me = (await supabase.auth.getUser()).data.user
      if (me) {
        await supabase.from("notification_settings").upsert({
          user_id: me.id,
          push_enabled: false,
          push_subscription: null,
        })
      }
    }
    return { ok: true }
  } catch (e: unknown) {
    const reason = e instanceof Error ? e.message : "unsubscribe failed"
    return { ok: false, reason }
  }
}

export function setupClientAudioBridge(onPlay?: () => void) {
  if (typeof window === "undefined") return () => {}
  const handler: (
    this: ServiceWorkerContainer,
    ev: MessageEvent<unknown>,
  ) => void = (ev) => {
    const data = ev.data
    if (typeof data === "object" && data !== null && "type" in data) {
      const type = (data as Record<string, unknown>).type
      if (type === "PLAY_NOTIFICATION_SOUND") onPlay?.()
    }
  }
  navigator.serviceWorker?.addEventListener?.("message", handler)

  return () =>
    navigator.serviceWorker?.removeEventListener?.("message", handler)
}
