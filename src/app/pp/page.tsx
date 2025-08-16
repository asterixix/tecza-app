import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Polityka prywatności — Tęcza.app",
  description:
    "Polityka prywatności zgodna z RODO (GDPR) dla Tęcza.app: jakie dane przetwarzamy, cele, podstawy prawne, cookies i Twoje prawa.",
  alternates: { canonical: "/pp" },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Polityka prywatności</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Ostatnia aktualizacja: <time dateTime="2025-08-15">15 sierpnia 2025</time>
        </p>
      </header>

      <section className="prose dark:prose-invert prose-sm md:prose-base max-w-none">
        <p>
          Niniejsza Polityka prywatności opisuje zasady przetwarzania danych osobowych w Tęcza.app
          (&quot;Serwis&quot;) zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE)
          2016/679 (RODO).
        </p>

        <h2>1. Administrator danych</h2>
        <p>
          Administratorem danych jest Tęcza.app. Kontakt:{" "}
          <a className="underline" href="mailto:kontakt@tecza.app">
            kontakt@tecza.app
          </a>
          .
        </p>

        <h2>2. Zakres danych i źródła</h2>
        <ul>
          <li>Dane konta: e‑mail, nazwa użytkownika (username), widoczna nazwa (display name).</li>
          <li>
            Profil (opcjonalne): bio, zaimki, orientacja, tożsamość płciowa, media (avatar/cover).
          </li>
          <li>Treści i metadane: posty, komentarze, wiadomości, społeczności, wydarzenia.</li>
          <li>Pliki/obrazy/wideo: przechowywane w Supabase Storage.</li>
          <li>
            Techniczne: adres IP, identyfikatory urządzenia/przeglądarki, logi bezpieczeństwa.
          </li>
          <li>
            Cookies/pliki podobne: niezbędne do działania oraz – po zgodzie –
            analityczne/funkcjonalne.
          </li>
        </ul>

        <h2>3. Cele i podstawy prawne</h2>
        <ul>
          <li>
            Realizacja usługi (art. 6 ust. 1 lit. b RODO): uwierzytelnianie, konta, wiadomości,
            społeczności.
          </li>
          <li>
            Bezpieczeństwo i zapobieganie nadużyciom (art. 6 ust. 1 lit. f RODO): rate limiting,
            logi, moderacja treści, zabezpieczone usuwanie.
          </li>
          <li>
            Zgoda (art. 6 ust. 1 lit. a RODO): niezbędne zgody na pliki cookies nieniezbędne,
            powiadomienia push, analityka, oraz sejf klucza prywatnego w chmurze (jeśli użyty).
          </li>
          <li>Obowiązki prawne (art. 6 ust. 1 lit. c RODO): rozpatrywanie zgłoszeń i żądań.</li>
        </ul>

        <h2>4. Szyfrowanie i wiadomości</h2>
        <ul>
          <li>
            Wiadomości mogą być szyfrowane po stronie klienta (E2EE) kluczem rozmowy (AES‑GCM);
            klucz może być owinięty kluczami publicznymi (RSA‑OAEP) uczestników.
          </li>
          <li>
            Klucz prywatny nie jest wysyłany na serwer; możesz skorzystać z sejfu chronionego hasłem
            (&quot;passphrase vault&quot;) do przeniesienia klucza między urządzeniami.
          </li>
          <li>
            Wideo może być transkodowane po stronie serwera dla kompatybilności; pliki mogą być
            skanowane antywirusowo.
          </li>
        </ul>

        <h2>5. Odbiorcy danych</h2>
        <ul>
          <li>
            Dostawcy infrastruktury: Supabase (baza, storage, funkcje brzegowe), dostawca hostingu.
          </li>
          <li>Narzędzia analityczne (po zgodzie), np. Plausible — z poszanowaniem prywatności.</li>
          <li>Organy publiczne, gdy wymagają tego przepisy prawa.</li>
        </ul>

        <h2>6. Przechowywanie danych</h2>
        <ul>
          <li>
            Konto i treści: przez czas trwania konta i niezbędne okresy po usunięciu (logi/kopie).
          </li>
          <li>
            Wiadomości usunięte &quot;bezpiecznie&quot; są oznaczane do trwałego wymazania wraz z
            plikami powiązanymi.
          </li>
          <li>Cookies: zgodnie z kategorią i okresem wskazanym w polityce cookies.</li>
        </ul>

        <h2>7. Twoje prawa</h2>
        <p>
          Masz prawo do: dostępu, sprostowania, usunięcia, ograniczenia, przenoszenia, sprzeciwu
          oraz skargi do PUODO.
        </p>

        <h2>8. Cookies</h2>
        <ul>
          <li>Niezbędne: utrzymanie sesji, bezpieczeństwo, preferencje wymagane do działania.</li>
          <li>
            Funkcjonalne/analityczne: tylko po Twojej zgodzie; możesz wybrać &quot;tylko
            niezbędne&quot;.
          </li>
          <li>
            Zgody możesz zmienić usuwając odpowiedni plik cookie z przeglądarki i ponownie ładując
            stronę, lub poprzez ustawienia jeśli udostępnimy odpowiedni przełącznik.
          </li>
        </ul>

        <h2>9. Kontakt</h2>
        <p>
          W sprawach prywatności skontaktuj się:{" "}
          <a className="underline" href="mailto:kontakt@tecza.app">
            kontakt@tecza.app
          </a>
          .
        </p>
      </section>
    </div>
  )
}
