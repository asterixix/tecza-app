import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Regulamin — Tęcza.app",
  description:
    "Regulamin korzystania z aplikacji Tęcza.app — zasady społeczności, prywatność, treści i bezpieczeństwo.",
  alternates: { canonical: "/tos" },
}

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Regulamin Tęcza.app
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Ostatnia aktualizacja:{" "}
          <time dateTime="2025-08-15">15 sierpnia 2025</time>
        </p>
      </header>

      <section className="prose dark:prose-invert prose-sm md:prose-base max-w-none">
        <p>
          Niniejszy Regulamin określa zasady korzystania z aplikacji Tęcza.app
          (&quot;Serwis&quot;). Korzystając z Serwisu, akceptujesz warunki
          opisane poniżej. Jeśli nie akceptujesz Regulaminu, nie korzystaj z
          Serwisu.
        </p>

        <h2>1. Konto i bezpieczeństwo</h2>
        <ul>
          <li>Do korzystania z Serwisu wymagane jest konto użytkownika.</li>
          <li>Odpowiadasz za bezpieczeństwo swojego konta i urządzenia.</li>
          <li>
            Zalecamy włączenie 2FA oraz ustawienie silnego hasła. W razie
            naruszenia bezpieczeństwa niezwłocznie je zgłoś.
          </li>
        </ul>

        <h2>2. Treści i moderacja</h2>
        <ul>
          <li>
            Ponosisz pełną odpowiedzialność za publikowane treści i przesyłane
            pliki.
          </li>
          <li>
            Zabronione są treści nienawistne, przemocowe, pornograficzne
            nieletnich, nawołujące do nienawiści, spam oraz treści naruszające
            prawo lub cudze prawa.
          </li>
          <li>
            Serwis może ukrywać lub usuwać treści naruszające Regulamin oraz
            podejmować działania moderacyjne, w tym blokadę konta.
          </li>
        </ul>

        <h2>3. Wiadomości i prywatność</h2>
        <ul>
          <li>
            Wiadomości prywatne są dostępne wyłącznie między połączonymi
            użytkownikami. Domyślnie stosujemy szyfrowanie po stronie klienta
            (E2EE) z użyciem kluczy rozmowy.
          </li>
          <li>
            Twoje klucze prywatne nie są wysyłane na serwer. Dla użycia na wielu
            urządzeniach możesz opcjonalnie skorzystać z sejfu klucza
            chronionego hasłem (zero‑knowledge): eksportuj i importuj
            zaszyfrowany klucz prywatny.
          </li>
          <li>
            W wyjątkowych sytuacjach możesz skorzystać ze ścieżki serwerowego
            szyfrowania i przechowywania (fallback). Serwis nie ma dostępu do
            treści E2EE.
          </li>
        </ul>

        <h2>4. Pliki, przetwarzanie wideo i limity</h2>
        <ul>
          <li>
            Obowiązują limity rozmiaru plików i szybkości wysyłania (rate
            limiting).
          </li>
          <li>
            Wideo może być transkodowane do nowoczesnych formatów (np. WebM) dla
            kompatybilności i oszczędności transferu.
          </li>
          <li>
            Serwis może wykonywać automatyczne skanowanie antywirusowe oraz
            odrzucać pliki potencjalnie niebezpieczne.
          </li>
        </ul>

        <h2>5. Usuwanie i retencja danych</h2>
        <ul>
          <li>
            Możesz usuwać swoje treści. W przypadku wiadomości dostępna jest
            opcja „Usuń bezpiecznie”.
          </li>
          <li>
            System podejmuje uzasadnione starania, aby bezpiecznie usunąć dane i
            powiązane pliki ze storage. Pewne kopie zapasowe/logi mogą być
            tymczasowo utrzymywane zgodnie z prawem.
          </li>
        </ul>

        <h2>6. Zasady społeczności</h2>
        <ul>
          <li>
            Szacunek dla osób LGBTQ+ i wszystkich użytkowników jest podstawą
            społeczności.
          </li>
          <li>
            Nadużycia, nękanie, doxing, groźby lub dyskryminacja skutkują
            konsekwencjami regulaminowymi.
          </li>
        </ul>

        <h2>7. Zmiany Regulaminu</h2>
        <p>
          Regulamin może się zmieniać. O istotnych zmianach poinformujemy w
          Serwisie. Dalsze korzystanie z Serwisu po publikacji zmian oznacza
          akceptację nowej wersji.
        </p>

        <h2>8. Kontakt</h2>
        <p>
          W sprawach związanych z Regulaminem i zgłoszeniami naruszeń skontaktuj
          się z nami pod adresem
          <a className="underline" href="mailto:kontakt@tecza.app">
            {" "}
            kontakt@tecza.app
          </a>
          .
        </p>
      </section>
    </div>
  )
}
