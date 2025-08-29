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
          REGULAMIN PLATFORMY SPOŁECZNOŚCIOWEJ TĘCZA.APP
        </h1>
        <div className="mt-2 text-muted-foreground text-sm space-x-2">
          <span>
            Obowiązuje od: <time dateTime="2025-08-29">29 sierpnia 2025</time>
          </span>
          <span aria-hidden="true">•</span>
          <span>
            Ostatnia aktualizacja:{" "}
            <time dateTime="2025-08-29">29 sierpnia 2025</time>
          </span>
          <span aria-hidden="true">•</span>
          <span>Wersja: 1.0</span>
        </div>
      </header>

      <section className="prose dark:prose-invert prose-sm md:prose-base max-w-none">
        <hr />

        <h2>ROZDZIAŁ I - POSTANOWIENIA OGÓLNE</h2>
        <h3>§ 1. Definicje</h3>
        <p>W niniejszym Regulaminie stosowane są następujące definicje:</p>
        <ol>
          <li>
            <strong>Aplikacja/Platforma/Serwis</strong> – serwis internetowy
            Tęcza.app dostępny pod adresem https://tecza.app, stanowiący
            platformę społecznościową przeznaczoną dla społeczności LGBTQ+ w
            Polsce.
          </li>
          <li>
            <strong>Usługodawca/Administrator</strong> – Artur Sendyka, osoba
            fizyczna, świadczący usługi drogą elektroniczną za pośrednictwem
            Platformy.
          </li>
          <li>
            <strong>Użytkownik/Usługobiorca</strong> – osoba fizyczna
            posiadająca pełną zdolność do czynności prawnych, korzystająca z
            Platformy na podstawie niniejszego Regulaminu.
          </li>
          <li>
            <strong>Konto Użytkownika</strong> – indywidualne konto przypisane
            Użytkownikowi, umożliwiające dostęp do funkcji Platformy po
            dokonaniu rejestracji i uwierzytelnienia.
          </li>
          <li>
            <strong>Treści Użytkownika</strong> – wszelkie informacje, dane,
            teksty, grafiki, zdjęcia, filmy, audio, linki i inne materiały
            przekazywane, publikowane lub udostępniane przez Użytkownika za
            pośrednictwem Platformy.
          </li>
          <li>
            <strong>Społeczność LGBTQ+</strong> – osoby o różnorodnych
            tożsamościach płciowych i orientacjach seksualnych, w tym osoby
            lesbijskie, gejowskie, biseksualne, transpłciowe, queer, niebinarne
            i inne osoby identyfikujące się ze społecznością.
          </li>
          <li>
            <strong>Zaimki</strong> – wyrażenia językowe określające tożsamość
            płciową Użytkownika (np. ona/jej, on/jego, ono/jego, oni/ich).
          </li>
          <li>
            <strong>Grupa Wsparcia</strong> – tematyczna społeczność w ramach
            Platformy, zorganizowana wokół wspólnych zainteresowań, lokalizacji
            lub potrzeb wsparcia.
          </li>
          <li>
            <strong>Moderacja Treści</strong> – proces weryfikacji, oceny i
            ewentualnego usuwania lub ograniczania dostępu do Treści Użytkownika
            zgodnie z niniejszym Regulaminem i obowiązującymi przepisami prawa.
          </li>
          <li>
            <strong>Treści Nielegalne</strong> – treści niezgodne z powszechnie
            obowiązującym prawem, w tym treści nawołujące do przemocy, mowa
            nienawiści, treści naruszające prawa autorskie, pornografia
            dziecięca oraz inne treści zakazane przez polskie lub unijne prawo.
          </li>
          <li>
            <strong>Szyfrowanie End-to-End</strong> – technologia
            zabezpieczająca komunikację prywatną między Użytkownikami, przy
            której tylko nadawca i odbiorca mają dostęp do treści wiadomości.
          </li>
          <li>
            <strong>DSA</strong> – Rozporządzenie Parlamentu Europejskiego i
            Rady (UE) 2022/2065 z dnia 19 października 2022 r. w sprawie
            jednolitego rynku usług cyfrowych (akt o usługach cyfrowych).
          </li>
        </ol>

        <h3>§ 2. Przedmiot i zakres usług</h3>
        <ol>
          <li>
            <strong>Przedmiot działalności:</strong>
            <ul>
              <li>
                Platforma świadczy usługi społecznościowe drogą elektroniczną,
                umożliwiając tworzenie profili, komunikację między
                Użytkownikami, publikowanie treści, uczestnictwo w grupach
                tematycznych i korzystanie z funkcji wspierających społeczność
                LGBTQ+.
              </li>
            </ul>
          </li>
          <li>
            <strong>Główne funkcjonalności:</strong>
            <ul>
              <li>
                Rejestracja i prowadzenie indywidualnych profili użytkowników
              </li>
              <li>Kontrola widoczności i dostępności treści</li>
            </ul>
          </li>
          <li>
            <strong>Charakter usług:</strong>
            <ul>
              <li>Usługi świadczone są nieodpłatnie</li>
              <li>
                Rozwój odbywa się w sposób transparentny z otwartością na wkład
                społeczności
              </li>
            </ul>
          </li>
        </ol>

        <h3>§ 3. Podstawa prawna i zgodność</h3>
        <ol>
          <li>
            <strong>Podstawy prawne działania:</strong>
            <ul>
              <li>
                Ustawa z dnia 18 lipca 2002 r. o świadczeniu usług drogą
                elektroniczną
              </li>
              <li>
                Ustawa z dnia 4 lutego 1994 r. o prawie autorskim i prawach
                pokrewnych
              </li>
            </ul>
          </li>
          <li>
            <strong>Zgodność z DSA:</strong>
            <ul>
              <li>
                Platforma działa zgodnie z wymogami Aktu o Usługach Cyfrowych
              </li>
              <li>
                Użytkownicy mają prawo do odwołania od decyzji moderacyjnych
              </li>
            </ul>
          </li>
        </ol>

        <hr />

        <h2>ROZDZIAŁ II - WARUNKI KORZYSTANIA Z PLATFORMY</h2>
        <h3>§ 4. Rejestracja i tworzenie konta</h3>
        <ol>
          <li>
            <strong>Wymagania rejestracji:</strong>
            <ul>
              <li>
                Minimalny wiek: 13 lat (użytkownicy poniżej 16 lat wymagają
                zgody rodzica/opiekuna)
              </li>
              <li>Utworzenie unikalnej nazwy użytkownika</li>
            </ul>
          </li>
          <li>
            <strong>Proces rejestracji:</strong>
            <ul>
              <li>Wypełnienie formularza rejestracyjnego</li>
              <li>Ustawienie preferencji prywatności</li>
            </ul>
          </li>
          <li>
            <strong>Weryfikacja wieku zgodnie z wymogami UE:</strong>
            <ul>
              <li>
                Dla użytkowników deklarujących wiek poniżej 18 lat mogą być
                wymagane dodatkowe weryfikacje
              </li>
              <li>
                Weryfikacja odbywa się z zachowaniem zasad ochrony prywatności
              </li>
            </ul>
          </li>
          <li>
            <strong>Odpowiedzialność za dane:</strong>
            <ul>
              <li>
                Użytkownik zobowiązuje się do podania prawdziwych danych
                osobowych
              </li>
              <li>
                Użytkownik jest zobowiązany do niezwłocznego informowania o
                zmianach danych
              </li>
            </ul>
          </li>
        </ol>

        <h3>§ 5. Konto użytkownika i bezpieczeństwo</h3>
        <ol>
          <li>
            <strong>Zarządzanie kontem:</strong>
            <ul>
              <li>Każdy Użytkownik może posiadać tylko jedno aktywne konto</li>
              <li>
                Użytkownik ponosi pełną odpowiedzialność za działania
                podejmowane z jego konta
              </li>
            </ul>
          </li>
          <li>
            <strong>Zabezpieczenia konta:</strong>
            <ul>
              <li>Obowiązek używania silnych haseł</li>
              <li>
                Monitoring podejrzanych logowań i powiadomienia bezpieczeństwa
              </li>
            </ul>
          </li>
          <li>
            <strong>Nieaktywność konta:</strong>
            <ul>
              <li>
                Konta nieaktywne przez 24 miesiące mogą zostać automatycznie
                usunięte po uprzednim powiadomieniu
              </li>
              <li>
                Użytkownik ma prawo do reaktywacji konta w ciągu 30 dni od
                powiadomienia
              </li>
            </ul>
          </li>
        </ol>

        <hr />

        <h2>ROZDZIAŁ III - PRAWA I OBOWIĄZKI UŻYTKOWNIKÓW</h2>
        <h3>§ 6. Prawa użytkowników</h3>
        <ol>
          <li>
            <strong>Prawa podstawowe:</strong>
            <ul>
              <li>Bezpłatny dostęp do wszystkich funkcjonalności Platformy</li>
              <li>Prawo do zgłaszania nieodpowiednich treści i zachowań</li>
            </ul>
          </li>
          <li>
            <strong>Prawa dotyczące treści:</strong>
            <ul>
              <li>
                <strong>Pełne zachowanie praw autorskich</strong> do wszystkich
                publikowanych treści
              </li>
              <li>Prawo do exportu własnych danych zgodnie z RODO</li>
            </ul>
          </li>
          <li>
            <strong>Prawa społecznościowe:</strong>
            <ul>
              <li>Prawo do tworzenia i uczestniczenia w grupach wsparcia</li>
              <li>Dostęp do lokalnych wydarzeń i mapy aktywności</li>
            </ul>
          </li>
          <li>
            <strong>Prawa proceduralne:</strong>
            <ul>
              <li>Prawo do odwołania od decyzji moderacyjnych</li>
              <li>Możliwość składania skarg do organów nadzorczych</li>
            </ul>
          </li>
        </ol>

        <h3>§ 7. Obowiązki użytkowników</h3>
        <ol>
          <li>
            <strong>Obowiązki podstawowe:</strong>
            <ul>
              <li>Korzystanie z Platformy zgodnie z niniejszym Regulaminem</li>
              <li>Nienaruszanie bezpieczeństwa i stabilności Platformy</li>
            </ul>
          </li>
          <li>
            <strong>Obowiązki dotyczące treści:</strong>
            <ul>
              <li>
                Publikowanie tylko treści, do których Użytkownik posiada
                odpowiednie prawa
              </li>
              <li>
                Nieudostępnianie treści wprowadzających w błąd lub fake news
              </li>
            </ul>
          </li>
          <li>
            <strong>Obowiązki społecznościowe:</strong>
            <ul>
              <li>Budowanie pozytywnej i wspierającej społeczności</li>
              <li>Zgłaszanie nieodpowiednich zachowań zgodnie z procedurami</li>
            </ul>
          </li>
          <li>
            <strong>Obowiązki techniczne:</strong>
            <ul>
              <li>
                Korzystanie z aktualnych i bezpiecznych wersji oprogramowania
              </li>
              <li>Współpraca w zakresie identyfikacji i usuwania błędów</li>
            </ul>
          </li>
        </ol>

        <hr />

        <h2>ROZDZIAŁ IV - ZASADY PUBLIKOWANIA TREŚCI</h2>
        <h3>§ 8. Rodzaje dozwolonych treści</h3>
        <ol>
          <li>
            <strong>Treści tekstowe:</strong>
            <ul>
              <li>Posty, komentarze, opisy profili</li>
              <li>Wyrażanie opinii i poglądów w granicach prawa</li>
            </ul>
          </li>
          <li>
            <strong>Treści multimedialne:</strong>
            <ul>
              <li>Zdjęcia i grafiki (własne lub z odpowiednimi prawami)</li>
              <li>Memy i treści humorystyczne (nieobrazowe)</li>
            </ul>
          </li>
          <li>
            <strong>Treści edukacyjne i informacyjne:</strong>
            <ul>
              <li>Materiały dotyczące tematyki LGBTQ+</li>
              <li>Materiały zwiększające świadomość społeczną</li>
            </ul>
          </li>
          <li>
            <strong>Treści społecznościowe:</strong>
            <ul>
              <li>Informacje o wydarzeniach lokalnych</li>
              <li>Dzielenie się doświadczeniami osobistymi</li>
            </ul>
          </li>
        </ol>

        <h3>§ 9. Prawa autorskie i licencje</h3>
        <ol>
          <li>
            <strong>Zachowanie praw autorskich:</strong>
            <ul>
              <li>
                Użytkownicy zachowują <strong>pełne prawa autorskie</strong> do
                wszystkich publikowanych treści
              </li>
              <li>
                Użytkownicy mogą w dowolnej chwili usunąć swoje treści lub
                zażądać ich usunięcia
              </li>
            </ul>
          </li>
          <li>
            <strong>Licencja udzielana Platformie:</strong>
            <ul>
              <li>
                Publikując treści, Użytkownik udziela Platformie
                <strong>niewyłącznej, odwołalnej licencji</strong> na:
              </li>
            </ul>
          </li>
          <li>
            <strong>Ograniczenia licencji:</strong>
            <ul>
              <li>
                Licencja ograniczona jest wyłącznie do celów funkcjonowania
                Platformy
              </li>
              <li>
                Platforma nie może przenosić licencji na osoby trzecie bez zgody
              </li>
            </ul>
          </li>
          <li>
            <strong>Treści osób trzecich:</strong>
            <ul>
              <li>
                Użytkownik może publikować treści osób trzecich tylko za ich
                zgodą lub na podstawie dozwolonego użytku
              </li>
              <li>
                Konieczność podania źródła w przypadku cytowania lub
                wykorzystania cudzych treści
              </li>
            </ul>
          </li>
        </ol>

        <h3>§ 10. Standardy społeczności i moderacja</h3>
        <ol>
          <li>
            <strong>Podstawowe zasady społeczności:</strong>
            <ul>
              <li>Szacunek dla różnorodności tożsamości i orientacji</li>
              <li>Wspieranie pozytywnych interakcji i wzajemnej pomocy</li>
            </ul>
          </li>
          <li>
            <strong>Kultura dyskusji:</strong>
            <ul>
              <li>Prowadzenie konstruktywnych i merytorycznych dyskusji</li>
              <li>
                Używanie odpowiedniego języka dostosowanego do różnorodnych
                odbiorców
              </li>
            </ul>
          </li>
        </ol>

        <hr />

        <h2>ROZDZIAŁ V - ZAKAZY I OGRANICZENIA</h2>
        <h3>§ 11. Treści zabronione</h3>
        <ol>
          <li>
            <strong>Treści nielegalne:</strong>
            <ul>
              <li>
                Treści nawołujące do przemocy lub działań niezgodnych z prawem
              </li>
              <li>Materiały związane z terroryzmem lub ekstremizmem</li>
            </ul>
          </li>
          <li>
            <strong>Treści szkodliwe społecznie:</strong>
            <ul>
              <li>Fake news i celowa dezinformacja</li>
              <li>Treści gloryfikujące przemoc lub zachowania antyspołeczne</li>
            </ul>
          </li>
          <li>
            <strong>Treści naruszające prywatność:</strong>
            <ul>
              <li>Publikowanie danych osobowych osób trzecich bez zgody</li>
              <li>
                Nieautoryzowane publikowanie zdjęć lub nagrań osób trzecich
              </li>
            </ul>
          </li>
          <li>
            <strong>Treści komercyjne i spam:</strong>
            <ul>
              <li>Nieautoryzowana reklama produktów lub usług</li>
              <li>Próby phishingu i kradzieży danych</li>
            </ul>
          </li>
          <li>
            <strong>Treści szkodliwe dla społeczności LGBTQ+:</strong>
            <ul>
              <li>
                Terapie konwersyjne i pseudonaukowe &quot;leczenie&quot;,
                orientacji lub tożsamości
              </li>
              <li>
                Deliberately misgendering i używanie niewłaściwych zaimków
              </li>
            </ul>
          </li>
        </ol>

        <h3>§ 12. Zachowania zabronione</h3>
        <ol>
          <li>
            <strong>Nękanie i cyberprzemoc:</strong>
            <ul>
              <li>Systematyczne nękanie innych użytkowników</li>
              <li>Tworzenie fałszywych kont w celu nękania</li>
            </ul>
          </li>
          <li>
            <strong>Naruszenia bezpieczeństwa:</strong>
            <ul>
              <li>Próby włamania do kont innych użytkowników</li>
              <li>
                Prowadzenie działań mogących zakłócić funkcjonowanie usługi
              </li>
            </ul>
          </li>
          <li>
            <strong>Nadużycia systemu:</strong>
            <ul>
              <li>Tworzenie wielu kont przez jedną osobę (multikonto)</li>
              <li>Próby obejścia kar i ograniczeń</li>
            </ul>
          </li>
          <li>
            <strong>Działania komercyjne:</strong>
            <ul>
              <li>Prowadzenie nieautoryzowanej działalności gospodarczej</li>
              <li>Zbieranie danych użytkowników do celów komercyjnych</li>
            </ul>
          </li>
        </ol>

        <h3>§ 13. Konsekwencje naruszeń</h3>
        <ol>
          <li>
            <strong>Rodzaje sankcji:</strong>
            <ul>
              <li>
                <strong>Ostrzeżenie</strong> - pierwsze lub drobne naruszenia
              </li>
              <li>
                <strong>Usunięcie treści</strong> - natychmiastowe usunięcie
                treści naruszających Regulamin
              </li>
            </ul>
          </li>
          <li>
            <strong>Kryteria stosowania sankcji:</strong>
            <ul>
              <li>Charakter i wagę naruszenia</li>
              <li>Intencje Użytkownika i stopień świadomości naruszenia</li>
            </ul>
          </li>
          <li>
            <strong>Procedura stosowania sankcji:</strong>
            <ul>
              <li>
                Użytkownik otrzymuje powiadomienie o naruszeniu z jego opisem
              </li>
              <li>Użytkownik ma prawo do odwołania zgodnie z § 17</li>
            </ul>
          </li>
          <li>
            <strong>Recydywa i zaostrzanie kar:</strong>
            <ul>
              <li>Powtarzające się naruszenia skutkują surowszymi sankcjami</li>
              <li>
                Poważne jednorazowe naruszenia mogą skutkować natychmiastowym
                zablokowaniem
              </li>
            </ul>
          </li>
        </ol>

        <hr />

        <h2>ROZDZIAŁ VI - MODERACJA TREŚCI I PROCEDURY ZGŁASZANIA</h2>
        <h3>§ 14. System moderacji treści</h3>
        <ol>
          <li>
            <strong>Zasady moderacji zgodne z DSA:</strong>
            <ul>
              <li>
                Moderacja treści odbywa się zgodnie z wymogami Aktu o Usługach
                Cyfrowych
              </li>
              <li>
                Wszystkie decyzje moderacyjne są dokumentowane i uzasadniane
              </li>
            </ul>
          </li>
          <li>
            <strong>Rodzaje moderacji:</strong>
            <ul>
              <li>
                <strong>Moderacja proaktywna</strong> - automatyczne wykrywanie
                potencjalnie szkodliwych treści
              </li>
              <li>
                <strong>Moderacja specjalistyczna</strong> - dla treści
                wymagających eksperckiej oceny
              </li>
            </ul>
          </li>
          <li>
            <strong>Proces moderacji:</strong>
            <ul>
              <li>Zgłoszenie lub automatyczna detekcja treści</li>
              <li>Możliwość odwołania w przewidzianym trybie</li>
            </ul>
          </li>
          <li>
            <strong>Transparentność moderacji:</strong>
            <ul>
              <li>Publiczne statystyki dotyczące moderowanych treści</li>
              <li>Możliwość wglądu w podstawy prawne decyzji</li>
            </ul>
          </li>
        </ol>

        <h3>§ 15. Procedury zgłaszania</h3>
        <ol>
          <li>
            <strong>Sposób zgłaszania:</strong>
            <ul>
              <li>Przycisk &quot;Zgłoś&quot; przy każdej treści lub profilu</li>
              <li>Komunikat prywatny do zespołu moderacji</li>
            </ul>
          </li>
          <li>
            <strong>Informacje wymagane w zgłoszeniu:</strong>
            <ul>
              <li>Precyzyjne wskazanie treści lub zachowania</li>
              <li>Dowody naruszenia (screenshoty, linki)</li>
            </ul>
          </li>
          <li>
            <strong>Rodzaje zgłoszeń:</strong>
            <ul>
              <li>
                <strong>Treści nielegalne</strong> - naruszające polskie lub
                unijne prawo
              </li>
              <li>
                <strong>Spam i dezinformacja</strong> - treści o charakterze
                masowym lub manipulacyjnym
              </li>
            </ul>
          </li>
          <li>
            <strong>Czas reakcji na zgłoszenia:</strong>
            <ul>
              <li>
                <strong>Treści nielegalne</strong>: do 24 godzin
              </li>
              <li>
                <strong>Prawa autorskie</strong>: do 7 dni roboczych
              </li>
            </ul>
          </li>
        </ol>

        <h3>§ 16. Zaufane podmioty sygnalizujące</h3>
        <ol>
          <li>
            <strong>Definicja zaufanych podmiotów:</strong>
            <ul>
              <li>
                Organizacje pozarządowe specjalizujące się w ochronie praw
                człowieka
              </li>
              <li>Eksperci ds. bezpieczeństwa w internecie</li>
            </ul>
          </li>
          <li>
            <strong>Procedura nadawania statusu:</strong>
            <ul>
              <li>Wniosek organizacji z przedstawieniem kompetencji</li>
              <li>Regularne przeglądy statusu (co 12 miesięcy)</li>
            </ul>
          </li>
          <li>
            <strong>Przywileje zaufanych podmiotów:</strong>
            <ul>
              <li>Priorytetowe rozpatrywanie zgłoszeń (w ciągu 6 godzin)</li>
              <li>Udział w kształtowaniu polityk moderacyjnych</li>
            </ul>
          </li>
        </ol>

        <hr />

        <h2>ROZDZIAŁ VII - PROCEDURY ODWOŁAWCZE I REKLAMACYJNE</h2>
        <h3>§ 17. Prawo do odwołania</h3>
        <ol>
          <li>
            <strong>Zakres prawa do odwołania:</strong>
            <ul>
              <li>Decyzje o usunięciu lub ukryciu treści</li>
              <li>
                Inne działania moderacyjne wpływające na korzystanie z Platformy
              </li>
            </ul>
          </li>
          <li>
            <strong>Termin na wniesienie odwołania:</strong>
            <ul>
              <li>
                <strong>30 dni</strong> od otrzymania powiadomienia o decyzji
                moderacyjnej
              </li>
              <li>
                Możliwość przedłużenia terminu w uzasadnionych przypadkach
              </li>
            </ul>
          </li>
          <li>
            <strong>Forma i treść odwołania:</strong>
            <ul>
              <li>Formularz odwołania dostępny na Platformie</li>
              <li>Możliwość dołączenia dodatkowych dowodów lub wyjaśnień</li>
            </ul>
          </li>
          <li>
            <strong>Proces rozpatrzenia odwołania:</strong>
            <ul>
              <li>Potwierdzenie otrzymania odwołania (w ciągu 48 godzin)</li>
              <li>Wydanie ostatecznej decyzji z pełnym uzasadnieniem</li>
            </ul>
          </li>
        </ol>

        <h3>§ 18. System reklamacji wewnętrznych</h3>
        <ol>
          <li>
            <strong>Przedmiot reklamacji:</strong>
            <ul>
              <li>
                Działanie lub zaniechanie Platformy naruszające prawa
                Użytkownika
              </li>
              <li>Problemy z ochroną danych osobowych</li>
            </ul>
          </li>
          <li>
            <strong>Sposób składania reklamacji:</strong>
            <ul>
              <li>Dedykowany formularz reklamacyjny na Platformie</li>
              <li>
                Osobiście w godzinach urzędowania (po uprzednim umówieniu)
              </li>
            </ul>
          </li>
          <li>
            <strong>Wymagania reklamacji:</strong>
            <ul>
              <li>Dokładny opis problemu i okoliczności</li>
              <li>Dane kontaktowe do komunikacji</li>
            </ul>
          </li>
          <li>
            <strong>Procedura rozpatrzenia:</strong>
            <ul>
              <li>Potwierdzenie otrzymania reklamacji (w ciągu 48 godzin)</li>
              <li>Wydanie odpowiedzi wraz z rozstrzygnięciem (do 30 dni)</li>
            </ul>
          </li>
        </ol>

        <h3>§ 19. Mediacja i polubowne rozwiązywanie sporów</h3>
        <ol>
          <li>
            <strong>Alternatywne metody rozwiązywania sporów:</strong>
            <ul>
              <li>Mediacja prowadzona przez niezależnych mediatorów</li>
              <li>Współpraca z organizacjami społeczności LGBTQ+</li>
            </ul>
          </li>
          <li>
            <strong>Certyfikowani mediatorzy:</strong>
            <ul>
              <li>Lista certyfikowanych podmiotów dostępna na Platformie</li>
              <li>Wiążąca moc ustaleń mediacyjnych po akceptacji stron</li>
            </ul>
          </li>
          <li>
            <strong>Postępowanie mediacyjne:</strong>
            <ul>
              <li>
                Wniosek o mediację składany po wyczerpaniu procedur wewnętrznych
              </li>
              <li>Protokół z ustaleń przekazywany obu stronom</li>
            </ul>
          </li>
        </ol>

        <hr />

        <h2>ROZDZIAŁ VIII - OCHRONA NIELETNICH I BEZPIECZEŃSTWO</h2>
        <h3>§ 20. Szczególna ochrona użytkowników nieletnich</h3>
        <ol>
          <li>
            <strong>Definicja użytkowników nieletnich:</strong>
            <ul>
              <li>Osoby poniżej 18. roku życia</li>
              <li>Dodatkowe zabezpieczenia dla osób poniżej 13. roku życia</li>
            </ul>
          </li>
          <li>
            <strong>Weryfikacja wieku:</strong>
            <ul>
              <li>Obowiązkowa deklaracja wieku przy rejestracji</li>
              <li>Współpraca z rodzicami/opiekunami w procesie weryfikacji</li>
            </ul>
          </li>
          <li>
            <strong>Dodatkowe zabezpieczenia dla nieletnich:</strong>
            <ul>
              <li>Domyślnie bardziej restrykcyjne ustawienia prywatności</li>
              <li>
                Zakaz targetowania reklamowego (jeśli w przyszłości zostanie
                wprowadzone)
              </li>
            </ul>
          </li>
          <li>
            <strong>Edukacja i wsparcie:</strong>
            <ul>
              <li>
                Materiały edukacyjne o bezpiecznym korzystaniu z internetu
              </li>
              <li>Regularne kampanie zwiększające świadomość</li>
            </ul>
          </li>
        </ol>

        <h3>§ 21. Procedury ochrony przed szkodliwymi treściami</h3>
        <ol>
          <li>
            <strong>Automatyczne filtrowanie:</strong>
            <ul>
              <li>Systemy wykrywania treści nieodpowiednich dla nieletnich</li>
              <li>Identyfikacja potencjalnych zagrożeń (grooming, bullying)</li>
            </ul>
          </li>
          <li>
            <strong>Kontrola rodzicielska:</strong>
            <ul>
              <li>Możliwość ustawienia ograniczeń przez rodziców/opiekunów</li>
              <li>Dostęp do raportów aktywności</li>
            </ul>
          </li>
          <li>
            <strong>Zgłaszanie zagrożeń:</strong>
            <ul>
              <li>Priorytetowe traktowanie zgłoszeń dotyczących nieletnich</li>
              <li>Wsparcie psychologiczne dla ofiar</li>
            </ul>
          </li>
        </ol>

        <h3>§ 22. Współpraca z organami ścigania</h3>
        <ol>
          <li>
            <strong>Obowiązki zgłoszeniowe:</strong>
            <ul>
              <li>
                Natychmiastowe zgłaszanie podejrzeń przestępstw wobec nieletnich
              </li>
              <li>
                Zgłaszanie przypadków mowy nienawiści skutkujących realnym
                zagrożeniem
              </li>
            </ul>
          </li>
          <li>
            <strong>Procedury współpracy:</strong>
            <ul>
              <li>Wyznaczenie osoby odpowiedzialnej za kontakt z organami</li>
              <li>
                Dokumentowanie wszystkich działań zgodnie z wymogami prawa
              </li>
            </ul>
          </li>
        </ol>

        <hr />

        <h2>ROZDZIAŁ IX - PRYWATNOŚĆ I OCHRONA DANYCH</h2>
        <p>
          Możliwość pobrania w formacie PDF, druku oraz udostępnienia w
          alternatywnych formatach na żądanie
        </p>

        <hr />

        <h3>Kontakt</h3>
        <p>
          W sprawach związanych z Regulaminem oraz bezpieczeństwem prosimy o
          kontakt:{" "}
          <a className="underline" href="mailto:kontakt@tecza.app">
            kontakt@tecza.app
          </a>
        </p>
      </section>
    </div>
  )
}
