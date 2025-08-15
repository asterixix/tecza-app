## Tęcza.app — bezpieczna, nowoczesna społeczność LGBTQ w Polsce

Tęcza.app to Progressive Web App (PWA) zbudowana na Next.js 15 i Supabase, projektowana jako bezpieczna, kolorowa i włączająca przestrzeń dla polskiej społeczności LGBTQ.

Repozytorium (nie)zawiera działające(go) MVP z fundamentami profili, postów, znajomych oraz logowania, wraz z planowanymi rozszerzeniami społeczności i wydarzeń. (co "nie" to będzie jak czas i energia pozwoli).

## Stack obecny

- Next.js 15 (App Router, Server/Client Components)
- Tailwind CSS v4 + shadcn/ui (dostępność i mobile-first)
- next-themes (Dark/Light/System)
- next-pwa (PWA, service worker, offline)
- Supabase (Auth, Database/RLS, Storage)
- React Hook Form + Zod (formularze i walidacja)

## Funkcje (MVP)

- Strona główna po polsku, dostępna i responsywna, z trybem ciemnym -> DONE
- Logowanie/rejestracja/reset hasła (OAuth scaffolding: Google/Discord) -> IN PROGRESS
- Pulpit z tworzeniem postów i kanałem postów (RLS egzekwuje widoczność) -> IN PROGRESS
- Profile użytkowników i Ustawienia (edycja danych, prywatność) -> IN PROGRESS
- Publiczne profile pod /u/[username] (bio, znaczniki, linki, posty) -> IN PROGRESS
- Połączenia/znajomi: aktywne krawędzie i (nowe) zaproszenia (pending/accept) -> PLANNED
- Upload avatar/okładka do Supabase Storage (publiczne URL-e) -> IN PROGRESS
- PWA: instalowalna, SW z cache (w tym dev wskazówki do resetu) -> PLANNED
- 2FA/TOTP UI i pełny przepływ -> PLANNED
- Markdown i link previews w postach/komentarzach -> PLANNED
- Społeczności i Wydarzenia (lokalne, wsparcie, aktywizm) -> PLANNED
- Wiadomości prywatne i grupowe (Realtime) -> PLANNED
- Moderacja treści i zgłoszenia (AI + manual) -> PLANNED
- Stories/Status, Marketplace/Resources, Live streaming -> PLANNED

## Szybki start (dev)

Wymagania: Node 18+, npm, oraz (opcjonalnie) Supabase CLI dla lokalnej bazy.

1) Zależności i środowisko

- Zainstaluj zależności i utwórz plik `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

2) Uruchom tryb deweloperski

```
npm run dev
```

Otwórz http://localhost:3000

3) Build produkcyjny

```
npm run build
npm run start
```

## CI/CD: Vercel + Supabase

W repo są 3 workflowy GitHub Actions:

- `.github/workflows/ci.yml` — lint + typecheck + build
- `.github/workflows/vercel-deploy.yml` — deploy Preview (PR) i Production (push na main) do Vercel
- `.github/workflows/supabase-deploy.yml` — push migracji i deploy Edge Functions do Supabase

Wymagane sekrety repozytorium (Settings → Secrets and variables → Actions):

- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`

Środowiska (Vercel): ustaw zmienne env w projekcie Vercel (Preview/Production) — te same co w `.env.example`.

## Supabase (lokalnie lub w chmurze)

Migrations znajdują się w `supabase/migrations/`.

Przykładowy workflow lokalny (Supabase CLI):

```
supabase start
supabase db reset
```

Uwaga: W politykach `CREATE POLICY IF NOT EXISTS` może nie być wspierane w starszym Postgres — unikamy tej składni w migracjach.

## PWA i SW (pomoc w dev)

Jeśli CSS lub UI wyglądają „stale” w dev, wyrejestruj service worker i wyczyść cache (DevTools → Application → Service Workers → Unregister; Clear storage). Następnie twardy reload.

## Dostępność i i18n

- Polskie UI jako domyślne, semantyczne landmarki, focus rings, aria-labels
- Mobile-first layout i WCAG 2.1

## Wkład i bezpieczeństwo

- Zobacz CONTRIBUTING.md (style, PR, standardy UI/UX, migrations)
- Zobacz SECURITY.md (odpowiedzialne ujawnianie)

## Licencja

Projekt jest na licencji MIT — szczegóły w LICENSE.
