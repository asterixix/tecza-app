# Zaangażowane działanie w Tęcza.app

Fajnie że chcesz nam/mi/sobie pomóc przy tworzeniu tej apki! Zawsze co dwie głowy to nie jedna!

## Ważna zasada!

Szanujmy się nawzajem. Mowa nienawiści, dyskryminacja i nękanie są niedopuszczalne.

## Stack obecny

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- next-themes (Dark/Light/System)
- next-pwa (PWA)
- Supabase (Auth, Database z RLS, Storage)
- React Hook Form + Zod

## Dev environment

Wymagania:

- Node 18+ i npm
- Projekt Supabase (lokalny CLI lub hostowany)
- Plik `.env.local` z: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Instalacja i start:

```
npm install
npm run dev
```

Próba buildu:

```
npm run build
npm start
```

## Struktura repozytorium

- `src/app` — strony i komponenty App Router
- `src/components` — komponenty UI (shadcn/ui - używaj cli do instalacji komponentów z shadcn)
- `src/lib` — helpery (np. singleton Supabase)
- `supabase/migrations` — migracje SQL (porządek wg timestampów)

## Standardy UI/UX

- Język albo Angielski albo Polski - oba są okej
- Mobile-first, responsywność, WCAG 2.1 - nie wykluczajmy wykluczonych :<
- Semantyczny HTML, aria-labels, wyraźne focus rings, kontrast - jak wyżej
- Wsparcie trybu ciemnego - bo oczy bolą
- Formularze dostępne: jasne komunikaty błędów i etykiety - jak budowa cepa

## Zasady commitów i PR-ów

- Małe, skupione PR-y; osobne gałęzie na funkcje/poprawki - im więcej tym lepiej, łatwiej cofać fuckupy
- Opis kontekstu i zrzuty ekranu dla zmian UI - bardzo prosimy <3
- Przed PR-em uruchom `npm run build` (typy/lint) - nawet `npm start` i sprawdź czy to chociaż działa
- Dodawaj/aktualizuj testy przy zmianie publicznego zachowania - polecam skrobnąć teścik z playwrightem i zobaczyć czy wszystko chula
- Unikaj breaking changes bez uzasadnienia - nie rozpierd*laj połowy apki bo tak ci się podoba bo to nie przejdzie

## Migracje i baza danych

- Migracje w `supabase/migrations/` z rosnącymi timestampami
- Unikaj `CREATE POLICY IF NOT EXISTS` (zgodność ze starszym Postgres)
- RLS najmniejszego uprzywilejowania; opisz w PR-ach

## Wytyczne funkcjonalne

- Profile: respektuj prywatność (`profile_visibility`, `show_location`, `show_orientation`, `show_friends`)
- Posty: widoczność wymuszana przez RLS; paginacja i optimistic updates po stronie klienta
- Znajomi: używaj `friend_requests` (pending/accept) zamiast natychmiastowego połączenia
- Storage: buckety `avatars`, `covers`; pliki pod ścieżką `auth.uid()/...`

## PWA i debugowanie

- Gdy UI/CSS „zacina się” w dev: wyrejestruj SW i wyczyść storage w DevTools
- `suppressHydrationWarning` na `html`/`body` ogranicza rozjazdy hydratacji

## Bezpieczeństwo i prywatność

- Nie loguj sekretów ani danych wrażliwych
- Szanuj RLS — nie obchodź go po stronie klienta
- Luki w bezpieczeństwie zgłaszaj zgodnie z SECURITY.md

Dzięki za support! W kontakcie 💜
