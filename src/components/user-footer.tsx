"use client"

export function UserFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="w-full border-t bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="leading-tight text-center sm:text-left">
          © <time aria-label="Rok">{year}</time> Tęcza.app — Zalogowano. Dziękujemy, że jesteś z nami.
        </p>
        <nav className="flex items-center gap-4" aria-label="Stopka">
          <a className="hover:underline" href="/dashboard">Pulpit</a>
          <a className="hover:underline" href="/settings">Ustawienia</a>
          <a className="hover:underline" href="/support">Wsparcie</a>
        </nav>
      </div>
    </footer>
  )
}
