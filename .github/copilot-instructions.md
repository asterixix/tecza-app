---
description: AI rules derived by SpecStory from the project AI interaction history
globs: *
---

## HEADERS

## TECH STACK
*   ThemeProvider with next-themes and a ThemeToggle
*   next-pwa
*   Tailwind v4 (@tailwindcss/postcss)
*   @supabase/supabase-js
*   shadcn/ui
*   React Hook Form
*   Zod

## PROJECT DOCUMENTATION & CONTEXT SYSTEM

## CODING STANDARDS

### General UI Standards
*   Create fluent, modern UI with the best UX.
*   Ensure all UI elements are mobile responsive.
*   Ensure all UI elements are accessible for disabled people (WCAG-friendly).
*   Ensure all UI elements are accessible for disabled people (WCAG 2.1 guidelines).
*   Implement a dark theme version for all UI elements.
*   Use semantic landmarks, aria-labels, focus styles, and a consistent heading hierarchy for accessibility.
*   Buttons/links must have clear focus rings and labels.
*   For logged-in users, create custom site headers with profile icons and menu options (Profil, Ustawienia, Wyloguj się) and dedicated header navigation and footers.
*   After successful login, the user should be redirected to the /dashboard page.

### Homepage Standards
*   The homepage should include an introduction to the application.
*   The homepage should describe the public feed lookup functionality.
*   The homepage should list the application's features.
*   The homepage should explain how users can contribute.
*   The homepage should be written in Polish.
*   The homepage should contain a header with navigation, a login button, and a logotype.
*   The homepage should contain a global small footer with a copyright notice.
*   The homepage must include a "skip to content" link.
*   The site language must be set to Polish and metadata/OG tags should be improved.
*   Add `suppressHydrationWarning` to the body to minimize hydration mismatches.
*   Make the footer year robust with a `<time>` element.

### Login/Register Page Standards
*   The login/register page should support OAuth login using Discord or Google.
*   The login/register page should support 2FA.
*   The login/register page should support "forgot password" functionality.
*   The login/register page must be accessible based on WCAG 2.1 guidelines.
*   The login/register page must be mobile responsive.
*   Develop register option to add possibility to choose username with tag and rebuild settings to block changing username, force only visible name and email (also private email).

### Dashboard Standards
*   The user dashboard should display a feed of new posts.
*   The user dashboard should include a composer for adding new posts with markdown and embed link support.
*   The post composer should allow users to set post visibility to public, friends, or custom.
*   User posts must be stored in the database.

### User Profile and Settings Standards
*   Implement user profile pages displaying user information.
*   Implement user settings pages allowing users to edit their profile information.
*   The header "Profil" option for logged in users should link to `/u/[username]`.
*   The old `/profile` page should be removed.
*   The `/u/[username]` page should:
    *   Display the user's avatar, cover, display name/username, and pronouns.
    *   Display the user's bio and badges for sexual orientation/gender identity (based on privacy flags).
    *   Optionally display the user's location, website, and social links.
    *   Include a "Połącz się" button wired to the friendships table; show "Połączeni" when already connected. This should implement a friend request flow (pending/accept/cancel) instead of instant connect.
    *   List recent posts for that user, limited to 20, with visibility enforced by RLS.
    *   Implement user profile editting background image, avatar image, adding information column, visible public post based on database, visible public list of connected friends based on database (based on user settings). Images locate in supabase storage functionality.
    *   Avatar image max size: 2MB.
    *   Cover image max size: 5MB.
*   The settings page should:
    *   Include form fields for: username, display_name, bio, pronouns, profile_visibility (public/friends/private), city, country, website, public email, social links (instagram/twitter/tiktok), and toggles for show_location, show_orientation and show_friends.
    *   Load the current user's profile and reset defaults on page load.
    *   Update the `profiles` table with controlled inputs (null-safe) and a `social_links` JSON on save.
    *   Include a secondary button "Podgląd" to jump to /profile.
    *   Normalize null/undefined values to empty strings to satisfy controlled input types.
    *   Support avatar and cover image file uploads to Supabase Storage.
    *   Avatar image max size: 2MB.
    *   Cover image max size: 5MB.
    *   Build full functional user settings with options to change user details, accessibility settings, 2fa options, oauth connections, change password, privacy settings, delete account (with full clearing data).

