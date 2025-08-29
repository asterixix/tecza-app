import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Polityka prywatności i ochrona danych — Tęcza.app",
  description:
    "Polityka prywatności Tęcza.app zgodna z RODO: administrator, zakres i cele przetwarzania, podstawy prawne, cookies, prawa użytkowników, bezpieczeństwo, transfery i DSA.",
  alternates: { canonical: "/pp" },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Polityka Prywatności i Ochrony Danych Osobowych
        </h1>
        <p className="text-muted-foreground">
          Tęcza.app — Bezpieczna społeczność LGBTQ w Polsce
        </p>
        <p className="mt-2 text-muted-foreground text-sm">
          Data wejścia w życie:{" "}
          <time dateTime="2025-08-29">29 sierpnia 2025</time>
          {" • "}
          Ostatnia aktualizacja:{" "}
          <time dateTime="2025-08-29">29 sierpnia 2025</time>
        </p>
      </header>

      <section className="prose dark:prose-invert prose-sm md:prose-base max-w-none">
        <hr />

        <h2>1. Administrator Danych Osobowych</h2>
        <p>Administratorem danych osobowych jest:</p>
        <p>
          <strong>Artur Sendyka</strong>
          <br />
          Adres: Staniątki 15, 32-005 Staniątki, Polska
          <br />
          Telefon: <a href="tel:+48500705140">+48 500 705 140</a>
          <br />
          E-mail: <a href="mailto:kontakt@tecza.app">kontakt@tecza.app</a>
        </p>
        <p>
          Administrator działa zgodnie z ustawą o świadczeniu usług drogą
          elektroniczną oraz przepisami RODO.
        </p>

        <h2>2. Definicje</h2>
        <ul>
          <li>
            <strong>Aplikacja/Platforma</strong> – serwis internetowy Tęcza.app
            dostępny pod adresem
            <a
              className="underline"
              href="https://tecza.app"
              rel="noopener noreferrer"
              target="_blank"
            >
              {" "}
              https://tecza.app
            </a>
          </li>
          <li>
            <strong>Użytkownik</strong> – osoba fizyczna korzystająca z
            Aplikacji
          </li>
          <li>
            <strong>Dane osobowe</strong> – informacje o zidentyfikowanej lub
            możliwej do zidentyfikowania osobie fizycznej
          </li>
          <li>
            <strong>Przetwarzanie</strong> – operacje wykonywane na danych
            osobowych (zbieranie, utrwalanie, przechowywanie, ujawnianie,
            usuwanie itd.)
          </li>
          <li>
            <strong>Profilowanie</strong> – zautomatyzowane przetwarzanie danych
            w celu oceny lub prognozy zachowań
          </li>
        </ul>

        <h2>3. Zakres i Cel Przetwarzania Danych Osobowych</h2>
        <h3>3.1 Dane zbierane przy rejestracji i korzystaniu z Aplikacji</h3>
        <p>
          <strong>Rodzaje zbieranych danych:</strong>
        </p>
        <ul>
          <li>Adres e-mail (obowiązkowy)</li>
          <li>Nazwa użytkownika/pseudonim (obowiązkowy)</li>
          <li>Zaimki preferowane przez użytkownika (opcjonalnie)</li>
          <li>Informacje o tożsamości (opcjonalnie)</li>
          <li>Zdjęcie profilowe/awatar (opcjonalnie)</li>
          <li>Lokalizacja na poziomie miasta/regionu (opcjonalnie)</li>
          <li>
            Treści publikowane przez użytkownika (posty, komentarze, wiadomości)
          </li>
          <li>Preferencje prywatności i bezpieczeństwa</li>
        </ul>
        <p>
          <strong>Cele przetwarzania:</strong>
        </p>
        <ul>
          <li>Świadczenie usługi społecznościowej zgodnie z regulaminem</li>
          <li>Uwierzytelnianie użytkowników</li>
          <li>Umożliwienie komunikacji między użytkownikami</li>
          <li>Zapewnienie bezpieczeństwa i moderacja treści</li>
          <li>Personalizacja doświadczeń użytkownika</li>
          <li>Analiza funkcjonowania platformy w celu jej ulepszania</li>
          <li>Zapobieganie nadużyciom i działaniom niezgodnym z regulaminem</li>
        </ul>

        <h3>3.2 Dane techniczne automatycznie zbierane</h3>
        <p>
          <strong>Rodzaje danych:</strong>
        </p>
        <ul>
          <li>Adres IP</li>
          <li>Typ i wersja przeglądarki</li>
          <li>System operacyjny urządzenia</li>
          <li>Rozdzielczość ekranu</li>
          <li>Język przeglądarki</li>
          <li>Czas i data dostępu do Aplikacji</li>
          <li>Odwiedzane podstrony</li>
          <li>Źródło odwołania</li>
          <li>Informacje o błędach i wydajności</li>
        </ul>
        <p>
          <strong>Cele:</strong>
        </p>
        <ul>
          <li>Zapewnienie prawidłowego funkcjonowania Aplikacji</li>
          <li>Analiza ruchu i optymalizacja wydajności</li>
          <li>Wykrywanie i zapobieganie zagrożeniom bezpieczeństwa</li>
          <li>Statystyki użytkowania (zagregowane i zanonimizowane)</li>
        </ul>

        <h2>4. Podstawy Prawne Przetwarzania Danych</h2>
        <h3>4.1 Zgoda (Art. 6 ust. 1 lit. a RODO)</h3>
        <ul>
          <li>Opcjonalne dane profilowe</li>
          <li>Marketing bezpośredni (za zgodą)</li>
          <li>Pliki cookies marketingowe</li>
        </ul>
        <h3>4.2 Wykonanie umowy (Art. 6 ust. 1 lit. b RODO)</h3>
        <ul>
          <li>Świadczenie usług platformy</li>
          <li>Rejestracja i zarządzanie kontem</li>
          <li>Komunikacja między użytkownikami</li>
        </ul>
        <h3>4.3 Prawnie uzasadniony interes (Art. 6 ust. 1 lit. f RODO)</h3>
        <ul>
          <li>Bezpieczeństwo platformy</li>
          <li>Analiza i ulepszanie funkcjonalności</li>
          <li>Zapobieganie nadużyciom i oszustwom</li>
          <li>Archiwizacja treści w celach dowodowych</li>
        </ul>
        <h3>4.4 Obowiązek prawny (Art. 6 ust. 1 lit. c RODO)</h3>
        <ul>
          <li>Przechowywanie danych wymaganych przez prawo</li>
          <li>Współpraca z organami ścigania</li>
        </ul>

        <h2>5. Okres Przechowywania Danych</h2>
        <h3>5.1 Dane konta użytkownika</h3>
        <ul>
          <li>Aktywne konta: do momentu usunięcia konta przez użytkownika</li>
          <li>
            Nieaktywne konta: po 24 miesiącach braku aktywności konto może
            zostać usunięte po uprzednim powiadomieniu
          </li>
        </ul>
        <h3>5.2 Treści publikowane przez użytkowników</h3>
        <ul>
          <li>Posty publiczne: zgodnie z czasem życia konta</li>
          <li>
            Wiadomości prywatne: szyfrowane end-to-end, nie są przechowywane na
            serwerach
          </li>
          <li>Zgłoszenia i moderacja: 12 miesięcy</li>
        </ul>
        <h3>5.3 Dane techniczne i logi</h3>
        <ul>
          <li>Logi dostępu: 12 miesięcy</li>
          <li>Statystyki zagregowane: bez ograniczeń (zanonimizowane)</li>
        </ul>

        <h2>6. Prawa Użytkowników</h2>
        <p>Każdy użytkownik ma prawo do:</p>
        <h3>6.1 Prawo dostępu (Art. 15 RODO)</h3>
        <p>Informacje o przetwarzanych danych i kopia danych.</p>
        <h3>6.2 Prawo do sprostowania (Art. 16 RODO)</h3>
        <p>Korekta nieprawidłowych lub uzupełnienie niekompletnych danych.</p>
        <h3>6.3 Prawo do usunięcia (Art. 17 RODO)</h3>
        <p>Usunięcie danych w określonych przypadkach.</p>
        <h3>6.4 Prawo do ograniczenia przetwarzania (Art. 18 RODO)</h3>
        <p>Ograniczenie przetwarzania w określonych sytuacjach.</p>
        <h3>6.5 Prawo do przenoszenia danych (Art. 20 RODO)</h3>
        <p>
          Otrzymanie danych w formacie do przeniesienia do innego
          administratora.
        </p>
        <h3>6.6 Prawo sprzeciwu (Art. 21 RODO)</h3>
        <p>Sprzeciw wobec przetwarzania na podstawie uzasadnionego interesu.</p>
        <h3>6.7 Prawo do wycofania zgody</h3>
        <p>Możliwość wycofania zgody w dowolnym momencie.</p>
        <p>
          <strong>Sposób realizacji praw:</strong> kontakt z Administratorem —
          <a className="underline" href="mailto:kontakt@tecza.app">
            {" "}
            kontakt@tecza.app
          </a>
          , formularz w Aplikacji lub list na adres: Staniątki 15, 32-005
          Staniątki.
        </p>

        <h2>7. Polityka Cookies</h2>
        <h3>7.1 Czym są pliki cookies</h3>
        <p>Małe pliki tekstowe przechowywane na urządzeniu użytkownika.</p>
        <h3>7.2 Rodzaje używanych cookies</h3>
        <h4>7.2.1 Cookies niezbędne (zawsze aktywne)</h4>
        <ul>
          <li>Cookies sesji (identyfikacja zalogowanego użytkownika)</li>
          <li>Cookies bezpieczeństwa (ochrona przed atakami CSRF)</li>
          <li>Cookies preferencji (ustawienia języka i dostępności)</li>
        </ul>
        <h4>7.2.2 Cookies analityczne (opcjonalne)</h4>
        <ul>
          <li>Cookies wydajności</li>
          <li>Cookies statystyczne</li>
        </ul>
        <h4>7.2.3 Cookies zewnętrznych usługodawców</h4>
        <p>
          <strong>Supabase</strong>: cookies autoryzacyjne sb-*-auth-token
        </p>
        <p>
          <strong>Vercel</strong>: cookies wydajności i analityczne
        </p>
        <p>
          <strong>GitHub</strong>: brak bezpośrednich cookies w aplikacji
        </p>
        <p>
          <strong>OpenRouter (opcjonalnie)</strong>: brak cookies w przeglądarce
        </p>
        <h3>7.3 Zarządzanie cookies</h3>
        <ul>
          <li>Zarządzanie preferencjami cookies w ustawieniach konta</li>
          <li>Blokowanie/Usuwanie cookies w przeglądarce</li>
          <li>Uwaga: blokada cookies niezbędnych ogranicza funkcjonalność</li>
        </ul>

        <h2>8. Prawa Autorskie i Własność Intelektualna</h2>
        <h3>8.1 Prawa użytkowników do własnych treści</h3>
        <ul>
          <li>Użytkownicy zachowują pełne prawa autorskie</li>
          <li>Platforma nie rości sobie praw do treści użytkowników</li>
          <li>Możliwość usunięcia treści w dowolnym momencie</li>
        </ul>
        <h3>8.2 Licencja udzielana platformie</h3>
        <p>
          Niewyłączna, odwołalna licencja na wyświetlanie, przechowywanie i
          kopie zapasowe w celu świadczenia usługi.
        </p>
        <h3>8.3 Ochrona praw autorskich</h3>
        <p>
          Zgłoszenia naruszeń praw autorskich:{" "}
          <a href="mailto:kontakt@tecza.app">kontakt@tecza.app</a>
        </p>

        <h2>9. Bezpieczeństwo Danych</h2>
        <h3>9.1 Środki techniczne i organizacyjne</h3>
        <ul>
          <li>HTTPS/TLS dla wszystkich połączeń</li>
          <li>Szyfrowanie end-to-end dla wiadomości prywatnych</li>
          <li>Bezpieczne przechowywanie haseł (hash + salt)</li>
          <li>2FA (opcjonalnie), audyty dostępu, minimalizacja uprawnień</li>
          <li>Monitoring 24/7, wykrywanie zagrożeń, kopie zapasowe</li>
        </ul>
        <h3>9.2 Postępowanie w przypadku naruszeń</h3>
        <ul>
          <li>Zawiadomienie organu w 72h</li>
          <li>Informowanie użytkowników w razie wysokiego ryzyka</li>
          <li>Działania naprawcze i zapobiegawcze</li>
        </ul>

        <h2>10. Przekazywanie Danych Osobowych</h2>
        <h3>10.1 Podmioty uprawnione do otrzymania danych</h3>
        <p>
          <strong>Supabase Inc.</strong> – BaaS; USA (SCC), SOC 2, ISO 27001
          <br />
          <strong>Vercel Inc.</strong> – hosting, CDN; USA (SCC), GDPR/ISO
          <br />
          <strong>OpenRouter</strong> (opcjonalnie) – API AI; wyłączone logi
        </p>
        <h3>10.2 Przekazywanie do krajów trzecich</h3>
        <ul>
          <li>Podstawy: SCC, decyzje o adekwatności, zabezpieczenia</li>
          <li>Kraje: USA i inne zgodnie z prawem UE</li>
        </ul>
        <h3>10.3 Organy publiczne</h3>
        <ul>
          <li>Na podstawie orzeczeń sądów i żądań zgodnych z prawem</li>
        </ul>

        <h2>11. Zgodność z Aktem o Usługach Cyfrowych (DSA)</h2>
        <h3>11.1 Transparentność algorytmów</h3>
        <ul>
          <li>Informacje o systemach rekomendacji</li>
          <li>Kontrola nad personalizacją</li>
          <li>Alternatywne widoki treści (chronologiczny, wg tematów)</li>
        </ul>
        <h3>11.2 Zarządzanie treścią i moderacja</h3>
        <ul>
          <li>Mechanizm zgłaszania treści</li>
          <li>Szybka reakcja i przejrzyste odwołania</li>
          <li>
            Ochrona nieletnich (ograniczenia reklam, prywatność, kontrola
            rodzicielska)
          </li>
        </ul>
        <h3>11.3 Raporty przejrzystości</h3>
        <ul>
          <li>Roczne statystyki i informacje o bezpieczeństwie</li>
        </ul>

        <h2>12. Prawa Specjalne dla Dzieci i Młodzieży</h2>
        <h3>12.1 Wiek minimalny</h3>
        <p>13 lat; poniżej 16 lat wymagana zgoda opiekuna.</p>
        <h3>12.2 Dodatkowe ochrony</h3>
        <ul>
          <li>Domyślnie bardziej restrykcyjne ustawienia</li>
          <li>Ograniczenia publikacji danych kontaktowych</li>
          <li>Dodatkowa moderacja treści</li>
          <li>Zakaz targetowania reklamowego</li>
        </ul>

        <h2>13. Kontakt w Sprawach Ochrony Danych</h2>
        <h3>13.1 Kontakt z Administratorem</h3>
        <p>
          <strong>Artur Sendyka</strong>
          <br />
          E-mail: <a href="mailto:kontakt@tecza.app">kontakt@tecza.app</a>
          <br />
          Telefon: <a href="tel:+48500705140">+48 500 705 140</a>
          <br />
          Adres: Staniątki 15, 32-005 Staniątki
        </p>
        <p>
          <strong>Czas odpowiedzi:</strong> do 30 dni od otrzymania zapytania
        </p>
        <h3>13.2 Prawo do wniesienia skargi</h3>
        <p>
          <strong>Prezes Urzędu Ochrony Danych Osobowych</strong>
          <br />
          ul. Stawki 2, 00-193 Warszawa
          <br />
          Telefon: <a href="tel:+48225310300">+48 22 531 03 00</a>
          <br />
          E-mail:{" "}
          <a href="mailto:kancelaria@uodo.gov.pl">kancelaria@uodo.gov.pl</a>
          <br />
          Strona:{" "}
          <a
            href="https://uodo.gov.pl"
            target="_blank"
            rel="noopener noreferrer"
          >
            uodo.gov.pl
          </a>
        </p>

        <h2>14. Aktualizacje Polityki Prywatności</h2>
        <h3>14.1 Zmiany w Polityce</h3>
        <ul>
          <li>Zmiany w przepisach prawa</li>
          <li>Nowe funkcjonalności platformy</li>
          <li>Zmiany w usługach zewnętrznych</li>
          <li>Uwagi organów nadzorczych</li>
        </ul>
        <h3>14.2 Informowanie o zmianach</h3>
        <ul>
          <li>Powiadomienie w aplikacji (≥ 14 dni wcześniej)</li>
          <li>E-mail dla znaczących zmian</li>
          <li>Publikacja na stronie głównej</li>
        </ul>
        <p>
          <strong>Istotne zmiany</strong> mogą wymagać ponownej zgody.
        </p>

        <h2>15. Przepisy Końcowe</h2>
        <h3>15.1 Rozstrzyganie sporów</h3>
        <ul>
          <li>RODO</li>
          <li>Ustawa o ochronie danych osobowych (10.05.2018)</li>
          <li>Ustawa o świadczeniu usług drogą elektroniczną (18.07.2002)</li>
          <li>Kodeks cywilny</li>
          <li>Inne obowiązujące przepisy PL i UE</li>
        </ul>
        <h3>15.2 Właściwość sądów</h3>
        <p>Sądy polskie, zgodnie z właściwością miejscową.</p>
        <h3>15.3 Języki</h3>
        <p>
          Dokument sporządzony w języku polskim. W razie tłumaczeń – wersja
          polska jest wiążąca.
        </p>

        <hr />
        <p className="text-sm text-muted-foreground">
          Data ostatniej aktualizacji:{" "}
          <time dateTime="2025-08-29">29 sierpnia 2025</time>
          <br />
          Wersja dokumentu: 2.0
        </p>
      </section>
    </div>
  )
}
