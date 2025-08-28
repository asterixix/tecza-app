// Custom SW snippet imported by next-pwa's generated service worker
/* global self, clients */

self.addEventListener("push", (event) => {
  try {
    const payload = event.data ? event.data.json() : {}
    const title = payload.title || "Nowe powiadomienie"
    const body = payload.body || "Masz nowe powiadomienie w Tęcza.app"
    const url = payload.url || "/d"
    const icon = payload.icon || "/icons/tecza-icons/4.svg"
    const badge = payload.badge || "/icons/tecza-icons/4.svg"

    const showPromise = self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data: { url },
      vibrate: [100, 50, 100],
      tag: payload.tag || "tecza-notification",
    })

    // Also ping clients to play a local audio file (user gesture not required in SW)
    const pingClients = clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        list.forEach((client) =>
          client.postMessage({ type: "PLAY_NOTIFICATION_SOUND" }),
        )
      })

    event.waitUntil(Promise.all([showPromise, pingClients]))
  } catch {
    // no-op
  }
})

self.addEventListener("notificationclick", (event) => {
  const url =
    (event.notification &&
      event.notification.data &&
      event.notification.data.url) ||
    "/d"
  event.notification?.close()
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (
            client.url.includes(new URL(url, self.location.origin).pathname) &&
            "focus" in client
          ) {
            return client.focus()
          }
        }
        if (clients.openWindow) return clients.openWindow(url)
        return null
      }),
  )
})