### Community Standards
*   The header should include a "Społeczności" link.

## WORKFLOW & RELEASE RULES

## DEBUGGING
*   To minimize hydration mismatches: add `suppressHydrationWarning` to the body and html.
*   To further minimize hydration mismatches, the theme toggle should render a neutral, static button until the client mounts, then switch to the dynamic label/icons. Add `suppressHydrationWarning` on the button for extra safety.
*   If CSS is not loading properly on the homepage:
    *   Kill stale service worker that can serve old HTML.
        1.  Chrome/Edge: open the site, press F12 → Application (or Application > Service Workers)
        2.  Under Service Workers, click “Unregister” for your site
        3.  Also clear storage: Application > Clear storage → check “Unregister service workers” + “Cache storage” + “IndexedDB” → Clear site data
        4.  Alternatively, open in an Incognito window to test fresh
    *   Restart the dev server in Webpack mode
        1.  `npm run dev`
        2.  If it errors, try a clean:
            `rd /s /q .next`
            `npm run dev`
    *   Hard reload your browser
        1.  Windows: Ctrl+F5 (or Shift+Refresh) on the home page
        2.  Verify that you see:
            *   Polish hero: “Tęcza.app — bezpieczna, nowoczesna społeczność…”
            *   Header with logo, nav, Zaloguj
            *   Footer with copyright
    *   If it still shows the stock page
        1.  Verify you’re opening the running dev URL (usually http://localhost:3000/) and not a static file/old build tab.
        2.  Try a private window.
        3.  Check the DevTools Network tab (Disable cache) and reload—confirm /_next/* assets load and there’s no 404 for /_next/app-build-manifest.json.
*   To fix "useSearchParams should be wrapped in a suspense boundary" on the 404 page: remove `useSearchParams` and read query params via `window.location` in `useEffect` after mount.
*   When encountering a "Multiple GoTrueClient instances detected" error, review the Supabase browser client helper (`supabase-browser.ts`) for potential multiple client instantiations. Use a singleton with storageKey "tecza-app-auth" to avoid this warning.
*   When encountering `Event handlers cannot be passed to Client Component props` error, do not pass functions from Server Components to Client Components during prerender. Client components should handle their own interactivity, or you can invoke client-server actions via server actions, not as props.
*   If local Supabase fails due to a Postgres version mismatch (data dir init’d with v17, container expects v15), reset the local DB volume by removing the supabase_db_tecza-app Docker volume and restarting Supabase. Also, disable analytics in `config.toml` to avoid the vector “unhealthy” loop during local dev.
*   If migrations fail due to `create policy if not exists ...` errors, remove `IF NOT EXISTS` from policy statements in the migration files. PostgreSQL versions prior to 16 do not support this syntax.
*   If facing issues with homepage not loading or CSS not loading properly:
    *   Kill stale service worker that can serve old HTML.
        1.  Chrome/Edge: open the site, press F12 → Application (or Application > Service Workers)
        2.  Under Service Workers, click “Unregister” for your site
        3.  Also clear storage: Application > Clear storage → check “Unregister service workers” + “Cache storage” + “IndexedDB” → Clear site data
        4.  Alternatively, open in an Incognito window to test fresh
    *   Restart the dev server in Webpack mode
        1.  `npm run dev`
        2.  If it errors, try a clean:
            `rd /s /q .next`
            `npm run dev`
    *   Hard reload your browser
        1.  Windows: Ctrl+F5 (or Shift+Refresh) on the home page
        2.  Verify that you see:
            *   Polish hero: “Tęcza.app — bezpieczna, nowoczesna społeczność…”
            *   Header with logo, nav, Zaloguj
            *   Footer with copyright
    *   If it still shows the stock page
        1.  Verify you’re opening the running dev URL (usually http://localhost:3000/) and not a static file/old build tab.
        2.  Try a private window.
        3.  Check the DevTools Network tab (Disable cache) and reload—confirm /_next/* assets load and there’s no 404 for /_next/app-build-manifest.json.
*   When encountering a "Multiple GoTrueClient instances detected" error, review the Supabase browser client helper (`supabase-browser.ts`) for potential multiple client instantiations. Use a singleton with storageKey "tecza-app-auth" to avoid this warning.