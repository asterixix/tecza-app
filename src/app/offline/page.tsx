/* Offline fallback page for PWA */

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 md:px-6 py-10 text-center">
      <h1 className="text-2xl font-semibold">Jesteś offline</h1>
      <p className="text-muted-foreground mt-2">
        Wygląda na to, że nie masz połączenia z internetem. Spróbuj ponownie,
        gdy będziesz online.
      </p>
      <p className="text-xs text-muted-foreground mt-4">
        Niektóre zasoby mogą być dostępne w trybie offline, jeśli były już
        wcześniej odwiedzone.
      </p>
    </div>
  )
}
